"""R5 (buoc PIL): ghep anh QA tu anh Blender that (rig/qa/_raw/<tag>/) + lop phu skeleton/nhan. Khong chinh sua anh model.
Chay: python -I q2_compose.py <tag>    -> rig/qa/A2_*_<tag>.jpg
Lop phu ve bang phep chieu truc giao chinh xac lay tu Blender (info.json), nen khop tung pixel voi anh render.
"""
import colorsys
import json
import math
import os
import sys

from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
RIG = os.path.dirname(HERE)
QA = os.path.join(RIG, "qa")
TAG = sys.argv[1]
RAW = os.path.join(QA, "_raw", TAG)
INFO = json.load(open(os.path.join(RAW, "info.json"), encoding="utf-8"))
FONT_PATHS = ["C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arial.ttf"]
FONT_B = ["C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/arialbd.ttf"]


def font(sz, bold=False):
    for p in (FONT_B if bold else FONT_PATHS):
        if os.path.exists(p):
            return ImageFont.truetype(p, sz)
    return ImageFont.load_default()


BG = (38, 38, 42)
VIEWS = ("front", "side", "back")
VIEW_LABEL = {"front": "TRƯỚC (camera ở trước mặt quái; trái quái = +X = bên phải ảnh)", "side": "BÊN (nhìn từ bên phải quái; quái nhìn sang phải ảnh)",
              "back": "SAU (nhìn từ sau lưng; trái quái = bên trái ảnh)"}
VIEW_SHORT = {"front": "Trước", "side": "Bên (phải quái)", "back": "Sau"}


def load(name):
    return Image.open(os.path.join(RAW, name + ".png")).convert("RGB")


def proj(name):
    p = INFO["views"][name]
    px, py = p["px"], p["py"]
    s = p["res"]
    return lambda P: (px[0] * P[0] + px[1] * P[1] + px[2] * P[2] + px[3], py[0] * P[0] + py[1] * P[1] + py[2] * P[2] + py[3])


def zcrop(img, name, zmin, zmax, size=None):
    """Cat anh render theo khoang cao the gioi [zmin,zmax] (chi bo vien trong, khong doi noi dung); tra (anh_cat, pf_dich)."""
    pf = proj(name)
    y0 = int(max(min(pf((0, 0, zmax))[1], pf((0, 0, zmin))[1]), 0))
    y1 = int(min(max(pf((0, 0, zmax))[1], pf((0, 0, zmin))[1]), img.height))
    im = img.crop((0, y0, img.width, y1))
    pf2 = lambda P, pf=pf, y0=y0: (pf(P)[0], pf(P)[1] - y0)
    if size:
        k = size / img.width
        im = im.resize((size, int(im.height * k)), Image.LANCZOS)
        pf3 = lambda P, pf2=pf2, k=k: tuple(c * k for c in pf2(P))
        return im, pf3
    return im, pf2


# ------------------------------------------------------------------ mau bone
def bone_color(name, kind):
    if kind == "socket":
        return (255, 255, 255)
    if kind == "aux":
        return (255, 90, 230)
    if name.startswith("L_"):
        return (40, 220, 255)
    if name.startswith("R_"):
        return (255, 150, 30)
    return (140, 255, 90)


def draw_bone_overlay(img, pf, bones, width, labels=None, label_font=None, joints=True, only=None, alpha_line=255):
    d = ImageDraw.Draw(img, "RGBA")
    pts = {}
    for nm, b in bones.items():
        if only and nm not in only:
            continue
        col = b["color"] if "color" in b else bone_color(nm, b.get("kind"))
        h, t = pf(b["head"]), pf(b["tail"])
        pts[nm] = (h, t, col)
        if b.get("kind") == "socket":
            continue
        d.line([h, t], fill=(0, 0, 0, 230), width=width + 4)
        d.line([h, t], fill=col + (alpha_line,), width=width)
    r = width * 1.8
    for nm, (h, t, col) in pts.items():
        kind = bones[nm].get("kind")
        if kind == "socket":
            q = r * 1.4
            d.polygon([(h[0], h[1] - q), (h[0] + q, h[1]), (h[0], h[1] + q), (h[0] - q, h[1])], fill=(255, 255, 255, 255), outline=(0, 0, 0, 255))
        elif joints:
            d.ellipse([h[0] - r, h[1] - r, h[0] + r, h[1] + r], fill=col + (255,), outline=(0, 0, 0, 255), width=2)
    return pts


