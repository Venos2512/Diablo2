"""Static code / doc patches of reorg round 3 (loaded by reorg_2026-10-24c.py).

file = path BEFORE the moves; old = text AFTER the engine's path rewrites (an LF string also matches a CRLF file);
new = replacement. Each patch must match exactly once or --apply aborts. Every entry says why a token rewrite cannot do it.
"""

CODEX = 'ashlar/pipeline/codex/'
TRIPO = 'ashlar/pipeline/tripo/'
TPOSE = '.agents/skills/generate-tpose-for-tripo/'
KIT = 'ashlar/3d/props/act1_kit_v1/'
EXTRAS_DIR = 'ashlar/3d/props/act1_extras_v1/'
LAB = 'lookdev-lab/'
ENVB = 'ashlar/art/act-01/environments/'


def P(file, old, new, why):
    return dict(file=file, old=old, new=new, why=why)


PATCHES = []
add = PATCHES.append

# ------------------------------------------------------------------ Codex tools: sidecars to <image dir>/_work/
add(P(CODEX + 'astra_batch.py',
      "    (folder / f'{stem}.task.txt').write_text(task, encoding='utf-8')\n"
      "    shutil.copyfile(prompt_path, folder / f'{stem}.prompt.txt')\n",
      "    work = folder / '_work'  # sidecars (task, prompt copy, log, result) sit beside the image, not among the finals\n"
      "    work.mkdir(parents=True, exist_ok=True)\n"
      "    (work / f'{stem}.task.txt').write_text(task, encoding='utf-8')\n"
      "    shutil.copyfile(prompt_path, work / f'{stem}.prompt.txt')\n",
      'RUNTIME: task and prompt copy go to <out dir>/_work/'))
add(P(CODEX + 'astra_batch.py',
      "        log_path = folder / f'{stem}.generation{tag}.log'\n        result_path = folder / f'{stem}.result{tag}.txt'\n",
      "        log_path = work / f'{stem}.generation{tag}.log'\n        result_path = work / f'{stem}.result{tag}.txt'\n",
      'RUNTIME: generation log and result text go to <out dir>/_work/'))
add(P(CODEX + 'build_prompt.py',
      "    src = out.parent / f'{out.stem}.prompt.src.txt'\n",
      "    src = out.parent / '_work' / f'{out.stem}.prompt.src.txt'  # sidecars live in <out dir>/_work/\n",
      'RUNTIME: the assembled prompt is a sidecar of the image'))
add(P(CODEX + 'tests/test_build_prompt.py',
      "    text = Path(jobs[0]['promptPath']).read_text(encoding='utf-8')\n    assert 'INPUT IMAGES' in text and 'image 1 = guide' in text\n",
      "    text = Path(jobs[0]['promptPath']).read_text(encoding='utf-8')\n"
      "    assert Path(jobs[0]['promptPath']).parent == tmp_path / '_work'  # prompt.src.txt is a sidecar: <out dir>/_work/\n"
      "    assert Path(jobs[0]['promptPath']).name == 'b.prompt.src.txt' and not (tmp_path / 'b.prompt.src.txt').exists()\n"
      "    assert 'INPUT IMAGES' in text and 'image 1 = guide' in text\n",
      'test: the prompt source lands in _work/'))
add(P(CODEX + 'tests/test_astra_batch.py',
      "    ab.stop.set()\n    try:\n        ab.run_job({'id': 'a', 'promptPath': 'p.txt', 'outputPath': 'out/a.png'}, 2, 5)\n    finally:\n"
      "        ab.stop.clear()\n    assert not (tmp_path / 'out').exists()\n",
      "    ab.stop.set()\n    try:\n        ab.run_job({'id': 'a', 'promptPath': 'p.txt', 'outputPath': 'out/a.png'}, 2, 5)\n    finally:\n"
      "        ab.stop.clear()\n    assert not (tmp_path / 'out').exists()\n\n\n"
      "def test_sidecars_go_to_work_folder(tmp_path, monkeypatch):\n"
      "    class Done:\n        returncode = 0\n\n"
      "    def fake_run(cmd, input=None, stdout=None, **kw):\n        stdout.write(b'session id: none\\nno image today\\n')\n        return Done()\n\n"
      "    monkeypatch.setitem(ab.CFG, 'base', tmp_path)\n    monkeypatch.setitem(ab.CFG, 'status', tmp_path / 's.jsonl')\n"
      "    monkeypatch.setitem(ab.CFG, 'home', tmp_path / 'home')\n    monkeypatch.setitem(ab.CFG, 'workdir', tmp_path)\n"
      "    monkeypatch.setattr(ab.subprocess, 'run', fake_run)\n    (tmp_path / 'p.txt').write_text('x', encoding='utf-8')\n"
      "    ab.run_job({'id': 'a', 'promptPath': 'p.txt', 'outputPath': 'out/a.png'}, 1, 5)\n"
      "    names = sorted(p.name for p in (tmp_path / 'out' / '_work').iterdir())\n"
      "    assert names == ['a.generation.log', 'a.prompt.txt', 'a.task.txt']\n"
      "    assert [p.name for p in (tmp_path / 'out').iterdir()] == ['_work']  # nothing but the _work folder beside the (missing) image\n",
      'test: task, prompt and log sidecars are written to <out dir>/_work/'))
