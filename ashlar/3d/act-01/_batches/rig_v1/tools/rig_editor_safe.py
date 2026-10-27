"""Start the skill's rig editor on an exported _rig.json with its Blender buttons pointed AWAY from 9876.

python rig_editor_safe.py <x_rig.json> [--port 8766] [--blender-port 9899] [--token T]

Why: the editor's server.py talks to Blender on a fixed port 9876; on this machine that port belongs to another
thread's live Blender (unsaved work). "Ap dung vao Blender" would also run the skill's reweight_after_edit,
which does not know the batch's per-asset weight rules. Here the Blender buttons go to an unused port and
fail harmlessly; "Luu" still writes <x>_joints.json, which the batch tools apply (run_stage s3..s6).
The skill's server.py is loaded as a module, not modified.

--token: for a public tunnel (user remote, no shared network). The server's API reads and writes files by path,
so with a token every request needs the cookie rbk=<token> (set by opening /?k=<token> once), only the joint-editing
endpoints are open (page, data, textures, anims/springs read, save joints/springs) and any `file` argument must be
the rig file given on the command line.

--batch (local only, user at the machine): "Ap dung vao Blender" does what the batch does with saved joints instead
of the skill's reweight: writes <x>_joints.json, runs run_stage s3..s6 with RB_EDITOR_JOINTS, re-exports the editor
JSON and the G2 sheets, notes it in rig.log, and swaps the new character into the open Blender check window
(gui_open.py link on 9899: view, mode, selection and pose kept); with no linked window it opens one. "Tai tu Blender"
exports the rig of that window (bones moved there included); with no linked window it reloads the last build.
"""
import sys, os, io, json, gzip, shutil, argparse, importlib.util
from urllib.parse import urlparse, parse_qs

SERVER = os.path.expanduser(r'~/.claude/skills/blender-character-rigging/tools/rig_editor/server.py')
ap = argparse.ArgumentParser()
ap.add_argument('file'); ap.add_argument('--port', type=int, default=8766); ap.add_argument('--blender-port', type=int, default=9899)
ap.add_argument('--no-browser', action='store_true'); ap.add_argument('--token', default=None)
ap.add_argument('--tex-max', type=int, default=1024, help='with --token: textures downscaled to this size (slow tunnels)')
ap.add_argument('--batch', action='store_true', help='local only: the Blender buttons run the batch rebuild (see above)')
ap.add_argument('--label', default=None, help='with --batch: G2 sheet title (default from the asset id)')
a = ap.parse_args()
if a.batch and a.token:
    ap.error('--batch is for local use and cannot be combined with --token')
spec = importlib.util.spec_from_file_location('rig_editor_server', SERVER)
srv = importlib.util.module_from_spec(spec); spec.loader.exec_module(srv)
srv.BLENDER = ('127.0.0.1', a.blender_port)