def place_labels(img, pts, bones, fnt, only_labels=None, margin=24):
    """Nhan dat o hai cot le trai/phai, tia noi toi khop, tranh chong nhau (sap xep theo y, day ra)."""
    d = ImageDraw.Draw(img, "RGBA")
    W, H = img.size
    items = []
    for nm, (h, t, col) in pts.items():
        if only_labels is not None and nm not in only_labels:
            continue
        side = "L" if h[0] < W / 2 else "R"
        items.append([nm, h, col, side])
    lh = fnt.size + 10
    for side in ("L", "R"):
        col_items = sorted([it for it in items if it[3] == side], key=lambda it: it[1][1])
        ys = [it[1][1] for it in col_items]
        # day de khoang cach toi thieu
        for i in range(1, len(ys)):
            ys[i] = max(ys[i], ys[i - 1] + lh)
        # keo nguoc neu vuot day
        over = (ys[-1] + lh / 2 - (H - margin)) if ys else 0
        if over > 0:
            ys[-1] -= over
            for i in range(len(ys) - 2, -1, -1):
                ys[i] = min(ys[i], ys[i + 1] - lh)
        for it, y in zip(col_items, ys):
            nm, h, col, _ = it
            tw = d.textlength(nm, font=fnt)
            x = margin if side == "L" else W - margin - tw
            box = [x - 6, y - lh / 2 + 2, x + tw + 6, y + lh / 2 - 2]
            ex = box[2] if side == "L" else box[0]
            d.line([(ex, y), h], fill=(0, 0, 0, 200), width=4)
            d.line([(ex, y), h], fill=col + (255,), width=2)
            d.rectangle(box, fill=(20, 20, 24, 215), outline=col + (255,), width=2)
            d.text((x, y - fnt.size / 2 - 1), nm, font=fnt, fill=(255, 255, 255, 255))


def header(img, title, sub=None, h=90):
    W = img.width
    out = Image.new("RGB", (W, img.height + h), BG)
    out.paste(img, (0, h))
    d = ImageDraw.Draw(out)
    d.text((24, 10), title, font=font(34, True), fill=(255, 255, 255))
    if sub:
        d.text((24, 54), sub, font=font(22), fill=(200, 200, 210))
    return out


def footer(img, lines, fs=22):
    f = font(fs)
    h = (fs + 8) * len(lines) + 20
    out = Image.new("RGB", (img.width, img.height + h), BG)
    out.paste(img, (0, 0))
    d = ImageDraw.Draw(out)
    y = img.height + 10
    for ln in lines:
        d.text((24, y), ln, font=f, fill=(215, 215, 225))
        y += fs + 8
    return out


def legend_row(items, width, fs=24):
    """items: [(label, (r,g,b))] -> anh ngang"""
    f = font(fs)
    img = Image.new("RGB", (width, 10), BG)
    x, y = 24, 6
    rows = [[]]
    cur = 24
    for lb, c in items:
        w = ImageDraw.Draw(img).textlength(lb, font=f) + fs + 30
        if cur + w > width - 24:
            rows.append([])
            cur = 24
        rows[-1].append((lb, c, cur))
        cur += w
    img = Image.new("RGB", (width, len(rows) * (fs + 14) + 12), BG)
    d = ImageDraw.Draw(img)
    for ri, row in enumerate(rows):
        for lb, c, x in row:
            yy = 8 + ri * (fs + 14)
            d.rectangle([x, yy, x + fs, yy + fs], fill=c, outline=(255, 255, 255))
            d.text((x + fs + 8, yy - 3), lb, font=f, fill=(235, 235, 240))
    return img


def hstack(imgs, gap=8, bg=BG):
    W = sum(i.width for i in imgs) + gap * (len(imgs) - 1)
    H = max(i.height for i in imgs)
    out = Image.new("RGB", (W, H), bg)
    x = 0
    for i in imgs:
        out.paste(i, (x, 0))
        x += i.width + gap
    return out