add(P(CODEX + 'README.md',
      '`<tên>.prompt.src.txt` và ghi job vào jobfile.',
      '`<thư mục ảnh>/_work/<tên>.prompt.src.txt` và ghi job vào jobfile.',
      'prose: where the prompt source goes'))
add(P(CODEX + 'README.md',
      'copy PNG ra `outputPath`, ghi `tokens` vào status.',
      'copy PNG ra `outputPath`, ghi `tokens` vào status. Mọi file phụ (prompt, task, log generation, result, `qa_*.txt`) nằm trong `<thư mục ảnh>/_work/`; thư mục ảnh chỉ giữ ảnh thành phẩm.',
      'prose: sidecars live in _work/'))
add(P('.claude/skills/concept-art/SKILL.md',
      'Ghi `qa_<hậu tố>.txt` cạnh ảnh (PASS/FAIL,',
      'Ghi `_work/qa_<hậu tố>.txt` trong thư mục của ảnh (file phụ prompt, task, log, result cũng ở `_work/`; ngoài `_work/` chỉ có ảnh thành phẩm) (PASS/FAIL,',
      'prose: QA file goes to _work/'))

# ------------------------------------------------------------------ 2D batch runner: sidecars to _work/ too
ACT = ENVB + 'A01-A14/act01_batch.py'
add(P(ACT,
      "        if not any((folder / f'{stem}{tag}{s}').exists() or any(folder.glob(f'{stem}{tag}.attempt*{s}'))\n"
      "                   for s in SIDECAR_SUFFIXES):\n",
      "        if not any((d / f'{stem}{tag}{s}').exists() or any(d.glob(f'{stem}{tag}.attempt*{s}'))\n"
      "                   for s in SIDECAR_SUFFIXES for d in (folder, folder / '_work')):  # sidecars live in _work/ (older ones may sit beside the image)\n",
      'RUNTIME: the fresh-tag check looks in both places'))
add(P(ACT,
      "    tag = fresh_tag(folder, stem)\n    for name, content in",
      "    tag = fresh_tag(folder, stem)\n    work = folder / '_work'\n    work.mkdir(exist_ok=True)\n    for name, content in",
      'RUNTIME: sidecar folder'))
add(P(ACT, "        with open(folder / name, 'x', encoding='utf-8', newline='') as f:\n",
      "        with open(work / name, 'x', encoding='utf-8', newline='') as f:\n", 'RUNTIME: task and prompt sidecars into _work/'))
add(P(ACT, "        log_path = folder / f'{stem}{atag}.generation.log'\n        result_path = folder / f'{stem}{atag}.result.txt'\n",
      "        log_path = work / f'{stem}{atag}.generation.log'\n        result_path = work / f'{stem}{atag}.result.txt'\n",
      'RUNTIME: log and result sidecars into _work/'))
ANCHOR1 = chr(10) + '## 1. Gồm những gì' + chr(10)
ANCHOR2 = chr(10) + '## 1. Cái gì và vì sao' + chr(10)
for rng, anchor in (('A01-A14', ANCHOR1), ('A15-A20', ANCHOR2), ('A21-A25', ANCHOR2)):
    add(P(ENVB + rng + '/README_VI.md', anchor,
          chr(10) + '> **Vị trí sau sắp xếp 2026-10-24 (vòng 3):** thư mục này là hạ tầng của lô (`ashlar/art/act-01/_batches/env_%s/`). Ảnh của từng nhóm nằm ở '
          '`ashlar/art/act-01/environments/<id>_<slug>/` (chỗ nào trong tài liệu này ghi `groups/<id>_<slug>/` thì đọc là thư mục đó); '
          'file phụ (`*.prompt.txt`, `*.task.txt`, `*.generation.log`, `*.result.txt`, `*qa*.txt`) nằm trong `_work/` của nhóm.' % rng + chr(10) + anchor,
          'prose: groups/ moved out of the batch folder'))

# ------------------------------------------------------------------ NPC review index builder (reads QA.txt / prompts)
NPC = 'ashlar/art/npcs/_brief/build_npc_review_index.py'
add(P(NPC, '(ROOT / folder / "QA.txt").is_file()', '(ROOT / folder / "_work" / "QA.txt").is_file()', 'RUNTIME: QA.txt moved to <npc>/_work/'))
add(P(NPC, '"promptA": f"{folder}/{a[:-4]}.prompt.txt",\n            "promptB": f"{folder}/{b[:-4]}.prompt.txt",\n            "qa": f"{folder}/QA.txt",',
      '"promptA": f"{folder}/_work/{a[:-4]}.prompt.txt",\n            "promptB": f"{folder}/_work/{b[:-4]}.prompt.txt",\n            "qa": f"{folder}/_work/QA.txt",',
      'RUNTIME: prompt and QA sidecars moved to <npc>/_work/ (index.html + manifest.json are regenerated by this script)'))