if a.token:
    LOCK = os.path.normcase(os.path.abspath(a.file))
    ALLOW_GET = {'/', '/index.html', '/spring-bone.js', '/api/state', '/api/data', '/api/tex', '/api/anims', '/api/springs',
                 '/api/blender/ping'}
    ALLOW_POST = {'/api/save', '/api/springs/save'}
    Base = srv.H

    TEX = {}

    class Gated(Base):
        def _send(self, code, body, ctype='application/json; charset=utf-8'):
            # free tunnels run at ~10 KB/s: gzip JSON/HTML/JS (rig JSON 1.1 MB -> 0.2 MB); images may be cached
            data = body if isinstance(body, bytes) else json.dumps(body).encode('utf-8')
            gz = 'gzip' in (self.headers.get('Accept-Encoding') or '') and len(data) > 2048 and not ctype.startswith('image/')
            if gz:
                data = gzip.compress(data, 6)
            self.send_response(code)
            self.send_header('Content-Type', ctype)
            if gz:
                self.send_header('Content-Encoding', 'gzip')
            self.send_header('Content-Length', str(len(data)))
            self.send_header('Cache-Control', 'private, max-age=3600' if ctype.startswith('image/') else 'no-store')
            self.end_headers()
            self.wfile.write(data)

        def _tex_small(self, q):
            # the 4096 px base colour is 2.2 MB: serve a cached <= tex_max px JPEG instead
            f = q.get('file', [srv.STATE['file']])[0]; name = os.path.basename(q.get('name', [''])[0])
            p = os.path.join(os.path.splitext(f)[0] + '_tex', name) if f and name else ''
            if not os.path.isfile(p):
                return self._send(404, {'error': 'texture not found'})
            if p not in TEX:
                from PIL import Image
                im = Image.open(p); im.thumbnail((a.tex_max, a.tex_max)); buf = io.BytesIO()
                if im.mode in ('RGBA', 'LA', 'P'):
                    im.save(buf, 'PNG', optimize=True); TEX[p] = (buf.getvalue(), 'image/png')
                else:
                    im.convert('RGB').save(buf, 'JPEG', quality=82); TEX[p] = (buf.getvalue(), 'image/jpeg')
            data, ct = TEX[p]
            return self._send(200, data, ct)

        def _auth(self, q):
            if q.get('k', [''])[0] == a.token:
                return 'set'
            jar = [c.strip() for c in (self.headers.get('Cookie') or '').split(';')]
            return 'ok' if 'rbk=' + a.token in jar else None

        def _file_ok(self, f):
            return f is None or os.path.normcase(os.path.abspath(f)) == LOCK

        def do_GET(self):
            u = urlparse(self.path); q = parse_qs(u.query); st = self._auth(q)
            if st is None or u.path not in ALLOW_GET or not self._file_ok(q.get('file', [None])[0]):
                return self._send(403, {'error': 'forbidden'})
            if st == 'set':                       # first visit: cookie for the page's own fetches, then a clean URL
                self.send_response(302)
                self.send_header('Set-Cookie', f'rbk={a.token}; Path=/; HttpOnly; Secure; SameSite=Lax')
                self.send_header('Location', '/'); self.send_header('Content-Length', '0'); self.end_headers()
                return
            if u.path == '/api/tex':
                return self._tex_small(q)
            return Base.do_GET(self)

        def do_POST(self):
            u = urlparse(self.path); q = parse_qs(u.query)
            if self._auth(q) is None or u.path not in ALLOW_POST:
                return self._send(403, {'error': 'forbidden'})
            raw = self.rfile.read(int(self.headers.get('Content-Length') or 0))
            try:
                f = json.loads(raw.decode('utf-8') or '{}').get('file')
            except ValueError:
                return self._send(400, {'error': 'bad body'})
            if not self._file_ok(f):
                return self._send(403, {'error': 'forbidden'})
            self.rfile = io.BytesIO(raw)          # the base handler reads the body again
            return Base.do_POST(self)

    srv.H = Gated                                 # main() builds the server from the module-global H