def vstack(imgs, gap=8, bg=BG):
    W = max(i.width for i in imgs)
    H = sum(i.height for i in imgs) + gap * (len(imgs) - 1)
    out = Image.new("RGB", (W, H), bg)
    y = 0
    for i in imgs:
        out.paste(i, (0, y))
        y += i.height + gap
    return out


def save(img, name):
    import time
    p = os.path.join(QA, f"{name}_{TAG}.jpg")  # JPEG q92 4:4:4 (anh ghep; raw Blender khong nen duoc giu)
    for attempt in range(12):  # Windows: file vua ghi co the bi quet/khoa tam thoi
        try:
            img.save(p, quality=92, subsampling=0)
            break
        except OSError:
            time.sleep(1.0)
    else:
        p = os.path.join(QA, f"{name}_{TAG}_retry.jpg")
        img.save(p, quality=92, subsampling=0)
    print("wrote", os.path.relpath(p, RIG), img.size)


def titled_panel(img, text, fs=26):
    out = Image.new("RGB", (img.width, img.height + fs + 14), BG)
    out.paste(img, (0, fs + 14))
    ImageDraw.Draw(out).text((8, 4), text, font=font(fs, True), fill=(255, 255, 255))
    return out


# ================================================================== 1. skeleton overlay
KEY = {"root", "cog", "pelvis", "spine_01", "spine_02", "chest", "neck", "head", "L_UpperArm", "R_UpperArm", "L_ForeArm", "R_ForeArm", "L_Hand", "R_Hand", "L_Thigh", "R_Thigh",
       "L_Calf", "R_Calf", "L_Foot", "R_Foot", "L_Toe", "R_Toe"}