# ------------------------------------------------------------------ Tripo scripts: tripo.log to <asset>/_work/
add(P(TRIPO + 'scripts/tripo_asset_finish.sh',
      'log() { echo "[$(date +%H:%M:%S)] $n: $*" | tee -a "$dir/tripo.log"; }',
      'mkdir -p "$dir/_work"  # sidecars (tripo.log, ...) live in <asset>/_work/\nlog() { echo "[$(date +%H:%M:%S)] $n: $*" | tee -a "$dir/_work/tripo.log"; }',
      'RUNTIME: tripo.log is a sidecar'))
add(P(TRIPO + 'scripts/tripo_multiview.sh', 'mkdir -p "$dir/_shots"\n', 'mkdir -p "$dir/_shots" "$dir/_work"  # tripo.log and the other sidecars live in <asset>/_work/\n',
      'RUNTIME: _work folder'))
add(P(TRIPO + 'scripts/tripo_multiview.sh', 'log() { echo "[$(date +%H:%M:%S)] $*" | tee -a "$dir/tripo.log"; }',
      'log() { echo "[$(date +%H:%M:%S)] $*" | tee -a "$dir/_work/tripo.log"; }', 'RUNTIME: tripo.log is a sidecar'))
add(P(TRIPO + 'scripts/tripo_multiview.sh', "return location.pathname\" | tr -d '\"' | tee -a \"$dir/tripo.log\"",
      "return location.pathname\" | tr -d '\"' | tee -a \"$dir/_work/tripo.log\"", 'RUNTIME: tripo.log is a sidecar'))
add(P(TPOSE + 'scripts/run_session.sh', "# Log: <asset_dir>\\_tasks\\skill_session.log ; Astra's final reply: <asset_dir>\\_tasks\\skill_session.result.txt",
      "# Log: <asset_dir>\\_work\\_tasks\\skill_session.log ; Astra's final reply: <asset_dir>\\_work\\_tasks\\skill_session.result.txt",
      'RUNTIME: session sidecars go to <asset>/_work/_tasks'))
add(P(TPOSE + 'scripts/run_session.sh', 'mkdir -p "$A/_tasks"', 'mkdir -p "$A/_work/_tasks"', 'RUNTIME: session sidecars go to <asset>/_work/_tasks'))
add(P(TPOSE + 'scripts/run_session.sh',
      '-o "$A/_tasks/skill_session.result.txt" - <<<"$PROMPT" > "$A/_tasks/skill_session.log" 2>&1',
      '-o "$A/_work/_tasks/skill_session.result.txt" - <<<"$PROMPT" > "$A/_work/_tasks/skill_session.log" 2>&1', 'RUNTIME: session sidecars'))
add(P(TPOSE + 'scripts/run_session.sh', 'echo "rc=$?" >> "$A/_tasks/skill_session.log"', 'echo "rc=$?" >> "$A/_work/_tasks/skill_session.log"', 'RUNTIME: session sidecars'))
add(P(TPOSE + 'scripts/run_session.sh', 'views/front.png back.png left.png right.png, write tpose.log, then reply',
      'views/front.png back.png left.png right.png, write _work/tpose.log (every sidecar goes in _work/: prompts, logs, rejected sheets in _work/_rejected/), then reply',
      'prose given to Astra: sidecar location'))
add(P(TPOSE + 'SKILL.md', '| `tpose.log` | what you generated, measurements, retries, problems |',
      '| `_work/tpose.log` | what you generated, measurements, retries, problems |\n'
      '| `_work/` | every sidecar: `tpose.log`, filled prompts (`*.prompt.txt`), `_rejected/`, `_tasks/`. Wherever this file says `tpose.log`, `_rejected/` or a prompt file, it lives in `<ASSET>/_work/`; `<ASSET>` itself holds only finals (images, `design.txt`, `brief.md`, `views/`). Create `_work/` first. |',
      'prose: sidecar location'))
add(P(TPOSE + 'SKILL.md', 'write the exact error in `tpose.log` and stop.', 'write the exact error in `_work/tpose.log` and stop.', 'prose'))
add(P(TPOSE + 'SKILL.md', 'Keep rejected images in `<ASSET>/_rejected/` with a suffix;', 'Keep rejected images in `<ASSET>/_work/_rejected/` with a suffix;', 'prose'))
add(P(TPOSE + 'SKILL.md', 'into `tpose.log`.\n', 'into `_work/tpose.log`.\n', 'prose'))
add(P(TPOSE + 'SKILL.md', 'Write `tpose.log` and reply with:', 'Write `_work/tpose.log` and reply with:', 'prose'))
add(P(TPOSE + 'SKILL.md', 'Attempts, task text and logs stay in `<ASSET>/_tasks/`;', 'Attempts, task text and logs stay in `<ASSET>/_work/_tasks/`;', 'prose'))
add(P(TPOSE + 'SKILL.md', 'rejected ones go to `_rejected/`. `run_session.sh`', 'rejected ones go to `_work/_rejected/`. `run_session.sh`', 'prose'))
add(P(TRIPO + 'Agent.md',
      '| `tripo.log` | credit trước và sau mỗi bước, URL model, variant đã chọn, lỗi (các script tự ghi) |',
      '| `_work/` | file phụ: `tripo.log` (credit trước và sau mỗi bước, URL model, variant đã chọn, lỗi; các script tự ghi), `tpose.log`, prompt đã điền, `_tasks/` (log phiên Astra), `_rejected/` (ảnh bị loại), `_v*/` (lượt cũ). Thư mục asset chỉ giữ file thành phẩm |',
      'prose: sidecar location'))
