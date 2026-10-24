#!/usr/bin/env python3
"""Sinh gallery.html (tĩnh, không mạng) từ manifest.json + gallery.template.html.
Chỉ đọc manifest/template, chỉ ghi gallery.html.   Chạy:  python build_gallery.py
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent

# Mô tả ngắn tiếng Việt cho từng nhóm (mood riêng từng khu; đề xuất, không phải canon).
DESC = {
    "A01": "Làng đá lửa dựng trên cọc, vá víu khắp nơi: nhà tranh, lối ván nâng, tường đá lửa, bẫy lươn. Mood ngoài trời Act I.",
    "A02": "Nghĩa địa nhà thờ: cổng mái, lồng giữ mộ, tháp xương tròn, tượng thánh không mặt đỡ vòm. Ảnh cũ E04.",
    "A03": "Cây cỏ và đá của đầm lầy: cụm cỏ, sậy, đá rêu, mảng than bùn, gốc ngập nước. Ảnh cũ E01.",
    "A04": "Liễu và gỗ: liễu già, liễu non, cây chết góc cạnh, gốc xoắn, thân rỗng, cụm rễ. Ảnh cũ E02.",
    "A05": "Bề mặt đất yên và chuyển tiếp dùng chung nhiều khu: đồng than bùn, bờ bùn-nước, đường cuội, đất anh túc, đất nghĩa địa, phấn-đá lửa. Là mảnh concept, không phải texture tileable.",
    "A06": "Night Fens, lối đi và landmark trong đầm: đường đắp, đá mốc, bãi đá bước, cọc nhử, thuyền chìm nửa, trụ cầu gãy.",
    "A07": "Rook's Weir, làng ngập nước: nhà đá lửa chìm nửa, đập gỗ-đá, tường đầu hồi, bè ván, cột đậu của quạ.",
    "A08": "Poppy Reach, đồng thuốc phiện trên đồi: cụm hoa, tường đá khô có bậc, nhà trang trại bỏ hoang, đống rơm, cổng ruộng, giàn phơi.",
    "A09": "Willow Mere, đám cưới và rễ liễu: vòm cưới, bàn dài, cặp ghế bị rễ quấn, vòm rễ lớn, cầu tàu, dây cờ phai màu.",
    "A10": "Flint Delvings, mỏ phấn và đá lửa Act I (không phải mỏ muối): vách phấn, khung chống gỗ, giếng trục, giá cuốc gạc, đống xỉ, lò nguội.",
    "A11": "Gentle House, hospice vôi trắng: gian hành lang, giường, bàn ăn, tháp cổng, bếp, chân đèn nến. Sạch, mới, không vá. Màu là đề xuất.",
    "A12": "Mộng Edda, ngôi nhà trong mơ: nhà tranh mới, cổng vườn, hàng rào, luống rau, dây phơi, lối đá vòng. Sạch, mới, không vá. Màu là đề xuất.",
    "A13": "Garden of Hush, vườn người ngủ: luống giường rỗng, khung vải che, đèn ngủ hồng, cột chuông, vòm rễ, luống anh túc. Không có người.",
    "A14": "The Cradle, cell của Mercy: khung nôi xương, rèm lanh, đèn ngủ trắng sữa, mobile xương, sàn chần bông, cặp bập bênh. Sạch, mới, không vá; không hình trẻ sơ sinh.",
}

PERSP_NOTE = "Góc nhìn game 3/4 từ trên, mỗi ô một asset cạnh bóng người H = 1,8 m cùng thước cục bộ."
TURN_NOTE = "Bốn view trực giao LEFT / RIGHT / FRONT / BACK cho mỗi asset, cùng bóng người H = 1,8 m."

FIG = (
    '<figure data-g="{id}" data-v="{v}" hidden>\n'
    '  <img src="{path}" data-path="{path}" loading="lazy" decoding="async" '
    'alt="{id} {name} - {v}" onload="imgOk(this)" onerror="imgErr(this)">\n'
    '  <p class="status" hidden>Không đọc được ảnh {v} của {id} (thiếu file hoặc lỗi): <code></code></p>\n'
    '</figure>'
)


def main():
    m = json.loads((HERE / "manifest.json").read_text(encoding="utf-8"))
    areas = {a["areaId"]: a["area"] for a in m["areaCoverage"]}
    jobs = {j["id"]: j for j in m["jobs"]}
    groups = []
    for g in m["groups"]:
        gid = g["id"]
        pj, tj = jobs[gid + "_perspective"], jobs[gid + "_turnaround"]
        names = [a["name"] for a in pj["sizeSpec"]["assets"]]
        assert len(names) == 6, gid
        groups.append({
            "id": gid,
            "name": g["name"],
            "nameVi": g["nameVi"],
            "biome": g["biome"],
            "areas": [{"id": a, "name": areas[a]} for a in g["areaPrimary"]],
            "shared": [{"id": a, "name": areas[a]} for a in g["areaShared"]],
            "assets": names,
            "desc": DESC[gid],
            "legacy": g["origin"] != "new",
            "perspective": pj["outputPath"],
            "turnaround": tj["outputPath"],
        })
    figs = [
        FIG.format(id=g["id"], name=g["name"], v=v, path=g[v])
        for g in groups for v in ("perspective", "turnaround")
    ]
    data = json.dumps(groups, ensure_ascii=False, indent=1).replace("</", "<\\/")
    html = (HERE / "gallery.template.html").read_text(encoding="utf-8")
    html = (html.replace("__IMGS__", "\n".join(figs))
                .replace("/*__DATA__*/[]", data)
                .replace("__PERSP__", PERSP_NOTE)
                .replace("__TURN__", TURN_NOTE))
    (HERE / "gallery.html").write_text(html, encoding="utf-8", newline="\n")
    print("gallery.html:", len(groups), "nhóm,", len(figs), "img,", len(html), "byte")


if __name__ == "__main__":
    sys.exit(main())
