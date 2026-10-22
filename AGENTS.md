# Hướng dẫn dự án

Đọc và tuân thủ [Agent.md](./Agent.md) trong cùng thư mục trước khi thực hiện công việc. File đó quy định phân công model và vòng lặp Sonnet 5.5 → Opus 5.5 → Sonnet 5.5 khi cần sửa.

Khi dựng model 3D bằng Tripo AI, đọc thêm [art-output/tripo-models/Agent.md](./art-output/tripo-models/Agent.md) (quy trình concept → T-pose → Tripo Studio trên trình duyệt → GLB). Model 3D của game ASHLAR đặt ở [ashlar/3d/](./ashlar/3d/README.md), mỗi asset một thư mục; quy ước và danh mục ở README trong đó.

Khi rig hoặc làm animation cho hero, quái, NPC của ASHLAR, đọc [ashlar/3d/rig-anim/Agent.md](./ashlar/3d/rig-anim/Agent.md) (phân họ skeleton, ba route rig, cổng duyệt G1–G4, chuẩn bone và clip, QA, kiểm kê); cách làm trong Blender theo skill [.agents/skills/blender-game-animation](./.agents/skills/blender-game-animation/SKILL.md), và nối vào game theo [game-animation-integration](./.agents/skills/game-animation-integration/SKILL.md). Rig và animation là việc riêng, chỉ làm khi người dùng yêu cầu cho asset đó.

Mọi bước tạo hoặc chỉnh sửa ảnh (concept, sheet, texture, normal map, T-pose cho Tripo, key art) phải đọc và bám sát [ashlar/artdirection.md](./ashlar/artdirection.md): style đã chốt là stylized vừa phải như Diablo Immortal; dán nguyên văn các khối prompt ở §3 và QA từng ảnh theo §11.