add(P(TRIPO + 'Agent.md', 'Model của game ASHLAR đặt ở `ashlar/3d/<nhóm>/<asset_id>/` (nhóm `heroes`, `monsters/act-0N`, `props/<lô>`),',
      'Model của game ASHLAR đặt ở `ashlar/3d/<act>/<loại>/<ID>/`, cùng đường dẫn với concept 2D `ashlar/art/<act>/<loại>/<ID>/` (quái `act-0N/monsters/<ID>`; prop `act-0N/environments/<nhóm>/<vật>`; hero `heroes/<ID>/vA`; prop chung `common/<lô>/<vật>`),',
      'prose: new asset folder rule (3D mirrors 2D)'))
add(P(TRIPO + 'Agent.md', 'Log ở `<asset>/_tasks/skill_session.log`, báo cáo của Astra ở `_tasks/skill_session.result.txt`.',
      'Log ở `<asset>/_work/_tasks/skill_session.log`, báo cáo của Astra ở `_work/_tasks/skill_session.result.txt`.', 'prose: run_session.sh output moved'))
add(P(TRIPO + 'Agent.md', 'Ảnh bị loại giữ ở `_rejected/`.', 'Ảnh bị loại giữ ở `_work/_rejected/`.', 'prose'))
add(P(TRIPO + 'Agent.md', 'Mesh một ảnh (9 món trong `ashlar/3d/weapons/`).',
      'Mesh một ảnh (9 món, mỗi món trong `weapons/` của chủ: `ashlar/3d/act-01/monsters/<ID>/weapons/<món>/`, gậy hero PS ở `ashlar/3d/heroes/PS_pyre_singer/vA/weapons/pyre_staff/`).',
      'split dir: ashlar/3d/weapons/ is gone'))
add(P(TRIPO + 'Agent.md', 'script tự ghi credit vào `tripo.log`.', 'script tự ghi credit vào `_work/tripo.log`.', 'prose'))
add(P(TRIPO + 'Agent.md', 'ghi vào `tripo.log`.\n', 'ghi vào `_work/tripo.log`.\n', 'prose'))
add(P(TRIPO + 'Agent.md', '24 con + xe nồi B03 trong `ashlar/3d/monsters/act-01/` |', '24 con + xe nồi B03 trong `ashlar/3d/act-01/monsters/` |',
      'split dir: ashlar/3d/monsters/act-01/ is gone (folder mention)'))
add(P(TRIPO + 'Agent.md', '9 vũ khí/đồ cầm tay (`ashlar/3d/weapons/`)', '9 vũ khí/đồ cầm tay (nay ở `weapons/` của chủ, vd `ashlar/3d/act-01/monsters/D02_kiln_shaman/weapons/`)',
      'split dir: ashlar/3d/weapons/ is gone (folder mention)'))

# ------------------------------------------------------------------ 3D README + ashlar README + rig-anim doc
R3 = 'ashlar/3d/README.md'
add(P(R3, '''ashlar/3d/
├─ README.md               quy ước và danh mục (file này)
├─ heroes/<asset_id>/      hero chơi được
├─ weapons/<asset_id>/     vũ khí và đạo cụ cầm tay riêng
├─ monsters/act-0N/<asset_id>/  quái, chia theo Act (act-01 = Act I)
├─ props/<lô>/<vật>/       prop môi trường, gom theo lô dựng
└─ rig-anim/               quy trình rig và animation, chuẩn skeleton, QA, kiểm kê clip
```

Nhóm mới (`npcs/`) tạo khi có model đầu tiên.''', '''ashlar/3d/                        cùng đường dẫn với ashlar/art/ (một asset: art/<act>/<loại>/<ID> <-> 3d/<act>/<loại>/<ID>)
├─ README.md                      quy ước và danh mục (file này)
├─ act-01/                        Act I (act-02, ... thêm khi có model)
│  ├─ monsters/<ID>/              quái; vũ khí của quái ở monsters/<ID>/weapons/<món>/; monsters/_review/ ảnh duyệt cả lô
│  ├─ environments/<nhóm>/<vật>/  prop môi trường; <nhóm> là thư mục nhóm concept 2D (A01_lychgate_village, ...)
│  └─ _batches/<lô>/              hạ tầng một lô dựng: kit_v1, extras_v1 (manifest, prompts, textures, logs, rows, _review)
├─ heroes/<ID>/<vX>/              hero chơi được (vA, vB); vũ khí ở <vX>/weapons/<món>/; heroes/_hands_v1/ = tay màn chọn nghề
├─ common/<lô>/<vật>/             prop dùng chung, không thuộc act nào (dungeon_v1, clutter_v1)
└─ rig-anim/                      quy trình rig và animation, chuẩn skeleton, QA, kiểm kê clip
```

Bảng tra 2D và 3D cạnh nhau: `ashlar/INDEX.md` (sinh bằng `ashlar/pipeline/index/build_index.py`).
Nhóm mới (`npcs/`) tạo khi có model đầu tiên, cùng đường dẫn với `ashlar/art/npcs/<ID>/`.''', 'tree block: the 3D tree now mirrors art/'))
add(P(R3, '''| `tripo.log`, `tpose.log`, `_tasks/` | credit, URL model, variant đã chọn, log phiên Astra |
| `_rejected/`, `_v*/` | ảnh bị loại và các lượt trước, giữ để đối chiếu |''',
      '''| `_work/` | mọi file phụ: `tripo.log`, `tpose.log`, `*.prompt.txt`, `*.log`, `_tasks/` (log phiên Astra), `_rejected/` (ảnh bị loại), `_v*/` (các lượt trước, giữ để đối chiếu). Thư mục asset chỉ giữ thành phẩm |
| `weapons/<món>/` | vũ khí hoặc đồ cầm tay của asset, cùng cấu trúc thư mục này |''',
      'per-asset file table: sidecars in _work/'))