if "bones" in INFO and "rest_runtime" in INFO["bones"]:
    rb = INFO["bones"]["rest_runtime"]
    cb = INFO["bones"]["rest_control"]
    leg_items = [("trái quái (L_*)", (40, 220, 255)), ("phải quái (R_*)", (255, 150, 30)), ("giữa / thân (root, cog, pelvis, spine, chest, neck, head)", (140, 255, 90)),
                 ("phụ: helmet, sack, loincloth_front, L_ear, R_ear", (255, 90, 230)), ("ô thoi trắng = socket (không trọng số)", (255, 255, 255))]
    panels_small = []
    def crop_to(img, pf, bones, pad=170, xpad=None):
        ys = [pf(b["head"])[1] for b in bones.values()] + [pf(b["tail"])[1] for b in bones.values()]
        xs = [pf(b["head"])[0] for b in bones.values()] + [pf(b["tail"])[0] for b in bones.values()]
        y0, y1 = int(max(min(ys) - pad, 0)), int(min(max(ys) + pad, img.height))
        x0, x1 = (0, img.width) if xpad is None else (int(max(min(xs) - xpad, 0)), int(min(max(xs) + xpad, img.width)))
        im = img.crop((x0, y0, x1, y1))
        return im, (lambda P, pf=pf, y0=y0, x0=x0: (pf(P)[0] - x0, pf(P)[1] - y0))
    for v in VIEWS:
        img0 = load(f"skel_plain_{v}")
        img, pf = crop_to(img0, proj(f"skel_plain_{v}"), rb, xpad=None if v == "front" else 700)
        im = img.copy()
        pts = draw_bone_overlay(im, pf, rb, width=5)
        place_labels(im, pts, rb, font(30, True))
        out = header(im, f"D01 Hodling — skeleton runtime chồng lên model thật (Blender) — {VIEW_SHORT[v]}",
                     f"{VIEW_LABEL[v]}. Tư thế rest (T-pose), scale 0,5 m, 35 bone. Mỗi chấm = đầu bone (khớp), vạch = bone.")
        out = vstack([out, legend_row(leg_items, out.width)], gap=0)
        save(out, f"A2_skeleton_overlay_{v}")
        sc_ = 0.5
        im2 = img.copy().resize((int(img.width * sc_), int(img.height * sc_)), Image.LANCZOS)
        pf2 = lambda P, pf=pf: tuple(c * sc_ for c in pf(P))
        pts2 = draw_bone_overlay(im2, pf2, rb, width=3)
        place_labels(im2, pts2, rb, font(19, True), only_labels=KEY)
        panels_small.append(titled_panel(im2, f"{VIEW_SHORT[v]}"))
    three = hstack(panels_small)
    three = header(three, "D01 Hodling — skeleton runtime, 3 góc (nhãn: 22 bone lõi; xem file riêng từng góc để đủ 35 nhãn)", "Ảnh Blender thật, camera trực giao, lớp phủ vẽ theo đúng phép chiếu.")
    three = vstack([three, legend_row(leg_items, three.width, 22)], gap=0)
    save(three, "A2_skeleton_overlay_3view")
    # rig dieu khien
    ctl_items = [("FK (ctl_<tên runtime>)", (140, 255, 90)), ("IK tay/chân: ctl_*_Hand_IK, ctl_*_Foot_IK", (255, 220, 60)), ("pole gối/khuỷu", (255, 90, 90)),
                 ("tiếp xúc chân: Toe_roll / Heel_roll / Ball_roll (cha-con theo thứ tự)", (90, 160, 255)), ("target IK (Ankle_target, Toe_target)", (200, 140, 255))]
    for v in ("front", "side"):
        img, pf = crop_to(load(f"skel_plain_{v}"), proj(f"skel_plain_{v}"), rb)
        im = img.copy()
        cdraw = {}
        for nm, b in cb.items():
            if nm.endswith("_IK"):
                c = (255, 220, 60)
            elif nm.endswith("_pole"):
                c = (255, 90, 90)
            elif nm.endswith(("_roll",)):
                c = (90, 160, 255)
            elif nm.endswith("_target"):
                c = (200, 140, 255)
            else:
                c = (140, 255, 90)
            cdraw[nm] = dict(b, color=c, kind="ctl")
        pts = draw_bone_overlay(im, pf, cdraw, width=4)
        place_labels(im, pts, cdraw, font(22, True), only_labels={n for n in cb if not (n.startswith("ctl_") and cdraw[n]["color"] == (140, 255, 90))} | {"ctl_root", "ctl_cog"})
        out = header(im, f"D01 Hodling — rig điều khiển (ctl_, 45 bone, không xuất) — {VIEW_SHORT[v]}", "Chỉ nhãn các điều khiển IK / pole / tiếp xúc chân + root, cog. Bone FK (xanh lá) trùng vị trí bone runtime.")
        out = vstack([out, legend_row(ctl_items, out.width, 22)], gap=0)
        save(out, f"A2_control_rig_overlay_{v}")

# ================================================================== 2. ban do trong so tong
PAL = INFO.get("palette", {})
if PAL:
    items = [(n, tuple(int(c * 255) for c in PAL[n])) for n in INFO["weights_names"]]
    for kind, title, note in (("dominant", "bone trội nhất mỗi đỉnh", "Mỗi đỉnh tô màu của bone có trọng số lớn nhất. Vùng loang màu xa bone = lỗi."),
                              ("blend", "màu trộn theo trọng số", "Màu = tổng w_i x màu bone_i. Chuyển màu mượt = nội suy khớp; vùng trộn lẫn lộn xộn = trọng số xấu."),
                              ("influences", "số ảnh hưởng mỗi đỉnh", "xanh dương 1, xanh lá 2, vàng 3, đỏ 4 (tối đa 4, chuẩn glTF).")):
        ims = [titled_panel(zcrop(load(f"w_{kind}_{v}"), f"w_{kind}_{v}", -0.03, 0.54, 1000)[0], VIEW_SHORT[v]) for v in VIEWS]
        row = header(hstack(ims), f"D01 Hodling — bản đồ trọng số: {title}", note)
        if kind == "influences":
            leg = legend_row([("1", (64, 64, 230)), ("2", (51, 204, 77)), ("3", (242, 204, 26)), ("4", (242, 51, 51))], row.width)
        else:
            leg = legend_row(items, row.width, 22)
        save(vstack([row, leg], gap=0), f"A2_weights_{kind}")

