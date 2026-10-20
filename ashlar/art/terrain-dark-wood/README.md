# Dark Wood · texture địa hình phong cách vẽ tay (ASHLAR)

Bộ texture mặt đất cho khu rừng "Dark Wood", dựng theo ảnh tham chiếu Diablo Immortal (`ref/`). Bản **stylized** (vẽ tay, ít chi tiết) là hướng nghệ thuật của ASHLAR.

## Style chung và mood từng map

Theo quyết định mới nhất của người dùng: mood thay đổi theo map; Map 1 lấy mood Act I Diablo II (diễn ý, không phải trích nguyên văn).

- **Style chung** (toàn ASHLAR): painterly/stylized ít chi tiết, khối rõ, mật độ nét và mảng theo `stylized2`, khả năng đọc theo Immortal. Immortal là tham chiếu style/readability, không phải preset mood toàn game.
- **Mood riêng từng map:** palette, ánh sáng, thời tiết, sương, tương phản, nhịp cảm xúc. **Map 1 hướng tới mood Act I Diablo II** (đồng hoang/rừng ẩm lạnh, xanh cỏ sẫm/ôliu, đất nâu bùn, đá xám cũ, ánh sáng u ám tiết chế, điểm ấm nhỏ nơi có người). Đây là đề xuất triển khai; giờ trong ngày, camera, budget và chi tiết map chưa khóa. "Map 1" không tự đồng nhất với toàn bộ Act I hay Prologue ASHLAR. Chi tiết: [`ASHLAR_ART_DIRECTION_VI.md`](../../ASHLAR_ART_DIRECTION_VI.md) §7.1. Biome, khu vực và quái (không thuộc phạm vi texture này): [Biome và khu vực](../../ASHLAR_BIOME_VA_KHU_VUC_VI.md), [Quy chuẩn quái](../../ASHLAR_QUY_CHUAN_QUAI_VI.md), [Checklist quái](../../ASHLAR_MONSTER_CHECKLIST_VI.md), [bảng tham chiếu hình ảnh](../../ASHLAR_ART_DIRECTION_BOARD.html).
- **Dark Wood v1** (mood ánh trăng xanh lạnh, `_ingame/webgl_stylized_v1.png`) là mood riêng của scene thử Immortal và mẫu style lịch sử, không phải mood mặc định của ASHLAR hay Map 1.
- **`stylized2_green` + scene `darkWoodD2`** là điểm xuất phát lookdev của Map 1, chưa phải Map 1 đã dựng hay nghiệm thu (`_ingame/d2_webgl.png` chỉ là ảnh tham khảo của scene thử). Bản **realistic** (ảnh thực hơn) vẫn nằm ở `art-output/terrain-darkwood/` (các file `dirt_loam.png`, `mud_wet.png`, `grass_shade.png`, `path_cobble.png`, `grass_cards.png` ở gốc thư mục đó).

Mỗi thư mục nguồn có 5 file cùng tên: `dirt_loam.png`, `mud_wet.png`, `grass_shade.png` (ô vuông lát được), `path_cobble.png` (dải đường dọc, đá cuội), `grass_cards.png` (2×2 cụm cỏ trên nền magenta #FF00FF).

## Các thư mục

| Thư mục | Vai trò |
|---|---|
| `stylized2/` | **Chuẩn style** (mật độ chi tiết, nét cọ, mảng) của ASHLAR; màu gốc xanh lam xám, ánh trăng lạnh là mood của scene thử Immortal, không bắt buộc cho map nào. Là bộ mặc định của scene `darkWood` trong lab (`TERRAIN_SETS.darkWoodStylized`, prefix `darkwood-sty`). Đá đường lớn, ít chi tiết. |
| `stylized2_green/` | Bản **recolor xanh lá** của `stylized2` theo hướng mood Diablo II, **điểm xuất phát lookdev của Map 1** (`recolor_green.py`: chỉ đổi hue/chroma trong CIELAB, giữ nguyên nét vẽ). Là bộ mặc định của scene `darkWoodD2` (`TERRAIN_SETS.darkWoodGreen`, prefix `darkwood-sty-green`). |
| `stylized2_green_v1/` | Bản recolor xanh lần đầu (còn hơi nâu); giữ để so sánh, không dùng. |
| `stylized/` | Lần vẽ đầu — **bị loại**: còn quá nhiều chi tiết, nhìn vẫn như texture ảnh. |
| `stylized3/` | Dải đường lần 3 (đá nhỏ hơn ~2,5 lần) — **bị loại**: trong scene nhìn lốm đốm / loang lổ. Giữ file, không dùng (đường dùng lại dải đá lớn của `stylized2`). |
| `ref/` | Ảnh tham chiếu (bản sao; `art-output/terrain-darkwood/run.sh` của bản realistic cũng dùng `ref/` ở đó). |
| `_ingame/`, `_tiling/` | Ảnh chụp trong lab (WebGL / WebGPU, so sánh mood Immortal ↔ D2, cận cảnh đường; `d2_webgl.png` là ảnh tham khảo hướng Map 1) và ảnh kiểm tra lát 3×3 của normal map. |
| `sty*_*.task.txt`, `*.log1`, `*.result1.txt`, `run_sty.sh` | Prompt Codex và log của các lần vẽ lại (đường dẫn trong log là đường dẫn cũ lúc chạy). |
| `_review_*.jpg` | Ảnh duyệt các lần vẽ. |

## Dựng lại bộ texture cho lab

Chạy trong `lookdev-lab/` (script ghi `assets/samples/darkwood-*` và `src/assets/samples.json`; ổ đĩa đôi khi báo lỗi EINVAL thoáng qua, script tự thử lại):

```
# Mood Immortal (mặc định của scene darkWood)
python -I scripts/prepare-terrain-darkwood.py ../ashlar/art/terrain-dark-wood/stylized2 --prefix darkwood-sty --stylized --label "Dark Wood (stylized)"

# D2 xanh lá, điểm xuất phát Map 1 (mặc định của scene darkWoodD2)
python -I scripts/prepare-terrain-darkwood.py ../ashlar/art/terrain-dark-wood/stylized2_green --prefix darkwood-sty-green --stylized --puddle-rough 0.7 --mud-rough 0.9 --label "Dark Wood (stylized, green)"

# Tạo lại stylized2_green từ stylized2 (cần scikit-image)
python -I recolor_green.py
```

`--stylized` làm height mượt hơn và normal nhẹ hơn (nét cọ không thành bump nhiễu); `--puddle-rough` / `--mud-rough` nâng độ nhám của lớp bùn để ánh sáng quanh nhân vật không phản chiếu thành vệt sáng. Bản realistic: `python -I scripts/prepare-terrain-darkwood.py` (không tham số).

## Scene trong lab

- `darkWood` — "Act I · Dark Wood (Immortal ref)": mood ánh trăng xanh lạnh, bộ `darkWoodStylized` (có thể chọn `darkWoodRef` = realistic). Là scene thử mood Immortal, không phải mood mặc định của ASHLAR.
- `darkWoodD2` — "Act I · Dark Wood (D2 mood)": mood Diablo II (iso 2:1, ACES, ánh sáng quanh nhân vật), bộ `darkWoodGreen`. Là điểm xuất phát lookdev của Map 1, chưa phải Map 1 hoàn tất; tên scene và nhãn "Act I" trong lab không có nghĩa Map 1 = toàn bộ Act I.

Cả hai dùng chung địa hình, đường đá, rừng và đá phủ rêu; khác nhau ở bộ texture, ánh sáng và hậu kỳ (mỗi scene tự lưu cài đặt post).
