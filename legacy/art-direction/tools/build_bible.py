"""Ghép toàn bộ chương art direction thành một file Markdown và một file HTML độc lập.

Chạy:  python legacy/art-direction/tools/build_bible.py
"""
import datetime
import html
import re
from pathlib import Path

import markdown

ROOT = Path(__file__).resolve().parent.parent
OUT_MD = ROOT / "DIABLO_II_ART_DIRECTION_TONG_HOP.md"
OUT_HTML = ROOT / "Diablo_II_Art_Direction.html"

CHAPTERS = [
    "00_TOM_TAT_ART_DIRECTION.md",
    "01_TAM_NHIN_VA_TRU_COT.md",
    "02_THEME_VA_CAU_CHUYEN.md",
    "03_MOOD_THEO_ACT.md",
    "04_MAU_SAC_VA_ANH_SANG.md",
    "05_HINH_KHOI_VAT_LIEU_CAMERA.md",
    "06_NHAN_VAT_VA_QUAI.md",
    "07_COMBAT_FEEL_VFX.md",
    "08_UI_LOOT_AM_THANH.md",
    "09_DO_DONT_VA_TIEU_CHI_DUYET.md",
    "11_ACT1_PHAN_TICH_CHI_TIET.md",
    "12_QUY_CHUAN_QUAI_CANH_QUAN_CONG_TRINH.md",
    "10_NGUON_THAM_KHAO.md",
]

# Biểu đồ nhúng vào cuối chương tương ứng (chỉ trong bản HTML).
CHARTS = {
    "04_MAU_SAC_VA_ANH_SANG.md": ("palette_board.html", "Palette & value board theo Act"),
    "11_ACT1_PHAN_TICH_CHI_TIET.md": ("act1_color_script.html", "Color script Act I"),
    "12_QUY_CHUAN_QUAI_CANH_QUAN_CONG_TRINH.md": ("scale_chart.html", "Bảng tỷ lệ quái và công trình"),
}

TITLE = "Diablo II — Art Direction tổng hợp"
NOTE = (
    "Visual · Theme · Mood · Feel · Quy chuẩn sản xuất. "
    "Nhãn độ tin cậy: [Đã xác minh]/[XM] nguồn Blizzard · [Quan sát]/[QS] kiểm tra được trong game · "
    "[Diễn giải AD] đề xuất của tài liệu. Mã HEX là màu xấp xỉ."
)


def read(name):
    return (ROOT / name).read_text(encoding="utf-8").strip()


def chapter_title(text):
    return text.splitlines()[0].lstrip("# ").strip()


def build_md(today):
    parts = [f"# {TITLE}", "", f"_{NOTE}_", "", f"_Tổng hợp ngày {today} từ thư mục `legacy/art-direction/`._", "", "## Mục lục", ""]
    for name in CHAPTERS:
        parts.append(f"- {chapter_title(read(name))}")
    for name in CHAPTERS:
        parts += ["", "---", "", read(name)]
        if name in CHARTS:
            file, label = CHARTS[name]
            parts += ["", f"> Biểu đồ: `{file}` — {label} (mở bằng trình duyệt)."]
    return "\n".join(parts) + "\n"


def slug(text, used):
    s = re.sub(r"[^\w\s-]", "", text.lower(), flags=re.UNICODE)
    s = re.sub(r"[\s_]+", "-", s).strip("-") or "muc"
    base, i = s, 2
    while s in used:
        s, i = f"{base}-{i}", i + 1
    used.add(s)
    return s


def fix_lists(text):
    # Python-Markdown cần dòng trống trước danh sách; GitHub thì không.
    out = []
    for line in text.splitlines():
        if re.match(r"\s*([-*]|\d+\.) ", line) and out and out[-1].strip() and not re.match(r"\s*([-*]|\d+\.) |\s", out[-1]):
            out.append("")
        out.append(line)
    return "\n".join(out)


def render_chapter(text, used, toc):
    body = markdown.markdown(fix_lists(text), extensions=["tables", "fenced_code", "sane_lists"])
    body = body.replace("<li>[ ] ", '<li class="todo">').replace("<li>[x] ", '<li class="todo done">')

    def add_id(m):
        level, inner = m.group(1), m.group(2)
        plain = re.sub(r"<[^>]+>", "", inner)
        hid = slug(plain, used)
        if level in ("1", "2"):
            toc.append((int(level), html.unescape(plain), hid))
        return f'<h{level} id="{hid}">{inner}</h{level}>'

    return re.sub(r"<h([1-3])>(.*?)</h\1>", add_id, body)


def chart_block(file, label):
    src = html.escape((ROOT / file).read_text(encoding="utf-8"), quote=True)
    return (
        f'<figure class="chart"><figcaption>{label} <span>({file})</span></figcaption>'
        f'<iframe srcdoc="{src}" loading="lazy" onload="fit(this)"></iframe></figure>'
    )


def build_html(today):
    used, toc, sections = set(), [], []
    for name in CHAPTERS:
        sec = render_chapter(read(name), used, toc)
        if name in CHARTS:
            sec += chart_block(*CHARTS[name])
        sections.append(f'<section class="chapter">{sec}</section>')

    nav = "".join(
        f'<a class="l{lvl}" href="#{hid}">{html.escape(t)}</a>' for lvl, t, hid in toc
    )
    return TEMPLATE.format(
        title=html.escape(TITLE), note=html.escape(NOTE), today=today, nav=nav, body="\n".join(sections)
    )