# ================================================================== 3. trong so tung bone
BONE_GROUPS = {
    "spine": ["pelvis", "spine_01", "spine_02", "chest"], "neck_head": ["neck", "head", "helmet"], "arm_L": ["L_UpperArm", "L_ForeArm", "L_Hand"], "arm_R": ["R_UpperArm", "R_ForeArm", "R_Hand"],
    "leg_L": ["L_Thigh", "L_Calf", "L_Foot", "L_Toe"], "leg_R": ["R_Thigh", "R_Calf", "R_Foot", "R_Toe"], "aux": ["sack", "loincloth_front", "L_ear", "R_ear"]}


def colorbar(w):
    im = Image.new("RGB", (w, 54), BG)
    d = ImageDraw.Draw(im)
    for x in range(w - 360):
        t = x / (w - 361)
        r = min(max(2 * t - 0.5, 0), 1)
        g = 2 * t if t < 0.5 else 2 - 2 * t
        b = min(max(1 - 2 * t, 0), 1)
        d.line([(180 + x, 8), (180 + x, 34)], fill=(int(r * 255), int(g * 255), int(b * 255)))
    f = font(22)
    d.text((24, 8), "trọng số:", font=f, fill=(255, 255, 255))
    d.text((176, 34), "0 (chỉ đỉnh >0 được tô)", font=font(18), fill=(230, 230, 230))
    d.text((w - 170, 8), "1.0", font=f, fill=(255, 255, 255))
    d.text((24, 32), "xám = 0", font=font(18), fill=(170, 170, 170))
    return im


if "bone_stats" in INFO:
    for gname, bl in BONE_GROUPS.items():
        rows = []
        for nm in bl:
            st = INFO["bone_stats"][nm]
            panels = [titled_panel(load(f"b_{nm}_{v}").resize((640, 640), Image.LANCZOS), f"{nm} — {VIEW_SHORT[v]}", 22) for v in VIEWS]
            rows.append(hstack(panels))
        sheet = vstack(rows, gap=6)
        sheet = header(sheet, f"D01 Hodling — trọng số từng bone: {', '.join(bl)}", "Nhiệt 0→1 (xanh dương → đỏ); vùng xám tối = trọng số 0. Mỗi hàng zoom vào vùng có trọng số của bone, cùng tỉ lệ cho 3 góc.")
        sheet = vstack([sheet, colorbar(sheet.width)], gap=0)
        save(sheet, f"A2_weights_bone_{gname}")

# ================================================================== 4. vung kho
REG_ORDER = ["shoulder_L", "shoulder_R", "elbow_L", "elbow_R", "hand_L", "hand_R", "hip_pelvis", "knee_L", "knee_R", "ankle_foot_L", "ankle_foot_R", "head_neck", "sack_helmet", "loincloth"]
REG_VN = {"shoulder_L": "vai trái", "shoulder_R": "vai phải", "elbow_L": "khuỷu trái", "elbow_R": "khuỷu phải", "hand_L": "bàn tay trái", "hand_R": "bàn tay phải", "hip_pelvis": "hông/xương chậu",
          "knee_L": "gối trái", "knee_R": "gối phải", "ankle_foot_L": "cổ chân + bàn chân trái", "ankle_foot_R": "cổ chân + bàn chân phải", "head_neck": "đầu, cổ, tai", "sack_helmet": "túi + mũ",
          "loincloth": "khố"}
if any(k.startswith("r_") for k in INFO["views"]):
    for si, chunk in enumerate((REG_ORDER[:7], REG_ORDER[7:])):
        rows = []
        for rn in chunk:
            pans = []
            for v in VIEWS:
                pans.append(load(f"rt_{rn}_{v}").resize((500, 500), Image.LANCZOS))
                pans.append(load(f"r_{rn}_{v}").resize((500, 500), Image.LANCZOS))
            row = hstack(pans, gap=4)
            row = titled_panel(row, f"{REG_VN[rn]} — mỗi góc: texture | màu trộn trọng số  (trước, bên, sau)", 24)
            rows.append(row)
        sheet = header(vstack(rows, gap=6), f"D01 Hodling — vùng khó, tư thế rest, texture đối chiếu với màu trọng số ({si + 1}/2)", "Màu trộn dùng cùng bảng màu bone như A2_weights_blend. Góc BÊN nhìn từ phía phải quái nên tay/chân trái bị che sau thân.")
        if PAL:
            sheet = vstack([sheet, legend_row(items, sheet.width, 20)], gap=0)
        save(sheet, f"A2_regions_{si + 1}")

