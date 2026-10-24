"""Don dep rig/qa sau khi ghep anh: giu anh ghep ban cuoi (tag moi nhat); chuyen anh ghep cua cac tag cu (lan thu bi thay the) vao qa/_superseded/<tag>/ (JPEG q80);
xoa anh raw Blender (tai sinh duoc bang q1_render.py/q4_sockets.py) tru info*.json.  python -I qa_cleanup.py <tag_moi_nhat> [--keep-raw]"""
import glob, os, shutil, sys, time
from PIL import Image
RIG = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QA = os.path.join(RIG, "qa")
latest = sys.argv[1]
keep_raw = "--keep-raw" in sys.argv
def retry(fn, *a):
    for _ in range(15):
        try:
            return fn(*a)
        except OSError:
            time.sleep(1.0)
    print("khong thao tac duoc", a)
for f in sorted(glob.glob(os.path.join(QA, "A2_*_v*.*")) + glob.glob(os.path.join(QA, "A3_*_v*.*"))):
    base = os.path.basename(f)
    tag = base.rsplit("_", 1)[1].split(".")[0]
    if tag == latest or tag == latest + "_retry":
        continue
    dst = os.path.join(QA, "_superseded", tag); os.makedirs(dst, exist_ok=True)
    out = os.path.join(dst, os.path.splitext(base)[0] + ".jpg")
    if f.lower().endswith(".png"):
        im = Image.open(f).convert("RGB"); w = min(im.width, 1800); im = im.resize((w, int(im.height * w / im.width)))
        im.save(out, quality=80)
        im.close()
        retry(os.remove, f)
    else:
        retry(shutil.move, f, out)
if not keep_raw:
    for d in glob.glob(os.path.join(QA, "_raw", "*")):
        for f in glob.glob(os.path.join(d, "*.png")):
            retry(os.remove, f)
print("qa cleanup ok; kept", latest)
