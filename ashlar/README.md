# ASHLAR — mục lục thư mục

Mọi thứ của game ASHLAR nằm trong thư mục này. Dự án Diablo II cũ ở `../legacy/`, ghi chú nghiên cứu ở `../research/`,
lab xem thử ở `../lookdev-lab/`. Bố cục sắp lại ngày 2026-10-24 (ba vòng, script và bảng đường dẫn cũ → mới ở
[`pipeline/_reorg/`](pipeline/_reorg/)).

```text
ashlar/
├─ art-direction/      art bible: artdirection.md (khối prompt §3, QA §11, quyết định §12), bản VI, BOARD.html
├─ INDEX.md            bảng tra mỗi asset: concept 2D, ảnh mới nhất, thư mục 3D, GLB (sinh bằng pipeline/index/build_index.py)
├─ docs/               thiết kế: biome và khu vực, hero, chuẩn quái, checklist quái
├─ art/                ảnh 2D
│  ├─ prologue/        concept mở đầu
│  ├─ act-01/          monsters/<ID>/vA|vB, environments/<nhóm>/ (A01..A25, E01..E04), _batches/ (hạ tầng lô: env_A01-A14, env_A15-A20, env_A21-A25, map01)
│  ├─ act-02/          monsters/<ID>/, _batches/monsters/ (brief, template, prompt)
│  ├─ heroes/          hero chơi được, dùng chung mọi act: <ID>/vA|vB
│  ├─ npcs/            NPC
│  ├─ hud/             phương án HUD
│  └─ textures/        terrain và tường (terrain-*, wall-ossuary-v1)
├─ 3d/                 model 3D, quy ước và danh mục ở 3d/README.md
│  ├─ act-01/monsters/<ID>/, act-01/environments/<nhóm>/<vật>/, act-01/_batches/   (cùng đường dẫn với art/)
│  ├─ heroes/<ID>/vA/ (vũ khí trong weapons/), common/<lô>/ (prop không thuộc act)
│  └─ rig-anim/        quy trình rig và animation
├─ pipeline/           công cụ làm asset
│  ├─ codex/           build_prompt.py, astra_batch.py: vẽ concept tiết kiệm token (skill concept-art)
│  ├─ index/           build_index.py: sinh INDEX.md từ hai cây art/ và 3d/
│  ├─ tripo/           Agent.md (quy trình Tripo) + scripts/ (điều khiển Tripo Studio qua CDP)
│  └─ _reorg/          script sắp xếp thư mục 10-24, bảng đường dẫn cũ → mới
└─ (gametest/ đã chuyển ra E:/Horus/diablo222/ashlar/gametest lúc 09:10 ngày 10-24, không còn trong repo này)
```

Quy ước:
- Một asset có cùng đường dẫn ở hai cây: `art/<act>/<loại>/<ID>` (concept) và `3d/<act>/<loại>/<ID>` (model); hero `heroes/<ID>/vA` ở cả hai.
- Ảnh thành phẩm và GLB nằm ở đầu thư mục asset; file phụ (prompt, task, result, log, QA, `_tasks/`, `_rejected/`, `_v*/`) nằm trong `_work/` của thư mục đó.
- Hạ tầng của một lô (manifest, prompt, template, gallery, run) ở `_batches/` của act, không lẫn với thư mục asset.
- Act mới thêm thư mục `act-0N/` ở cả `art/` và `3d/`; không tạo thư mục lồng kiểu `monsters/monsters/`.
- Sau khi thêm hoặc dời asset chạy lại `python ashlar/pipeline/index/build_index.py` để cập nhật `INDEX.md`.
- Model không thuộc ASHLAR (đồ trại, nature Blood Moor) ở `../legacy/tripo-models/`.