# ================================================================== 5. tu the cuc tri
POSE_DESC = {
    "rest": "T-pose rest (đối chiếu). Không điều khiển nào được dùng.",
    "hands_raised": "Hai tay giơ cao qua đầu: ctl_L_Hand_IK, ctl_R_Hand_IK kéo lên (0,10; -0,075; 0,50) m; IK tay + pole khuỷu.",
    "hands_crossed": "Hai tay vắt chéo trước ngực: ctl_L/R_Hand_IK qua giữa thân (x = ∓0,035, y = -0,095).",
    "arms_down_fk": "Tay buông xuống: tắt IK tay (ik_arm_*=0); xoay FK ctl_*_UpperArm ±80° quanh trục Y thế giới + khuỷu gập 25°.",
    "arms_forward_fk": "Tay đưa thẳng ra trước: tắt IK tay; FK UpperArm ∓85° quanh Z + khuỷu gập 70°.",
    "elbows_max_fk": "Khuỷu gập cực đại 135° (FK ForeArm): kiểm khuỷu 'ống nước'.",
    "squat": "Ngồi xổm: ctl_cog hạ 7,5 cm, ctl_spine_01 gập 18°; hai chân giữ nguyên bằng IK chân (gối gập).",
    "long_step": "Bước dài: ctl_L_Foot_IK +5 cm ra trước, ctl_R_Foot_IK 4,5 cm ra sau, ctl_R_Toe_roll 28° nhấc gót; cog hạ 1,2 cm. (Chân dài 0,13 m nên tầm với giới hạn.)",
    "twist_p45": "Xoay thân +45°: ctl_spine_01, spine_02, chest mỗi cái +15° quanh trục Z thế giới.",
    "twist_m45": "Xoay thân −45°: ba bone cột sống mỗi cái −15°.",
    "head_down": "Cúi đầu: ctl_neck +18°, ctl_head +22° quanh X (gập tổng 40°).",
    "head_up": "Ngửa đầu: ctl_neck −15°, ctl_head −22° (tổng −37°).",
    "head_turn": "Quay đầu 50°: ctl_neck +25°, ctl_head +25° quanh Z.",
    "hip_flex_fk": "Hông gập 70° + gối 95° (chân trái), hông duỗi 30° (chân phải): tắt IK chân, FK Thigh/Calf.",
    "hip_abduct_fk": "Dạng hông 40° hai bên (FK Thigh xoay quanh Y).",
    "aux_motion": "Bone phụ: helmet +14°, sack −10°, loincloth_front −35°, tai ±25° (kiểm mũ, tui, khố, tai).",
}
if "poses" in INFO:
    sheets_overlay = {}
    for nm, pd in INFO["poses"].items():
        rows_clean, rows_skel = [], []
        zlo, zhi = pd["bbox_min"][2] - 0.05, pd["bbox_max"][2] + 0.05
        for v in VIEWS:
            key = f"p_{nm}_{v}"
            img, pf2 = zcrop(load(key), key, zlo, zhi, 1000)
            rows_clean.append(titled_panel(img, VIEW_SHORT[v], 26))
            sk = img.copy()
            draw_bone_overlay(sk, pf2, pd["runtime_bones"], width=3)
            rows_skel.append(titled_panel(sk, VIEW_SHORT[v] + " + skeleton runtime (đã biến dạng theo rig điều khiển)", 22))
        sheet = vstack([hstack(rows_clean), hstack(rows_skel)], gap=6)
        sheet = header(sheet, f"D01 Hodling — tư thế thử QA: {nm}", POSE_DESC.get(nm, ""))
        sheet = footer(sheet, ["Tư thế tĩnh QA (thực nghiệm), dựng bằng control rig thật trong Blender; KHÔNG phải animation production. Ảnh render Workbench, ánh sáng trung tính, texture gốc, không hậu kỳ."], 20)
        save(sheet, f"A2_pose_{nm}")
    # contact sheet (chi 'truoc' + 'ben' moi tu the)
    cells = []
    for nm in INFO["poses"]:
        zlo, zhi = -0.03, 0.62
        fr = zcrop(load(f"p_{nm}_front"), f"p_{nm}_front", INFO["poses"][nm]["bbox_min"][2] - 0.05, INFO["poses"][nm]["bbox_max"][2] + 0.05, 420)[0]
        sd = zcrop(load(f"p_{nm}_side"), f"p_{nm}_side", INFO["poses"][nm]["bbox_min"][2] - 0.05, INFO["poses"][nm]["bbox_max"][2] + 0.05, 420)[0]
        bk = zcrop(load(f"p_{nm}_back"), f"p_{nm}_back", INFO["poses"][nm]["bbox_min"][2] - 0.05, INFO["poses"][nm]["bbox_max"][2] + 0.05, 420)[0]
        cells.append(titled_panel(hstack([fr, sd, bk], gap=2), nm, 24))
    rows = [hstack(cells[i:i + 2], gap=8) for i in range(0, len(cells), 2)]
    cs = header(vstack(rows, gap=8), "D01 Hodling — tổng hợp tư thế cực trị (trước | bên | sau)", "Mỗi tư thế có file riêng A2_pose_<tên>_" + TAG + ".jpg (độ phân giải cao + lớp skeleton). Khung cắt theo chiều cao từng tư thế; tỉ lệ ngang/dọc giữ nguyên.")
    save(cs, "A2_pose_contact_sheet")