add(P(R3, '| `<vật>/_shots/`, `<vật>/tripo.log` | ảnh mesh, ảnh bốn góc, credit |', '| `<vật>/_shots/`, `<vật>/_work/tripo.log` | ảnh mesh, ảnh bốn góc, credit |', 'batch-prop file table'))
add(P(R3, '| `build_manifest.py`, `manifest.json`, `prompts/` | prompt ảnh đầu vào |',
      '| `build_manifest.py`, `manifest.json`, `prompts/` | prompt ảnh đầu vào (lô dungeon/clutter ở `common/<lô>/`; lô kit và extras ở `act-01/_batches/<lô>/`, còn từng vật ở `act-01/environments/<nhóm>/<vật>/`) |',
      'batch-prop file table: where batch files and pieces are'))
add(P(R3, '### Prop: `props/dungeon_v1/` (hầm mộ', '### Prop: `common/dungeon_v1/` (hầm mộ', 'heading path'))
add(P(R3, '### Prop: `props/clutter_v1/` (đồ rải', '### Prop: `common/clutter_v1/` (đồ rải', 'heading path'))
add(P(R3, '### Prop: `props/choice_hands_v1/` (tay màn', '### Prop: `heroes/_hands_v1/` (tay màn', 'heading path'))
add(P(R3, '### Prop: `props/act1_extras_v1/` (36 asset', '### Prop: `act-01/environments/A15_* ... A20_*/<vật>/` (36 asset; lô dựng ở `act-01/_batches/extras_v1/`', 'heading path'))
add(P(R3, '### Prop: `props/act1_kit_v1/` (86 asset', '### Prop: `act-01/environments/<nhóm>/<vật>/` kit v1 (86 asset; lô dựng ở `act-01/_batches/kit_v1/`', 'heading path'))
add(P(R3, 'variant đã chọn ghi trong `<vật>/tripo.log`.', 'variant đã chọn ghi trong `<vật>/_work/tripo.log`.', 'prose'))
add(P(R3, 'đọc `props/clutter_v1/` và `props/dungeon_v1/`, scale', 'đọc `common/clutter_v1/` và `common/dungeon_v1/`, scale', 'prose paths relative to ashlar/3d'))
add(P(R3, 'các prop `dungeon_v1` (tường hầm', 'các prop `common/dungeon_v1` (tường hầm', 'prose path'))
add(P(R3, 'đọc 36 GLB trong `props/act1_extras_v1/`:', 'đọc 36 GLB trong `act-01/environments/A15_*...A20_*/` (tìm theo tên vật, không gắn cứng thư mục nhóm):', 'prose path'))
add(P(R3, '1. Tạo `ashlar/3d/<nhóm>/<asset_id>/` (quái: `ashlar/3d/monsters/act-0N/<asset_id>/`, Act I = `act-01`) và chép concept vào `concept.png`.',
      '1. Tạo `ashlar/3d/<act>/<loại>/<ID>/` (cùng đường dẫn với concept 2D `ashlar/art/<act>/<loại>/<ID>/`: quái `act-01/monsters/<ID>`, prop `act-01/environments/<nhóm>/<vật>`, hero `heroes/<ID>/vA`, vũ khí `<chủ>/weapons/<món>`) và chép concept vào `concept.png`; file phụ vào `_work/`.',
      'placeholder path of a new asset'))
add(P(R3, '- 2026-10-24 (vòng sắp xếp 2):',
      '- 2026-10-24 (vòng sắp xếp 3): cây 3D soi gương cây 2D (`art/<act>/<loại>/<ID>` <-> `3d/<act>/<loại>/<ID>`): `monsters/act-01/<ID>` thành `act-01/monsters/<ID>`; vũ khí `weapons/<chủ>_<món>` vào `<chủ>/weapons/<món>` (gậy PS vào `heroes/PS_pyre_singer/vA/weapons/pyre_staff`); `heroes/XX_name_vA` thành `heroes/XX_name/vA`; kit và extras Act I thành `act-01/environments/<nhóm>/<vật>` (hạ tầng lô ở `act-01/_batches/`); `dungeon_v1`, `clutter_v1` vào `common/`; `choice_hands_v1` thành `heroes/_hands_v1`. Mọi file phụ (`tripo.log`, `tpose.log`, `*.prompt.txt`, `_tasks/`, `_rejected/`, `_v*/`) vào `_work/` của từng asset. Log viết trước ngày này vẫn ghi đường dẫn cũ.\n'
      '- 2026-10-24 (vòng sắp xếp 2):', 'history entry'))
