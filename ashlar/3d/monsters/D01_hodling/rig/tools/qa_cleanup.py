"""Don dep rig/qa sau khi ghep anh: giu anh ghep ban cuoi (tag moi nhat); chuyen anh ghep cua cac tag cu (lan thu bi thay the) vao qa/_superseded/<tag>/ (JPEG q80);
xoa anh raw Blender (tai sinh duoc bang q1_render.py/q4_sockets.py/q5_sack_compare.py) tru info*.json.  python -I qa_cleanup.py <tag_moi_nhat> [--keep-raw]
An toan: chi lam trong <rig>/qa (da kiem co D01_hodling_rig.blend o thu muc cha + ten thu muc la 'qa'); tu choi neu tag moi nhat chua co anh;
chi xoa *.png truc tiep trong qa/_raw/<tag>/ (khong de quy); loi thao tac file => thoat khac 0."""
import glob, os, re, shutil, sys, time
from PIL import Image
RIG = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QA = os.path.join(RIG, "qa")
if os.path.basename(QA) != "qa" or not os.path.isfile(os.path.join(RIG, "D01_hodling_rig.blend")) or not os.path.isdir(QA):
    sys.exit(f"khong phai thu muc rig/qa D01 hop le: {QA}")
if len(sys.argv) < 2 or not re.fullmatch(r"v[0-9]+[a-z0-9_]*", sys.argv[1]):
    sys.exit("dung: qa_cleanup.py <tag vN> [--keep-raw]")
latest = sys.argv[1]
keep_raw = "--keep-raw" in sys.argv
if not glob.glob(os.path.join(QA, f"A2_*_{latest}.jpg")):
    sys.exit(f"khong co anh A2_*_{latest}.jpg: khong chuyen anh cu di")
def inside_qa(p):
    return os.path.realpath(p).startswith(os.path.realpath(QA) + os.sep)
def retry(fn, *a):
    for _ in range(15):
        try:
            return fn(*a)
        except OSError:
            time.sleep(1.0)
    sys.exit("khong thao tac duoc " + " ".join(map(str, a)))
for f in sorted(glob.glob(os.path.join(QA, "A2_*_v*.*")) + glob.glob(os.path.join(QA, "A3_*_v*.*"))):
    assert inside_qa(f)
    base = os.path.basename(f)
    tag = base.rsplit("_", 1)[1].split(".")[0]
    if tag == latest or tag == latest + "_retry":
        continue
    dst = os.path.join(QA, "_superseded", tag); os.makedirs(dst, exist_ok=True)
    out = os.path.join(dst, os.path.splitext(base)[0] + ".jpg")
    if os.path.exists(out):
        sys.exit(f"da co {out}: khong ghi de bang chung cu")
    if f.lower().endswith(".png"):
        im = Image.open(f).convert("RGB"); w = min(im.width, 1800); im = im.resize((w, int(im.height * w / im.width)))
        im.save(out, quality=80)
        im.close()
        retry(os.remove, f)
    else:
        retry(shutil.move, f, out)
if not keep_raw:
    for d in glob.glob(os.path.join(QA, "_raw", "*")):
        if not os.path.isdir(d):
            continue
        for f in glob.glob(os.path.join(d, "*.png")):
            assert inside_qa(f) and os.path.dirname(os.path.realpath(f)).startswith(os.path.realpath(os.path.join(QA, "_raw")))
            retry(os.remove, f)
print("qa cleanup ok; kept", latest)