if "closeups" in INFO:
    CU_VN = {"shoulders": "vai (4 tư thế tay)", "hips_legs": "hông + chân (4 tư thế)", "elbows": "khuỷu", "head_neck": "đầu + cổ + mũ + tai", "torso_sack": "thân xoay ±45° + túi"}
    for g, plist in INFO["closeups"].items():
        rows = []
        for nm in plist:
            pans = [load(f"cu_{g}_{nm}_{v}").resize((560, 560), Image.LANCZOS) for v in ("front", "fl", "side", "fr", "back")]
            rows.append(titled_panel(hstack(pans, gap=4), f"{nm}  (trước | 3/4 trước-trái | bên phải | 3/4 trước-phải | sau)", 26))
        sheet = header(vstack(rows, gap=6), f"D01 Hodling — cận cảnh tư thế cực trị: {CU_VN.get(g, g)}", "Ảnh Blender thật, texture gốc, Workbench ánh sáng trung tính. Soi: vai gập, nách, khuỷu/gối 'ống nước', hông lòi, khố xuyên đùi, túi/mũ xuyên.")
        save(sheet, f"A2_pose_closeup_{g}")
SK = os.path.join(RAW, "info_sockets.json")
if os.path.exists(SK):
    SI = json.load(open(SK, encoding="utf-8"))
    INFO["views"].update(SI["views"])
    rows = []
    for nm, pd in SI["poses"].items():
        pans = []
        for v in VIEWS:
            key = f"sock_{nm}_{v}"
            img, pf2 = zcrop(load(key), key, pd["bbox_min"][2] - 0.06, pd["bbox_max"][2] + 0.06, 700)
            pans.append(img)
        ya = pd["y_axis_world"]
        rows.append(titled_panel(hstack(pans, gap=4), f"{nm} — trục Y socket (thế giới Blender): R {ya['R_weapon_attach']}, L {ya['L_weapon_attach']}", 24))
    sheet = header(vstack(rows, gap=6), "D01 Hodling — socket vũ khí đi theo bàn tay (thanh QA: R_weapon_attach xanh dương, L_weapon_attach vàng)", "Thanh = đồ QA trong bộ nhớ, KHÔNG phải giáo/vũ khí và không lưu vào file nguồn. Trục thanh = trục Y local của socket (ra trước ở T-pose).")
    save(sheet, "A2_sockets")
print("compose done")