TEMPLATE = """<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<style>
  :root {{ --bg:#0d0b0a; --panel:#17130f; --line:#3a2f24; --text:#d8cbb3; --muted:#8c7f6a; --gold:#c7b377; --blood:#8a1c1c; }}
  * {{ box-sizing:border-box; }}
  html {{ scroll-behavior:smooth; }}
  body {{ margin:0; background:var(--bg); color:var(--text); font:15px/1.65 "Segoe UI", "Noto Sans", Arial, sans-serif; }}
  nav {{ position:fixed; top:0; left:0; bottom:0; width:290px; overflow-y:auto; background:var(--panel); border-right:1px solid var(--line); padding:22px 16px 40px; }}
  nav .brand {{ font:600 17px/1.3 "Times New Roman", serif; color:var(--gold); margin-bottom:4px; letter-spacing:.03em; }}
  nav .date {{ font-size:11px; color:var(--muted); margin-bottom:16px; }}
  nav a {{ display:block; color:var(--muted); text-decoration:none; padding:3px 6px; border-radius:4px; font-size:13px; line-height:1.35; }}
  nav a:hover {{ background:#221b15; color:var(--text); }}
  nav a.l1 {{ color:var(--text); font-weight:600; margin-top:10px; }}
  nav a.l2 {{ padding-left:16px; font-size:12px; }}
  main {{ margin-left:290px; padding:40px 56px 80px; max-width:1180px; }}
  header.cover {{ border:1px solid var(--line); background:linear-gradient(180deg,#1d1611,#0d0b0a); border-radius:10px; padding:36px 32px; margin-bottom:36px; }}
  header.cover h1 {{ margin:0; font:600 34px/1.2 "Times New Roman", serif; color:var(--gold); letter-spacing:.04em; border:0; padding:0; }}
  header.cover p {{ color:var(--muted); margin:10px 0 0; }}
  .chapter {{ border-top:1px solid var(--line); padding-top:12px; margin-top:44px; }}
  h1 {{ font:600 28px/1.25 "Times New Roman", serif; color:var(--gold); margin:18px 0 14px; scroll-margin-top:16px; }}
  h2 {{ font:600 20px/1.3 "Times New Roman", serif; color:var(--text); margin:30px 0 10px; padding-bottom:4px; border-bottom:1px solid var(--line); scroll-margin-top:16px; }}
  h3 {{ font-size:15px; color:var(--gold); margin:22px 0 8px; text-transform:uppercase; letter-spacing:.04em; }}
  a {{ color:#d7a85a; }}
  strong {{ color:#efe2c8; }}
  blockquote {{ margin:16px 0; padding:12px 18px; border-left:3px solid var(--blood); background:#1a1310; color:#e6d7bb; border-radius:0 6px 6px 0; }}
  blockquote p {{ margin:0; }}
  table {{ border-collapse:collapse; width:100%; margin:12px 0 18px; font-size:13.5px; display:block; overflow-x:auto; }}
  th, td {{ border:1px solid var(--line); padding:7px 10px; text-align:left; vertical-align:top; }}
  th {{ background:#211a14; color:var(--gold); font-weight:600; }}
  tr:nth-child(even) td {{ background:#120f0c; }}
  code {{ font:12.5px Consolas, monospace; background:#211a14; padding:1px 5px; border-radius:3px; color:#e8c98a; }}
  pre {{ background:#120f0c; border:1px solid var(--line); border-radius:6px; padding:14px; overflow-x:auto; }}
  pre code {{ background:none; padding:0; color:var(--text); }}
  li.todo {{ list-style:none; margin-left:-18px; }}
  li.todo::before {{ content:"☐  "; color:var(--gold); }}
  li.todo.done::before {{ content:"☑  "; }}
  hr {{ border:0; border-top:1px solid var(--line); }}
  figure.chart {{ margin:24px 0; border:1px solid var(--line); border-radius:8px; overflow:hidden; background:var(--bg); }}
  figure.chart figcaption {{ padding:8px 14px; background:var(--panel); color:var(--gold); font-size:13px; font-weight:600; }}
  figure.chart figcaption span {{ color:var(--muted); font-weight:normal; }}
  figure.chart iframe {{ width:100%; height:600px; border:0; display:block; }}
  @media (max-width:900px) {{ nav {{ position:static; width:auto; border-right:0; border-bottom:1px solid var(--line); max-height:50vh; }} main {{ margin-left:0; padding:24px 18px 60px; }} }}
  @media print {{ nav {{ display:none; }} main {{ margin:0; max-width:none; }} body {{ background:#fff; color:#111; }} h1,h3 {{ color:#5a3b10; }} th {{ background:#eee; color:#111; }} tr:nth-child(even) td {{ background:#f7f7f7; }} strong {{ color:#000; }} blockquote {{ background:#f4eee4; color:#222; }} .chapter {{ break-before:page; }} }}
</style>
</head>
<body>
<nav><div class="brand">{title}</div><div class="date">Tổng hợp {today}</div>{nav}</nav>
<main>
<header class="cover"><h1>{title}</h1><p>{note}</p></header>
{body}
</main>
<script>
function fit(f) {{
  try {{
    const d = f.contentDocument;
    f.style.height = "10px";
    const h = d.documentElement.scrollHeight;
    if (h) f.style.height = h + 4 + "px";
  }} catch (e) {{}}
}}
</script>
</body>
</html>
"""


def main():
    today = datetime.date.today().isoformat()
    OUT_MD.write_text(build_md(today), encoding="utf-8")
    OUT_HTML.write_text(build_html(today), encoding="utf-8")
    print(f"Wrote {OUT_MD.name} and {OUT_HTML.name}")


if __name__ == "__main__":
    main()