add(P('ashlar/3d/rig-anim/Agent.md', 'ashlar/3d/<nhóm>/<asset_id>/\n├─ <asset_id>.glb', 'ashlar/3d/<act>/<loại>/<ID>/      (hero: ashlar/3d/heroes/<ID>/vA/)\n├─ <asset_id>.glb',
      'tree block header: 3D mirrors 2D'))
add(P('ashlar/3d/rig-anim/Agent.md', '└─ _rejected/, _v*/            bản trước, giữ để đối chiếu', '└─ _work/                     file phụ: _tasks/, _rejected/, _v*/ (bản trước, giữ để đối chiếu), tripo.log, tpose.log', 'tree block: sidecars'))
add(P('ashlar/README.md', '''│  ├─ act-01/          monsters/<ID>/, environments/{E01-E04_map01, A01-A14, A15-A20, A21-A25}/, _map01/ (brief, run)
│  ├─ act-02/          monsters/<ID>/, monsters/_brief/ (template, prompt)
│  ├─ heroes/          hero chơi được, dùng chung mọi act
│  ├─ npcs/            NPC''', '''│  ├─ act-01/          monsters/<ID>/vA|vB, environments/<nhóm>/ (A01..A25, E01..E04), _batches/ (hạ tầng lô: env_A01-A14, env_A15-A20, env_A21-A25, map01)
│  ├─ act-02/          monsters/<ID>/, _batches/monsters/ (brief, template, prompt)
│  ├─ heroes/          hero chơi được, dùng chung mọi act: <ID>/vA|vB
│  ├─ npcs/            NPC''', 'tree block: 2D layout'))
add(P('ashlar/README.md', '''│  ├─ monsters/act-0N/<ID>/    quái theo act
│  ├─ heroes/, weapons/, props/<lô>/
│  └─ rig-anim/        quy trình rig và animation''', '''│  ├─ act-01/monsters/<ID>/, act-01/environments/<nhóm>/<vật>/, act-01/_batches/   (cùng đường dẫn với art/)
│  ├─ heroes/<ID>/vA/ (vũ khí trong weapons/), common/<lô>/ (prop không thuộc act)
│  └─ rig-anim/        quy trình rig và animation''', 'tree block: 3D layout'))
add(P('ashlar/README.md', '├─ docs/               thiết kế:', '├─ INDEX.md            bảng tra mỗi asset: concept 2D, ảnh mới nhất, thư mục 3D, GLB (sinh bằng pipeline/index/build_index.py)\n├─ docs/               thiết kế:',
      'tree block: index'))
add(P('ashlar/README.md', '│  ├─ tripo/           Agent.md (quy trình Tripo) + scripts/ (điều khiển Tripo Studio qua CDP)',
      '│  ├─ index/           build_index.py: sinh INDEX.md từ hai cây art/ và 3d/\n│  ├─ tripo/           Agent.md (quy trình Tripo) + scripts/ (điều khiển Tripo Studio qua CDP)', 'tree block: index tool'))
add(P('ashlar/README.md', '''- ID quái giữ nguyên giữa `art/act-0N/monsters/<ID>` (concept) và `3d/monsters/act-0N/<ID>` (model).
- Act mới thêm thư mục `act-0N/` ở cả `art/` và `3d/monsters/`; không tạo thư mục lồng kiểu `monsters/monsters/`.''',
      '''- Một asset có cùng đường dẫn ở hai cây: `art/<act>/<loại>/<ID>` (concept) và `3d/<act>/<loại>/<ID>` (model); hero `heroes/<ID>/vA` ở cả hai.
- Ảnh thành phẩm và GLB nằm ở đầu thư mục asset; file phụ (prompt, task, result, log, QA, `_tasks/`, `_rejected/`, `_v*/`) nằm trong `_work/` của thư mục đó.
- Hạ tầng của một lô (manifest, prompt, template, gallery, run) ở `_batches/` của act, không lẫn với thư mục asset.
- Act mới thêm thư mục `act-0N/` ở cả `art/` và `3d/`; không tạo thư mục lồng kiểu `monsters/monsters/`.
- Sau khi thêm hoặc dời asset chạy lại `python ashlar/pipeline/index/build_index.py` để cập nhật `INDEX.md`.''', 'conventions after the mirror'))
add(P('ashlar/art-direction/artdirection.md', 'chuyển vào `_rejected/` nếu cần.', 'chuyển vào `_work/_rejected/` (cạnh ảnh) nếu cần.', 'prose: rejected images are sidecars'))