if a.batch:
    import re, time, base64, socket, threading, subprocess
    TOOLS = os.path.dirname(os.path.abspath(__file__))
    ROOT = os.path.abspath(os.path.join(TOOLS, *['..'] * 6))
    BLENDER_EXE = r'C:\Program Files\Blender Foundation\Blender 5.1\blender.exe'
    GUI_OPEN = os.path.join(TOOLS, 'gui_open.py'); LINK_PORT = 9899      # gui_open.py's batch link
    RIG_JSON = os.path.abspath(a.file)
    ADIR = os.path.dirname(os.path.dirname(RIG_JSON)); AID = os.path.basename(ADIR)
    BLEND = os.path.join(ADIR, 'rig', AID + '_rig.blend')
    WORK = os.path.join(ROOT, 'tmp', 'rig_v1', AID)
    LABEL = a.label or ' '.join([AID.split('_')[0]] + [w.capitalize() for w in AID.split('_')[1:]])
    with open(os.path.join(TOOLS, 'assets', AID + '.py'), encoding='utf-8') as fh:     # editor_export k = H / 1.8
        src = fh.read()                                                                 # (K_HEIGHT wins, as in spring_layers)
        K = '%g' % round(float((re.search(r'^K_HEIGHT\s*=\s*([\d.]+)', src, re.M) or re.search(r'^HEIGHT_M\s*=\s*([\d.]+)', src, re.M)).group(1)) / 1.8, 4)
    BUSY = threading.Lock()
    # the page's texts describe the skill's push; the push toast also has to stay up for the whole rebuild
    PAGE = [("toast(t('pushing'));", "toast(t('pushing'), '', 600000);"),
            ("pushing:'Đang áp dụng trong Blender…'", "pushing:'Đang rig lại theo batch (s3–s6, khoảng 1–2 phút)…'"),
            ("clothNote:'Part vải chưa tính lại (làm ở bước vải).'",
             "clothNote:'Batch: weight, vải và QA đã tính lại; nhân vật trong cửa sổ Blender đã được thay bằng bản mới.'"),
            ("pushing:'Applying in Blender…'", "pushing:'Rebuilding with the batch (s3–s6, about 1–2 min)…'"),
            ("clothNote:'Cloth parts were not recomputed (done in the cloth stage).'",
             "clothNote:'Batch: weights, cloth and QA recomputed; the character in the Blender window was swapped for the new one.'")]

    def _ps(script, timeout=60):
        enc = base64.b64encode(script.encode('utf-16-le')).decode('ascii')
        return subprocess.run(['powershell', '-NoProfile', '-NonInteractive', '-EncodedCommand', enc], capture_output=True,
                              text=True, encoding='utf-8', errors='replace', timeout=timeout).stdout

    def _windows():
        """(pid, title) of the Blender windows showing BLEND; a leading '*' in the title = unsaved changes."""
        out = _ps("Get-Process blender -ErrorAction SilentlyContinue | ForEach-Object { '{0}|{1}' -f $_.Id, $_.MainWindowTitle }")
        key = os.path.normcase(BLEND); res = []
        for line in out.splitlines():
            pid, _, title = line.partition('|')
            if pid.strip().isdigit() and key in os.path.normcase(title):
                res.append((int(pid), title.strip()))
        return res

    def _link(cmd, timeout=120):
        """One request to the check window's batch link (gui_open.py); None when no window listens."""
        try:
            c = socket.create_connection(('127.0.0.1', LINK_PORT), timeout=2)
        except OSError:
            return None
        try:
            c.settimeout(timeout); c.sendall((json.dumps(cmd) + '\n').encode('utf-8')); buf = b''
            while not buf.endswith(b'\n'):
                chunk = c.recv(65536)
                if not chunk:
                    break
                buf += chunk
            return json.loads(buf.decode('utf-8') or '{}')
        except (OSError, ValueError) as e:
            return dict(ok=False, error=str(e))
        finally:
            c.close()

    def _to_blender():
        """Swap the character in the open check window; without a linked window, open one on the new file."""
        r = _link({'cmd': 'reload', 'file': BLEND})
        if r is not None:
            if r.get('ok'):
                return ('đã thay nhân vật trong cửa sổ đang mở (giữ góc nhìn, chế độ, pose)'
                        + (f"; bỏ part cũ {r['removed']}" if r.get('removed') else ''))
            return f"cửa sổ Blender báo lỗi khi nạp lại ({r.get('error')}): File > Revert để xem bản mới"
        wins = _windows()                         # windows without the link (opened by hand or by an older helper)
        dirty = [p for p, t in wins if t.startswith('*')]
        if dirty:
            return f'cửa sổ Blender {dirty} chưa có kết nối và có thay đổi chưa lưu nên không đóng: File > Revert để xem bản mới'
        for p, _ in wins:
            subprocess.run(['taskkill', '/PID', str(p), '/F'], capture_output=True)
        time.sleep(1.0 if wins else 0.0)
        # Start-Process: the window is not a child of this server, so it outlives it
        _ps("Start-Process -FilePath '%s' -ArgumentList '\"%s\"','--python','\"%s\"'" % (BLENDER_EXE, BLEND, GUI_OPEN))
        return 'đã mở lại bản mới' if wins else 'đã mở bản mới'

    def _run(cmd, log, env=None, timeout=900):
        with open(log, 'w', encoding='utf-8', errors='replace') as fh:
            subprocess.run(cmd, cwd=ROOT, env=env, stdout=fh, stderr=subprocess.STDOUT, timeout=timeout)
        with open(log, encoding='utf-8', errors='replace') as fh:
            return fh.read()

    def _mesh_sig(path):
        with open(path, encoding='utf-8') as fh:
            return {m['name']: (len(m['verts']), len(m['tris'])) for m in json.load(fh).get('meshes', [])}

    def _window_edited():
        """Mesh edited by hand in the linked window (2026-10-27: a rebuild swapped away the user's mesh clean-up on U03)?
        Pull the window's rig and compare vertex/triangle counts with the last build; the build's JSON is put back."""
        bak = RIG_JSON + '.prepush'
        shutil.copy(RIG_JSON, bak)
        try:
            before = _mesh_sig(RIG_JSON)
            r = _link({'cmd': 'pull', 'k': float(K)})
            if not (r and r.get('ok')):
                return None
            after = _mesh_sig(RIG_JSON)
            diff = {n: (before.get(n), after.get(n)) for n in set(before) | set(after) if before.get(n) != after.get(n)}
            return diff or None
        finally:
            for i in range(10):               # Blender may still hold the file it just wrote (Errno 22 on U03)
                try:
                    shutil.copy(bak, RIG_JSON); break
                except OSError:
                    time.sleep(0.5)
            os.remove(bak)

    def batch_push(b):
        edited = _window_edited()
        if edited:
            raise RuntimeError('Mesh trong cửa sổ Blender khác bản dựng (' + ', '.join(f'{n.split("_")[-1]}: {a} -> {c}' for n, (a, c) in edited.items())
                               + '). Không rig lại để khỏi ghi đè chỉnh sửa của bạn: báo Claude phần mesh đã sửa để đưa vào cấu hình.')
        t0 = time.time(); jp = srv.joints_path(RIG_JSON)
        if os.path.isfile(jp):
            shutil.copy(jp, jp + '.bak')
        with open(jp, 'w', encoding='utf-8') as fh:
            json.dump({'rig': b.get('rig'), 'joints': b['joints'], 'saved': time.strftime('%Y-%m-%d %H:%M:%S')}, fh, indent=1)
        with open(RIG_JSON, encoding='utf-8') as fh:
            old = json.load(fh).get('joints') or {}
        dist = lambda p, q: sum((x - y) ** 2 for x, y in zip(p, q)) ** 0.5
        moved = {k: round(dist(v, old[k]) * 100, 2) for k, v in b['joints'].items() if k in old and dist(v, old[k]) > 5e-4}
        os.makedirs(WORK, exist_ok=True)
        env = dict(os.environ, RB_EDITOR_JOINTS=jp, RB_QA_TOP='2'); qa = {}
        for s in ('s3', 's4', 's5', 's6'):
            out = _run([BLENDER_EXE, '-b', '--factory-startup', '-P', os.path.join(TOOLS, 'run_stage.py'), '--', AID, s],
                       os.path.join(WORK, s + '.log'), env)
            if 'STAGE_OK' not in out:
                raise RuntimeError(f'{s} lỗi (log {os.path.join(WORK, s + ".log")}): ' + ' | '.join(out.strip().splitlines()[-4:])[-400:])
            if s == 's5':
                qa = {m.group(1): float(m.group(2)) for m in re.finditer(r'^(\w+)\s+stretch\s+([\d.]+)', out, re.M)}
        win = _to_blender()                       # the window first; export and sheets read the same file
        for _ in range(3):                    # the texture copy can hit a file Blender/the page still holds (D02)
            out = _run([BLENDER_EXE, '-b', '--factory-startup', BLEND, '-P', os.path.join(TOOLS, 'editor_export.py'), '--', K],
                       os.path.join(WORK, 'export_ed.log'))
            if 'EDITOR_JSON' in out:
                break
            time.sleep(2)
        if 'EDITOR_JSON' not in out:
            raise RuntimeError('editor_export lỗi: ' + out.strip()[-300:])
        _run([sys.executable, '-E', os.path.join(TOOLS, 'g2_sheets.py'), ADIR, AID, LABEL], os.path.join(WORK, 'g2_sheets.log'), timeout=300)
        worst = max(qa.items(), key=lambda kv: kv[1]) if qa else ('-', 0.0)
        with open(os.path.join(ADIR, 'rig', 'rig.log'), 'a', encoding='utf-8') as fh:
            fh.write(f"note {time.strftime('%Y-%m-%d %H:%M')} (user, rig editor push): rebuilt s3-s6 with RB_EDITOR_JOINTS="
                     f"{os.path.basename(jp)}, moved (cm) {moved}; QA stretch {qa}\n")
        return {'moved_cm': moved, 'saved': BLEND, 'joints_file': jp,
                'reweight': {'batch': f's3–s6 + editor JSON + G2: {time.time() - t0:.0f} s',
                             'QA max': f'{worst[0]} {worst[1]:.2f}×', 'Blender': win}}

    class Batch(srv.H):
        def do_GET(self):
            u = urlparse(self.path)
            if u.path in ('/', '/index.html'):
                with open(os.path.join(srv.HERE, 'index.html'), encoding='utf-8') as fh:
                    html = fh.read()
                for old, new in PAGE:
                    html = html.replace(old, new)
                return self._send(200, html.encode('utf-8'), 'text/html; charset=utf-8')
            if u.path == '/api/blender/ping':      # green when a check window with the batch link is open
                r = _link({'cmd': 'ping'}, timeout=3)
                return self._send(200, {'ok': bool(r and r.get('ok')), 'file': (r or {}).get('file')})
            return super().do_GET()

        def do_POST(self):
            u = urlparse(self.path)
            if u.path in ('/api/anim/create', '/api/anim/delete', '/api/blender/anims'):
                # the window link runs no code, and every rebuild rewrites the .blend (actions would be lost): animation
                # is its own step (rig-anim G3), not part of the batch rig loop
                return self._send(400, {'error': 'Tạo/xoá animation chưa nối ở chế độ batch: cửa sổ Blender chỉ nhận nạp lại/đọc rig, '
                                                 'và mỗi lần rig lại tệp .blend được dựng lại (action sẽ mất). Animation là bước riêng '
                                                 'sau khi rig xong: báo Claude để bắt đầu.'})
            if u.path not in ('/api/blender/push', '/api/blender/pull'):
                return super().do_POST()
            try:
                b = self._body()
                if u.path == '/api/blender/pull':     # the open check window's rig; without one, the last build
                    r = _link({'cmd': 'pull', 'k': float(K)})
                    if r and r.get('ok'):
                        return self._send(200, {'path': r['path'], 'rig': r['rig']})
                    if r is not None and r.get('error') != 'unknown command':
                        return self._send(500, {'error': 'cửa sổ Blender báo lỗi khi xuất rig: ' + str(r.get('error'))})
                    with open(RIG_JSON, encoding='utf-8') as fh:   # no window, or one opened by an older helper
                        return self._send(200, {'path': RIG_JSON, 'rig': json.load(fh).get('rig')})
                f = b.get('file') or srv.STATE['file']
                if not f or os.path.normcase(os.path.abspath(f)) != os.path.normcase(RIG_JSON):
                    return self._send(400, {'error': 'Batch chỉ áp dụng cho ' + os.path.basename(RIG_JSON)})
                if not BUSY.acquire(blocking=False):
                    return self._send(409, {'error': 'Đang rig lại, đợi xong rồi bấm lại.'})
                try:
                    return self._send(200, batch_push(b))
                finally:
                    BUSY.release()
            except Exception as e:
                return self._send(500, {'error': str(e)})

    srv.H = Batch

sys.argv = ['server.py', os.path.abspath(a.file), '--port', str(a.port)] + (['--no-browser'] if a.no_browser else [])
print(f'rig editor (safe): http://127.0.0.1:{a.port}/  file {a.file}  '
      + (f'Blender buttons -> batch rebuild of {AID} (k {K}, label {LABEL!r})' if a.batch
         else f'Blender buttons -> port {a.blender_port} (unused)')
      + ('  token gate ON' if a.token else ''), flush=True)
srv.main()