# ------------------------------------------------------------------ batch tooling that builds piece paths from parts
SPLIT = KIT + '_tools/split_rows.py'
add(P(SPLIT, "ROWS = os.path.join(KIT, 'rows')\n",
      "ROWS = os.path.join(KIT, 'rows')\n"
      "ASH3D = os.path.abspath(os.path.join(KIT, '..', '..', '..'))  # KIT = ashlar/3d/act-01/_batches/kit_v1\n"
      "ENV2D = os.path.abspath(os.path.join(ASH3D, '..', 'art', 'act-01', 'environments'))\n\n\n"
      "def piece_dir(folder):\n"
      "    \"\"\"A piece lives with its 2D concept group: ashlar/3d/act-01/environments/<A##_slug>/<A##_#_slug>/ (group = the 2D folder starting with A##_).\"\"\"\n"
      "    groups = [g for g in os.listdir(ENV2D) if g.startswith(folder[:3] + '_')]\n"
      "    assert len(groups) == 1, f'{folder}: 2D groups {groups}'\n"
      "    return os.path.join(ASH3D, 'act-01', 'environments', groups[0], folder)\n",
      'RUNTIME: pieces moved out of the batch folder into their group folders'))
add(P(SPLIT, "        adir = os.path.join(KIT, folder)\n", "        adir = piece_dir(folder)\n", 'RUNTIME: write each piece into its group folder'))
add(P(EXTRAS_DIR + 'build_manifest.py', 'V2 = Path("E:/Diablo2/ashlar/art/act-01/_batches/env_A15-A20")\n',
      'V2 = Path("E:/Diablo2/ashlar/art/act-01/_batches/env_A15-A20")  # prompts/ of the batch\n'
      'GROUPS2D = Path("E:/Diablo2/ashlar/art/act-01/environments")  # the concept sheets sit in their group folders now\n'
      'GROUPS3D = Path("E:/Diablo2/ashlar/3d/act-01/environments")  # a piece folder = GROUPS3D / <group> / <piece>\n\n\n'
      'def piece_dir(obj):\n    g = [d.name for d in GROUPS2D.iterdir() if d.name.startswith(obj[:3] + "_")]\n'
      '    assert len(g) == 1, (obj, g)\n    return GROUPS3D / g[0] / obj\n\n',
      'RUNTIME: sheets and pieces no longer sit under the batch folder'))
add(P(EXTRAS_DIR + 'build_manifest.py', 'Image.open(V2 / "groups" / CELL_SHEET.get(aid, SHEETS[group][0]))', 'Image.open(GROUPS2D / CELL_SHEET.get(aid, SHEETS[group][0]))',
      'RUNTIME: the sheet is in its group folder'))
add(P(EXTRAS_DIR + 'build_manifest.py', '            odir = HERE / obj\n            odir.mkdir(exist_ok=True)\n', '            odir = piece_dir(obj)\n            odir.mkdir(parents=True, exist_ok=True)\n',
      'RUNTIME: concept.png of a piece goes into its group folder'))

# ------------------------------------------------------------------ lab prepare scripts
EXT = LAB + 'scripts/prepare-act1-extras.py'
KITPY = LAB + 'scripts/prepare-act1-kit.py'
add(P(EXT, "SOURCE = 'ashlar/3d/act-01/_batches/extras_v1'\n",
      "SOURCE = 'ashlar/3d/act-01/_batches/extras_v1'  # the batch folder only (manifest, prompts, textures): the pieces live in group folders\n"
      "ASHLAR3D = os.path.abspath(os.path.join(ROOT, '..', 'ashlar', '3d'))\n\n\n"
      "def piece_dir(folder):\n"
      "    \"\"\"A piece folder is ashlar/3d/act-01/environments/<group>/<piece> (<group> = its 2D concept group): found by glob, never hardcoded.\"\"\"\n"
      "    hit = glob.glob(os.path.join(ASHLAR3D, 'act-01', 'environments', '*', folder))\n"
      "    assert len(hit) == 1, f'{folder}: expected one piece folder, found {hit}'\n"
      "    return hit[0]\n\n\n"
      "def piece_rel(folder):\n    \"\"\"repo-relative source path written to samples.json\"\"\"\n"
      "    return 'ashlar/3d/' + os.path.relpath(piece_dir(folder), ASHLAR3D).replace(os.sep, '/')\n",
      'RUNTIME: pieces moved to ashlar/3d/act-01/environments/<group>/<piece> (resolve by glob)'))
add(P(EXT, 'import io\nimport json\nimport os\n', 'import glob\nimport io\nimport json\nimport os\n', 'RUNTIME: glob import for piece_dir'))
add(P(EXT, "        path = os.path.abspath(os.path.join(SRC, '..', '..', monster[0]))\n", "        path = os.path.abspath(os.path.join(ASHLAR3D, monster[0]))\n",
      'RUNTIME: monster[0] is relative to ashlar/3d; SRC is now two levels deeper'))
add(P(EXT, "        src = [f for f in os.listdir(os.path.join(SRC, folder)) if f.startswith('act1_extras_v1_') and f.endswith('.glb')]\n",
      "        src = [f for f in os.listdir(piece_dir(folder)) if f.startswith('act1_extras_v1_') and f.endswith('.glb')]\n", 'RUNTIME: piece folder'))
add(P(EXT, "        path = os.path.join(SRC, folder, src[0])\n", "        path = os.path.join(piece_dir(folder), src[0])\n", 'RUNTIME: piece folder'))
add(P(EXT, "f'act1-extras/{sid}.glb', f'{SOURCE}/{folder}')", "f'act1-extras/{sid}.glb', piece_rel(folder))", 'RUNTIME: source path written to samples.json'))
add(P(EXT, "f'act1-extras/{sample_id(e[1])}.glb', f'{SOURCE}/{e[1]}')", "f'act1-extras/{sample_id(e[1])}.glb', piece_rel(e[1]))", 'RUNTIME: source path written to samples.json'))
add(P(EXT, "'monsters/act-01/P06_poppy_mound/P06_poppy_mound.glb'", "'act-01/monsters/P06_poppy_mound/P06_poppy_mound.glb'",
      'RUNTIME: source GLB spelled relative to ashlar/3d (MONSTERS table; the sample `source` is derived from it)'))
add(P(EXT, 'static monsters from ashlar/3d/monsters/act-01 the same way', 'static monsters from ashlar/3d/act-01/monsters the same way', 'docstring: folder mention'))
add(P(EXT, 'models in `ashlar/3d/monsters/act-01`)', 'models in `ashlar/3d/act-01/monsters`)', 'licence text written into THIRD_PARTY_LICENSES.md (keeps the two in step)'))
add(P(EXT, 'models in `ashlar/3d/act-01/_batches/extras_v1`), levelled, ', 'models in `ashlar/3d/act-01/environments/A15_*` to `A20_*`, batch files in `ashlar/3d/act-01/_batches/extras_v1`), levelled, ',
      'licence text: the pieces are not in the batch folder any more'))
add(P(LAB + 'THIRD_PARTY_LICENSES.md', 'models in `ashlar/3d/monsters/act-01`)', 'models in `ashlar/3d/act-01/monsters`)', 'same licence text as prepare-act1-extras.py'))
add(P(LAB + 'THIRD_PARTY_LICENSES.md', 'models in `ashlar/3d/act-01/_batches/extras_v1`), levelled, ',
      'models in `ashlar/3d/act-01/environments/A15_*` to `A20_*`, batch files in `ashlar/3d/act-01/_batches/extras_v1`), levelled, ', 'same licence text as prepare-act1-extras.py'))
KITLIC_OLD = ("(`ashlar/art/act-01/environments/E01-E04_map01`, `ashlar/art/act-01/_batches/env_A01-A14`; rows and split pieces in `ashlar/3d/act-01/_batches/kit_v1`)")
KITLIC_NEW = ("(`ashlar/art/act-01/environments/E01_*` to `E04_*` and `A01_*` to `A14_*`; rows in `ashlar/3d/act-01/_batches/kit_v1`, "
              "split pieces in `ashlar/3d/act-01/environments/<group>`)")
add(P(KITPY, KITLIC_OLD, KITLIC_NEW, 'licence text: E01-E04_map01 is split into E0x folders, pieces left the batch folder'))
add(P(LAB + 'THIRD_PARTY_LICENSES.md', KITLIC_OLD, KITLIC_NEW, 'same licence text as prepare-act1-kit.py'))
add(P(KITPY, 'cells of ashlar/art/act-01/environments/E01-E04_map01 (E01-E04) for', 'cells of ashlar/art/act-01/environments/E0x_* (E01-E04) for', 'docstring: split dir'))
add(P(KITPY, "SOURCE = 'ashlar/3d/act-01/_batches/kit_v1'\n",
      "SOURCE = 'ashlar/3d/act-01/_batches/kit_v1'  # the batch folder only: the pieces live in group folders (ext.piece_dir / ext.piece_rel find them)\n"
      "piece_dir, piece_rel = ext.piece_dir, ext.piece_rel\n", 'RUNTIME: pieces moved to ashlar/3d/act-01/environments/<group>/<piece>'))
add(P(KITPY, "    src = [f for f in os.listdir(os.path.join(SRC, folder)) if f.startswith('act1_kit_v1_') and f.endswith('.glb')]\n",
      "    src = [f for f in os.listdir(piece_dir(folder)) if f.startswith('act1_kit_v1_') and f.endswith('.glb')]\n", 'RUNTIME: piece folder'))
add(P(KITPY, "    scene = trimesh.load(os.path.join(SRC, folder, src[0]), force='scene')\n", "    scene = trimesh.load(os.path.join(piece_dir(folder), src[0]), force='scene')\n", 'RUNTIME: piece folder'))
add(P(KITPY, "f'act1-kit/{sid}.glb', f'{SOURCE}/{folder}', CREDIT)", "f'act1-kit/{sid}.glb', piece_rel(folder), CREDIT)", 'RUNTIME: source path written to samples.json'))

# ------------------------------------------------------------------ rig tests: path split over two lines
add(P('.agents/skills/blender-mcp-rigging/scripts/tests/solvers/C_d01_acceptance_test.py',
      '"ashlar", "3d", "monsters", "act-01",\n', '"ashlar", "3d", "act-01", "monsters",\n',
      'RUNTIME: os.path.join split over two lines (the quoted-segment fixer works per line)'))
