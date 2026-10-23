# Nghiên cứu: đặt khớp xương (joint placement) và tính skin weight cho auto-rig, 2007–2026

Ngày: 2026-10-22. Phạm vi: nghiên cứu, không sửa repo nào, không chạy inference. Mục tiêu: chọn phương pháp chính xác và bền cho mesh Tripo (~10k tri, single mesh, thường không kín, topology không đối xứng, quần áo dính thân, đôi khi ngón tay dính thành khối). Ngoài phạm vi: facial rigging.

Quy ước confidence:
- HIGH: đã đọc paper, repo hoặc doc trực tiếp (fetch nội dung, hoặc đọc text PDF cục bộ bằng pdftotext).
- MED: chỉ thấy snippet tìm kiếm, hoặc trang bị chặn (403/404/lỗi kết nối) và thông tin đến từ nguồn thứ cấp.
- LOW: blog, marketing, forum, hoặc suy luận/đề xuất của tôi.
- unverified: không xác nhận được.

Ghi chú về nguồn: Pinocchio PDF tải về rồi đọc cục bộ (text đầy đủ). Mean Curvature Skeletons (liris) lỗi kết nối, ROSA đọc được. Blender bug #45493 và trang manual Blender trả 403 nên các ý liên quan dựa vào snippet (MED). Text trích xuất nằm ở E:/tmp_rig_research/scratch/ (pinocchio.txt, rswt.txt, unirig.txt, rosa.txt).

---

## 0. Cách đọc số liệu

Mỗi paper dùng giao thức đánh giá riêng (chuẩn hoá mesh, đơn vị, tập test khác nhau). Chỉ so sánh được số trong cùng một bảng của cùng một paper.
- UniRig: mesh chuẩn hoá về cube [-1,1]^3 (HIGH, https://arxiv.org/pdf/2504.12451).
- MagicArticulate và Puppeteer: Chamfer nhân 10^-2 (HIGH).
- RigNet (arXiv v1): đơn vị % (HIGH, https://arxiv.org/html/2005.00559v1). Bản TOG có thể khác (MED).
- SkinTokens: skin L1 với ngưỡng ε = 10^-2, thang số khác UniRig nên không so chéo (HIGH, https://arxiv.org/html/2602.04805).

---

## 1. Phương pháp hình học cổ điển (implement bằng numpy trong Blender)

### 1.1 Pinocchio (Baran & Popović, SIGGRAPH 2007, ACM TOG 26(3) art. 72)
- Nguồn: https://people.csail.mit.edu/ibaran/papers/2007-SIGGRAPH-Pinocchio.pdf (HIGH, đọc text).
- Quy trình (HIGH):
  - Rời rạc hoá phần trong thể tích bằng distance field và các quả cầu, dựng đồ thị (Gabriel graph), tìm đường ngắn nhất giữa các khớp mẫu.
  - Tối ưu embedding theo penalty functions có trọng số học từ ví dụ (max-margin), rồi refine liên tục khoảng 1.2 s.
  - Skin attachment: heat equilibrium chỉ trên bề mặt (không tính thể tích); tại một số đỉnh cộng thêm nhiệt từ xương gần nhất.
- Giả định đầu vào, nguyên văn: "The character mesh must be the boundary of a connected volume." (HIGH). Mesh Tripo không kín, nhiều island hoặc ngón dính đều vi phạm trực tiếp.
- Độ chính xác (HIGH): đúng 13/16 model test (81%); 3 model còn lại sửa được bằng một gợi ý khớp.
- Thời gian (HIGH): trung bình 31.3 s/model trên CPU 2007 (1.73 GHz, 1 GB RAM); discretization chiếm phần lớn.
- Lỗi do chính tác giả nêu (HIGH): tay tỉ lệ lạ ("large arms and tiny legs ... causes problems"), vùng hông/vai/cổ; vật liệu (váy, áo giáp) bị "rubbery" vì không xét vật liệu; tay và ngón không được xử lý ("hand animation ... challenging").
- Benchmark sau này (HIGH): Pinocchio là baseline yếu nhất trong mọi bảng học sâu. CD-J2J 8.36 (x10^-2) trên Articulation-XL (MagicArticulate Table 1, https://arxiv.org/html/2502.12135v2). CD 0.198 trên Anymate-14K so với RigNet 0.094 (https://arxiv.org/html/2505.06227v1).
- Khả thi trong numpy: có. Distance field, đồ thị và shortest path đều implement được. Điểm yếu là phải có bước tạo proxy kín (xem 1.6).

### 1.2 Mean Curvature Skeletons (Tagliasacchi, Alhashim, Olson, Zhang; CGF/SGP 2012, 31(5):1735–1744)
- PDF không tải được (lỗi kết nối). Thông tin dựa trên CGAL doc và snippet (MED): https://projet.liris.cnrs.fr/imagine/pub/proceedings/SGP-2012/pdf/v31i5pp1735-1744.pdf
- Thuật toán (HIGH, CGAL doc https://doc.cgal.org/latest/Surface_mesh_skeletonization/index.html): co mesh bằng mean curvature flow, lặp: (1) contract, (2) collapse cạnh ngắn và split tam giác xấu, (3) sửa đỉnh thoái hoá, đến khi hội tụ.
- Đầu vào (HIGH, CGAL doc): "no boundary and only one connected component". CGAL không nêu rõ yêu cầu manifold, và không có cam kết mạnh về độ bền.
- Thời gian (MED, CGAL doc, đơn vị ghi không nhất quán): 2,775 đỉnh ~0.46; 11,112 ~1.26; 44,460 ~5.64; 177,852 ~26.26 (i7-2820QM, CGAL 4.7).
- Kết luận: không dùng trực tiếp cho mesh Tripo có lỗ hoặc nhiều island. Phải tạo bản kín để trích skeleton rồi ánh xạ lại. Không tìm thấy số độ chính xác khớp của MCS (unverified).

### 1.3 ROSA: curve skeleton từ point cloud không đầy đủ (Tagliasacchi, Zhang, Cohen-Or; SGP 2009)
- PDF: https://www.cs.princeton.edu/courses/archive/spring11/cos598A/pdfs/Tagliasacchi09.pdf (HIGH, đọc text).
- Đầu vào: point cloud có normal định hướng. Không cần kín. Xử lý được thiếu dữ liệu lớn nhờ normal (HIGH).
- Giới hạn nêu rõ (HIGH): chỉ áp dụng cho vùng "generally cylindrical"; "a serving plate, baseball cap, or bowling ball ... possess no natural curve skeletons". Nghĩa là tay áo rộng, cánh, vật phẳng hoặc đa lớp không phù hợp.
- Cách lấy khớp (HIGH): cắt phẳng đệ quy, ROSA cục bộ, và xử lý riêng vùng khớp (joint region).
- Không thấy số khoảng cách khớp so với ground truth trong phần đã đọc (unverified).

### 1.4 Các phương pháp khác
- Ray-cast "mid-depth" và shape diameter function (Shapira và cộng sự, 2008): không xác nhận được nguồn (unverified). Đề xuất dùng như heuristic cho thân và chân (LOW).
- Cross-section slicing (tâm tiết diện, khớp tại cực tiểu diện tích hoặc girth): không tìm thấy paper đo độ chính xác. Đây là heuristic thực hành (LOW, unverified). Suy luận: dễ sai ở chỗ quần áo phồng hoặc khớp dày.
- PCA trục đoạn chi: chuẩn và đơn giản, nhưng không có số đo đã công bố (unverified). Dễ lệch khi đoạn bị quần áo che.
- Template và landmark fitting: Rigify có các preset Basic Human, Basic Quadruped, Human, Cat, Wolf, Horse, Shark (MED, docs bản địa hoá https://docs.blender.org/manual/de/dev/addons/rigify/basics.html). Không thấy preset chim (MED). Đây là cách fit thủ công hơn là tự động.

### 1.5 Kết luận cho mục 1
- Chính xác nhất trong nhóm hình học là embedding kiểu Pinocchio: 81% thành công trên 16 model sạch (HIGH). Nhưng nó chỉ đúng khi mesh là biên của thể tích liên thông.
- Với Tripo: tạo proxy kín (voxel remesh hoặc fill hole), chạy embedding trên proxy, rồi ánh xạ khớp về mesh gốc. Chưa có paper nào kiểm chứng cách này (LOW, đề xuất).
- Rủi ro với mesh dính (suy luận, LOW): khớp bị kéo về khối quần áo; ngón dính thành khối làm embedding tay sai.

---

## 2. Auto-rigger học sâu: trạng thái tính đến 2026-10-22

### 2.1 Bảng tóm tắt

| Model (năm, venue) | Output | Phạm vi | License code / weights | Release hiện tại | Phần cứng | Số liệu chính (trong cùng bảng) | Lỗi đã nêu |
|---|---|---|---|---|---|---|---|
| RigNet (2020, arXiv 2005.00559) | Khớp, cây, skin | Đa loại, rest pose | unverified | Code gốc (unverified) | Chậm, ~120 s/mesh trên A100 (RigAnything Table 1) | CD-J2J 3.9%, skin L1 0.39 (v1) | Thiếu chi, đuôi, cánh; chỉ rest pose (HIGH) |
| UniRig (2025, SIGGRAPH; arXiv 2504.12451) | Skeleton + skin | Đa loại | Code MIT (HIGH); weights không nêu (HIGH) | Xem 2.2, mâu thuẫn | ≥8 GB VRAM suy luận; Python 3.11; PyTorch ≥2.3.1 (HIGH) | J2J: 0.0101 (Mixamo), 0.0549 (Rig-XL); skin L1 0.0055 (Mixamo), 0.0329 (Rig-XL) | Phụ thuộc skeleton; thiếu tail/wing bone làm hỏng (HIGH) |
| MagicArticulate (CVPR 2025; arXiv 2502.12135) | Skeleton (AR) + skin (diffusion) | Đa loại (Articulation-XL) | Apache-2.0 (HIGH) | Skeleton và skin đều có; train code không nêu (HIGH) | ~4.6 GB VRAM, 1–2 s; Python 3.10.13, torch 2.1.1 cu118, flash-attn 2.6.3 (HIGH) | CD-J2J 2.586 (spatial) Arti-XL; skin prec 80.7, rec 77.2, L1 0.337 (HIGH) | Mesh thô làm skeleton sai; khác domain; khớp thân-chân dog (HIGH) |
| Puppeteer (arXiv 2508.10898; Seed3D) | Skeleton (AR) + skin (attention) + animation | Đa loại, có 4.1k động vật | Apache-2.0 (HIGH, trang repo) | Inference code và checkpoint; train code không nêu (HIGH) | Cài torch 2.1.1 cu118, pytorch3d, flash-attn; export.py cần bpy==4.2.0 (HIGH) | J2J 3.033 (Arti-XL2.0); skin L1 0.335 (HIGH) | Không bắt được tóc hay vải bay (HIGH); animation ~20 phút/A100 (HIGH) |
| RigAnything (SIGGRAPH TOG 2025; arXiv 2502.09615) | Khớp, cây parent, skin | Đa loại (người, thú, côn trùng, sinh vật biển, tác giả nêu) | LICENSE.md tồn tại, nội dung không đọc được (unverified) | Có 1 checkpoint trên HF (HIGH) | CUDA cuda:0; Python 3.11; CUDA 12.x; VRAM không nêu (HIGH) | Skel IoU 0.768, CD-J2J 0.034; skin prec 0.825, rec 0.798, L1 0.432 (HIGH) | Không kiểm soát LOD; chỉ có hình học; skin không tính kiểu chuyển động (HIGH) |
| Make-It-Animatable (CVPR 2025; arXiv 2411.18197) | Bone + blend weight + pose | Chỉ humanoid (Mixamo 95 nhân vật, 52 bone) | Code MIT (HIGH); weights không nêu (HIGH) | Release, có app.py (HIGH) | Train tinh chỉnh cho A100 80 GB; inference ~0.5 s với 8k đỉnh (HIGH) | Humanoid: IoU 82.5%, CD-J2J 4.49% so với RigNet 6.63% (HIGH); skin không có số | Non-bipedal là future work (HIGH) |
| Anymate (SIGGRAPH 2025; arXiv 2505.06227) | Khớp, connectivity, skin | Đa loại, 230,716 asset | Chưa xác nhận | Paper nói "will be publicly released" (HIGH); HF Space có script checkpoint (MED) | Không nêu | CD joints 0.077 (225K); skin CE 0.741, cos 0.915, MAE 0.014 (HIGH) | Quá nhiều khớp ở phần to; xuyên làm hỏng skin (HIGH) |
| HumanRig (CVPR 2025; arXiv 2412.02317) | Khớp + skin | Chỉ humanoid T-pose, 11,434 mesh | Không tìm thấy repo (unverified) | unverified | unverified | unverified | unverified |
| SkinTokens / TokenRig (arXiv 2602.04805; ACM TOG 2026) | Skeleton + skin; hoặc chỉ skin với --use_skeleton | Đa loại (số liệu định lượng trên ModelsRes, Articulation-2.0 và Truebones Zoo; bird, insect, dragon chỉ định tính) | Code MIT (HIGH); checkpoint đã release (HIGH) | Đủ: TokenRig + tokenizer skin (HIGH); dữ liệu train chưa release (HIGH) | ≥14 GB VRAM; Python ≥3.11; CUDA ≥12.1; PyTorch 2.7.0; flash-attn (HIGH) | J2J 2.515 (Arti-2.0, 4 token); skin L1 0.0178 (Arti-2.0), 0.0168 (ModelsRes); cả hai tự báo cáo (HIGH) | Gap so với VAE liên tục ở skin khó; handle mỏng/vòng lặp; móng mảnh (HIGH); cả pipeline ~15 s (HIGH) |
| Tripo rig_model (API thương mại) | Rig (skin và hierarchy không nêu) | 7 loại: biped, quadruped, hexapod, octopod, avian, serpentine, aquatic, others | Thương mại | Có qua MCP trong môi trường này | Cloud | unverified | Chưa có số đo độ chính xác công khai (unverified) |

Các mục khác (MED, chỉ từ snippet):
- Rigel3D (arXiv 2605.13129, 2026): sinh mesh và rig từ ảnh; không phải rigger cho mesh có sẵn, nên loại khỏi pipeline Tripo.
- AniGen (arXiv 2604.08746, 2026): generative, không phải rigger cho mesh có sẵn.
- ViP-Rig (arXiv 2607.27982, 2026): mở rộng UniRig với visual prompt, giữ backbone UniRig. Số của họ: UniRig đạt 3.232% CD-J2J trên benchmark Art của họ (MED).
- SPRig (arXiv 2602.12740, 2026): self-supervised từ mesh sequence; chi tiết không đủ (unverified).

### 2.2 Chi tiết từng model chính

UniRig (VAST / Tsinghua, SIGGRAPH 2025)
- Repo: https://github.com/VAST-AI-Research/UniRig (HIGH).
- Code MIT. Trang repo không nêu license cho weights và nói dữ liệu có điều khoản riêng (HIGH). Một bản ONNX bên thứ ba ghi Articulation-XL2.0 là CC-BY-4.0 (MED).
- Trạng thái release mâu thuẫn (HIGH, repo đọc trực tiếp): mục "Available Now" liệt kê skeleton và skinning checkpoint trên HF (Articulation-XL2.0), còn phần cài đặt chỉ nói checkpoint skeleton. Checkpoint đầy đủ train trên Rig-XL/VRoid nằm ở mục "Planned". Model card HF chỉ ghi skeleton. Kết luận: skinning weight có thể đã phát hành một phần, cần kiểm tra lại (unverified).
- Input (HIGH): .obj, .fbx, .glb, .vrm. Lấy 65,536 điểm trên bề mặt kèm normal để mã hoá hình học. Không nêu yêu cầu kín hay single mesh.
- Phần cứng và phụ thuộc (HIGH): ≥8 GB VRAM để sinh; Python 3.11; PyTorch ≥2.3.1; numpy==1.26.4; cảnh báo "high chance" lỗi cài flash_attn. Train: ≥60 GB bộ nhớ một GPU; khoảng 18 giờ trên 4× RTX 4090 cho skeleton.
- Blender: chỉ có add-on tuỳ chọn cho VRM (HIGH).
- Số liệu (HIGH, paper Table 3–4): J2J (unit cube) Ours 0.0101 Mixamo, 0.0092 VRoid, 0.0549 Rig-XL; RigNet 0.1022–0.2484; NBS 0.0205–0.0429. Skin L1 Ours 0.0055, 0.0028, 0.0059, 0.0038, 0.0329; RigNet 0.045–0.061; NBS 0.027–0.082.
- Lỗi (HIGH): "results may degrade significantly if the skeleton is inaccurate ... if tail bones or wing bones are missing"; "might struggle with highly unusual skeletal structures, such as ... abstract or highly stylized characters".
- Bảng 1 trong paper ghi "Tripo supports only human and quadruped categories" (HIGH, 2025). Tripo docs hiện nay liệt kê nhiều loại hơn (xem 2.3), nên ghi chú này đã lỗi thời.

MagicArticulate (Song và cộng sự, CVPR 2025)
- Paper: https://arxiv.org/html/2502.12135v2. Repo: https://github.com/Seed3D/MagicArticulate (HIGH).
- Apache-2.0 (HIGH). Có inference code, trọng số skeleton (HF), dataset Articulation-XL2.0 đã xử lý (>48K model) (HIGH). Train code không thấy (HIGH). Có script Blender đọc GLB (MED).
- Skeleton: AR, OPT-350M, khớp rời rạc trên lưới 128^3, conditioning từ 8,192 điểm (HIGH). Skin: stage 2 dùng diffusion (DDPM, 25 bước inference), dự đoán phần dư từ geodesic volumetric prior (HIGH).
- Số liệu (HIGH, Table 1–2, x10^-2): Arti-XL CD-J2J 2.586 (spatial), 3.025 (hierarchical); RigNet 7.478; Pinocchio 8.360. Skin Arti-XL: prec 80.7, rec 77.2, L1 0.337; GVB 0.724.
- Lỗi (HIGH): "our approach struggles with coarse mesh inputs, often producing inaccurate skeletons"; khoảng cách domain với mesh thô; "imperfect connections between the dog's trunk and legs".

Puppeteer (Seed3D, arXiv 2508.10898)
- Paper: https://arxiv.org/html/2508.10898v1. Repo: https://github.com/Seed3D/Puppeteer (HIGH, trang repo). Apache-2.0 (HIGH). NeurIPS 2025 spotlight (MED, Gitee mirror https://gitee.com/monkeycc/Puppeteer).
- Skeleton: AR (OPT-350M) trên 8,192 điểm bề mặt kèm normal (HIGH). Skin: attention có mã hoá khoảng cách trên đồ thị khớp (HIGH). Animation: tối ưu theo video sinh bởi model text-to-video, khoảng 20 phút trên 1 A100 với mesh ≤10K đỉnh (HIGH).
- Số liệu (HIGH, x10^-2): J2J Ours 3.033, MagicArticulate 3.264, UniRig 3.305, RigNet 7.618, Pinocchio 8.324. Skin Arti-XL2.0: Ours prec 87.6, rec 74.0, L1 0.335; RigNet L1 0.729; GVB 0.745. UniRig không được so sánh về skin.
- Tốc độ (HIGH): skeleton 1.5 s; skin 0.032 s.
- Lỗi (HIGH): "cannot capture fine-scale deformations, such as flowing hair or fluttering cloth"; "Rapid movements with large joint rotations present challenges"; "single-view optimization inherently struggles when critical joints remain occluded".
- Đã thử trên Tripo 2.0 và Hunyuan3D 2.0 (HIGH). Cẩn trọng: export.py yêu cầu bpy==4.2.0. Không cài chung với Blender 5.2 (HIGH).

Make-It-Animatable (CVPR 2025)
- Paper: https://arxiv.org/html/2411.18197v2. Repo: https://github.com/jasongzy/Make-It-Animatable (HIGH).
- Code MIT (HIGH). Weights không nêu license (HIGH). v2 chỉ nhận mesh (HIGH).
- Output: vị trí bone, blend weight, pose; hierarchy không mô tả (HIGH).
- Huấn luyện: Mixamo 95 nhân vật, 2,453 chuyển động, 52 bone; VRoid 35 nhân vật thêm bone (HIGH). Đánh giá định lượng chỉ trên bipedal (HIGH). Nhân vật thú và cartoon chỉ có hình minh hoạ (HIGH).
- Tốc độ (HIGH): <1 s; ~0.5 s với mesh 8k đỉnh.
- Phù hợp: humanoid. Không phù hợp: nhện, rắn, chim, quái không hai chân.

RigAnything (SIGGRAPH TOG 2025)
- Paper: https://arxiv.org/html/2502.09615v2. Repo: https://github.com/Isabella98Liu/RigAnything (HIGH).
- Sinh từng khớp theo thứ tự BFS; mỗi bước dùng toàn bộ hình dạng và các khớp trước, có diffusion cho vị trí khớp (HIGH).
- Số liệu (HIGH, Table 3, 6–8): RigNet+Objaverse Ours IoU 0.768, CD-J2J 0.034; RigNet 0.456, 0.048. Humanoid subset: CD-J2J 0.030 (TaRig 0.100). Skin: prec 0.825, rec 0.798, L1 0.432 (RigNet 0.755, 0.828, 0.485).
- Tốc độ: ~2 s/mesh trên A100 (v1 preprint, MED).
- Input (HIGH): .glb trực tiếp; .obj chuyển thành .glb và mất texture. Có tuỳ chọn giảm mặt xuống 8192 trước khi rig.
- Blender (HIGH): script dùng bpy và xuất GLB; không có add-on.
- Lỗi (HIGH): "does not allow for control over the level of detail"; hình học thuần có thể "lack sufficient cues"; skin "does not account for different motion styles".

Anymate (SIGGRAPH 2025)
- Paper: https://arxiv.org/html/2505.06227v1. Trang: https://anymate3d.github.io/ (được paper nêu, chưa mở).
- Dataset 230,716 asset (HIGH), chia test 5.6K, train ~225K, small 14K (HIGH).
- Số liệu (HIGH): CD joints Bert-Regress 0.077 (225K), RigNet 0.089; Pinocchio 0.198 (14K). Skin Bert-Cross 225K: CE 0.741, cos 0.915, MAE 0.014. Connectivity prec 84.6 (Bert-2Branch 225K).
- Lỗi (HIGH): "when some parts of the mesh penetrate or are too close to other parts, it may cause failure in skinning prediction"; "when the mesh contains some bulky parts, it may predict too many joints". Kiểm tra thủ công 5,000 mẫu: 4.6% kém, chủ yếu do skeleton annotated lỗi.

SkinTokens / TokenRig (Zhang và cộng sự, ACM TOG 2026)
- Paper: https://arxiv.org/html/2602.04805. Repo: https://github.com/VAST-AI-Research/SkinTokens (HIGH).
- Code MIT; checkpoint: skin_vae_2_10_32768 và articulation_xl_quantization_256_token_4 (TokenRig, GRPO) (HIGH). Có --use_skeleton để chỉ sinh skin cho skeleton có sẵn (HIGH). Có --use_postprocess (voxel) (HIGH).
- Phần cứng và phụ thuộc (HIGH): ≥14 GB VRAM; Python ≥3.11; CUDA ≥12.1; PyTorch 2.7.0; flash-attn.
- Số liệu (HIGH, Table 5–6, tự báo cáo): J2J ModelsRes TokenRig 2.857 (UniRig 3.390, Puppeteer 3.841, MagicArticulate 3.024, RigNet 3.901). Arti-2.0 TokenRig 2.515 (UniRig 3.115, Puppeteer 3.033, MagicArticulate 4.003, RigNet 7.376). Skin L1 ModelsRes 0.0168 (Puppeteer 0.0321, UniRig 0.0381, RigNet 0.0573). Arti-2.0 0.0178 (Puppeteer 0.0278, UniRig 0.0297, RigNet 0.0431).
- Thời gian (HIGH, Table 7): cả pipeline ~15 s; skin 10–12 s.
- Phi nhân hình (HIGH): số liệu định lượng ngoài người chỉ có Truebones Zoo (động vật) và không so với baseline. Bird, insect và dragon chỉ có hình minh hoạ.
- Lỗi (HIGH): "a residual performance gap remains compared to continuous-latent VAEs in extremely challenging skinning scenarios"; handle mỏng hoặc vòng lặp; móng mảnh có gai skin.
- Chưa giải quyết (MED): ghi chú kích thước checkpoint khác nhau giữa mirror HF (~1.6 GB) và ComfyUI (~14 GB).
- Abstract tự nêu "98%–133%" skin và "17%–22%" bone. Số 98–133% khớp với khoảng cách ModelsRes so với Puppeteer và UniRig. Số 17–22% không thấy trong bảng nào (HIGH, kiểm tra thủ công).

RigNet (Xu và cộng sự, 2020, arXiv v1)
- Paper: https://arxiv.org/html/2005.00559v1 (HIGH). Không có giả định kín, không cần voxel, không cần nhãn; giả định duy nhất là mesh hướng lên và nhìn từ phía trước (HIGH).
- Số liệu v1 (HIGH): IoU 61.6%; CD-J2J 3.9%; skin prec 82.3%, rec 80.8%, L1 0.39.
- Lỗi (HIGH): "putting extra arm joints"; "Many rigs often do not include bones for small parts, like feet, fingers, clothing and accessories"; "invariance to mesh resolution and connectivity is not guaranteed".
- RigAnything nêu RigNet chỉ hỗ trợ rest pose và gặp khó với nhân vật có đuôi và cánh (HIGH).

Tripo rig_model (API thương mại, docs HIGH: https://developers.tripo3d.com/en/docs/animations-rig.md)
- Endpoint: POST /animations/rig. rig_type mặc định biped. Các giá trị: biped, quadruped, hexapod, octopod (tám chân), avian (chim và sinh vật có cánh), serpentine (rắn), aquatic, others (không khớp kiểu nào).
- Model: v1.0-20240301 chỉ biped; v2.5-20260210 cho non-humanoid, biped "not recommended"; v3.0-20260909 khuyến nghị cho humanoid (HIGH). spec (tripo, mixamo, actorcore, unity, unreal, vrm) áp dụng khi biped (HIGH).
- Input: GLB, FBX, OBJ, STL; tối đa 150 MB (HIGH). Output: glb hoặc fbx (HIGH). Số đỉnh, skin weight và hierarchy không ghi (HIGH). Nên chạy rig-check trước (HIGH). Endpoint rig-check không được tài liệu hoá (unverified). Chi phí ví dụ: 25 credits (HIGH).

### 2.3 Chạy được trên Windows với NVIDIA?

- Các mục cần lưu ý chung: flash-attn xuất hiện trong UniRig, MagicArticulate, Puppeteer và SkinTokens (HIGH). Không thấy wheel chính thức Windows từ upstream trong kết quả tìm kiếm (MED). Có wheel cộng đồng cho Windows, ví dụ https://github.com/mjun0812/flash-attention-prebuild-wheels, phải khớp Python, torch và CUDA (MED).
- Nếu không cài được flash-attn trên Windows, có thể dùng WSL2 (unverified, chưa thử).
- Đề xuất (LOW): chạy inference trong venv riêng ngoài Blender 5.2; Blender chỉ đọc kết quả (GLB, JSON, NPZ).
- Ưu tiên theo độ phù hợp với phần cứng (LOW, dựa trên yêu cầu công bố):
  - SkinTokens: cần ≥14 GB VRAM; có checkpoint đầy đủ; MIT.
  - UniRig: cần ≥8 GB VRAM; skeleton và skin đều có nhưng trạng thái checkpoint chưa rõ.
  - MagicArticulate: ~4.6 GB VRAM nhưng stack cũ (torch 2.1.1 cu118, flash-attn 2.6.3) khó cài trên GPU mới (LOW).
  - Make-It-Animatable: chỉ humanoid.
  - RigAnything: Linux-first (unverified), chưa rõ VRAM.
- Kiểm tra VRAM máy trước khi chọn (không có thông tin về GPU của người dùng trong tài liệu này).

---

## 3. Tính skin weight

### 3.1 Bone heat (Pinocchio; Blender "With Automatic Weights")
- Mô tả (HIGH, Pinocchio PDF): heat equilibrium trên bề mặt; các xương là nguồn nhiệt; trọng số = nhiệt tại đỉnh.
- Blender dùng Bone Heat cho automatic weights (MED, snippet về đề xuất Bone Glow).
- Lỗi thường gặp (MED): "failed to find solution for one or more bones"; issue #45493 "none of the vertices in an island being visible to any bones". Cách xử lý: tách island rồi gán (MED). Tiêu đề issue từ snippet; trang bị 403.
- Phù hợp: mesh một island, gần kín, xương nằm gần bề mặt. Không phù hợp: nhiều island, ngón dính, quần áo rộng.

### 3.2 Voxel Heat Diffuse Skinning và Surface Heat Diffuse Skinning
- Add-on thương mại: Blender Market, phiên bản mới nhất 3.5.3 (10/4/2024), hỗ trợ Blender 2.8–4.2 alpha (MED: https://blendermarket.com/products/voxel-heat-diffuse-skinning). Tương thích với 5.x: unverified.
- Vendor nói Surface variant "never fails" (LOW, marketing). Không có benchmark độc lập.
- Kết luận: không đưa vào pipeline phụ thuộc. Chỉ dùng làm đối chứng nếu có bản tương thích 5.2.

### 3.3 Geodesic voxel binding (Dionne & de Lasa; SCA 2013, pp. 173–180, DOI 10.1145/2485895.2485919)
- Ý tưởng (MED, abstract snippet): voxel hoá rest pose; trọng số lấy từ khoảng cách geodesic giữa các voxel trên xương và các voxel không nằm ngoài. Nhắm tới mesh production có thể không kín, giao nhau và nhiều island (MED).
- Maya dùng Geodesic Voxel mặc định (MED, Autodesk help snippet).
- Số liệu (HIGH, MagicArticulate Table 2): GVB skin Arti-XL prec 75.7, rec 68.3, L1 0.724; ModelsRes prec 69.3, rec 79.2, L1 0.687. Đều thua learned methods (HIGH).
- Lỗi (secondhand, LOW/MED, unverified): làm rời rạc hoá; gộp các bộ phận gần nhau trong không gian nhưng xa theo geodesic (chân với tay). Nguồn là một preprint 2026 (chưa đọc).
- Epic (HIGH) nêu một công cụ transfer của Got (2019) dựa trên GVB.
- Khả thi trong numpy: có (voxel và Dijkstra/fast marching trên lưới). Đề xuất (LOW).

### 3.4 Bounded biharmonic weights (Jacobson, Baran, Popović, Sorkine; ACM TOG 30(4), 2011)
- Ràng buộc: không âm và partition of unity (MED, slides snippet).
- Cần tetrahedral mesh. Epic nêu rõ (HIGH, Epic paper): tạo tet mesh cho mesh quần áo không kín "may not be feasible in practice". Không dùng cho mesh Tripo không kín.
- VoxelBBW (Prévost; blog Jacobson, MED): thay tet bằng lưới voxel, luôn có kết quả nhưng dày và chậm.

### 3.5 Robust Skin Weights Transfer via Weight Inpainting (Abdrashitov, Raichstat, Monsen, Hill; SIGGRAPH Asia 2023 TC)
- Paper: https://www.dgp.toronto.edu/~rinat/projects/RobustSkinWeightsTransfer/preprint.pdf (HIGH, đọc text).
- Thuật toán (HIGH):
  - Bước 1: closest-point matching. Đỉnh đích được chấp nhận nếu khoảng cách ≤ 0.05 × đường chéo bbox và góc pháp tuyến ≤ 35°. Chỉ copy trọng số ở các đỉnh này.
  - Bước 2: các đỉnh còn lại được giải bằng cách cực tiểu hoá năng lượng Dirichlet + Laplacian: w^T(-L + L M^-1 L)w, với ràng buộc tổng = 1, không âm, và cố định tại đỉnh đã copy. L là cotangent Laplacian, M là khối lượng lumped.
  - Artist có thể vẽ mask để tự chọn vùng tính.
- Điều kiện (HIGH): hai mesh đã align; nguồn có weight đúng.
- Hạn chế (HIGH): corrective bone có thể hỏng nếu vùng của chúng nằm trong tập không copy; không đảm bảo không xuyên trong pose cực đoan.
- Code: https://github.com/rin-23/RobustSkinWeightsTransferCode, MIT (HIGH). Chỉ có sample sphere sang plane; body và cloth FBX ghi "Coming soon" (HIGH).
- Maya không chính thức: https://github.com/yamahigashi/MayaTransferInpaintWeights, MIT, push cuối tháng 6/2024 (MED).
- Blender add-on "Robust Weight Transfer" (SentFromSpaceVR): tồn tại theo snippet; trạng thái 5.2 unverified (MED).
- Ứng dụng cho Tripo (LOW): cần một template body có weight và align với mesh Tripo bằng phép đăng ký không cứng. Quần áo dính thân có thể gán weight theo template body rồi inpaint phần còn lại.

### 3.6 Learned skinning (số liệu khác thang, chỉ so trong bảng cùng paper)
- UniRig: skin L1 0.0055 (Mixamo), 0.0329 (Rig-XL), thang unit cube (HIGH).
- SkinTokens: L1 0.0168 (ModelsRes), 0.0178 (Arti-2.0), tự báo cáo, ngưỡng ε=10^-2 (HIGH).
- Puppeteer: L1 0.335 (Arti-2.0), thang x10^-2 hoặc khác (HIGH).
- MagicArticulate: L1 0.337 (Arti-XL), thang khác (HIGH).
- Make-It-Animatable: không có số skin so với baseline (HIGH).

### 3.7 Xếp hạng độ bền cho mesh không kín, nhiều island, tự giao nhau
1. Learned (SkinTokens với --use_skeleton, UniRig, Puppeteer): nhận point cloud bề mặt nên không cần kín (HIGH). Rủi ro: thiếu ngón, khớp nhỏ (suy luận, LOW).
2. Geodesic voxel binding: voxel hoá cho phép không kín (MED), là chuẩn production (MED).
3. Robust weight transfer: bền khi có template đã align, nhưng không tự sinh weight từ đầu (HIGH).
4. Bone heat: chỉ tốt với một island và gần kín; hay báo lỗi (MED).
5. BBW tetrahedral: loại trừ với mesh không kín (HIGH).

---

## 4. Metric QA tự động

Không tìm thấy paper hay studio nào công bố ngưỡng cụ thể cho các metric dưới đây (unverified). Phần dưới chỉ ra nguồn gốc hoặc đề xuất.

| Metric | Nguồn / trạng thái | Ghi chú |
|---|---|---|
| Joint nằm trong mesh | Không có ngưỡng (unverified) | Pinocchio dùng thể tích bên trong (HIGH). Đề xuất: winding number hoặc ray parity; ngưỡng tự hiệu chỉnh (LOW). |
| Symmetry error | Không có ngưỡng (unverified) | Đề xuất: khoảng cách khớp trái và phải sau khi mirror (LOW). |
| Weight smoothness (Laplacian) | Định nghĩa năng lượng từ Epic (HIGH) | Dùng w^T L w và ||L M^-1 L w||; không có ngưỡng công bố. |
| Max influences | Unity: phạm vi 1–255; "higher bone counts may have a performance cost, especially above 4 bones per vertex" (HIGH, https://docs.unity3d.com/ScriptReference/ModelImporter-maxBonesPerVertex.html) | UE5 Interchange cắt về 4 (MED, forum https://forums.unrealengine.com/t/interchange-gltf-importer-truncates-skeletal-mesh-bone-influences-to-4-per-vertex/2745391). Đề nghị cap 4 khi xuất game (LOW). |
| Edge stretch/compression mỗi pose | Không có ngưỡng (unverified) | Đề xuất: tỉ lệ độ dài cạnh pose/bind; cảnh báo ngoài [0.8, 1.25] (LOW, tự đặt). |
| Thể tích mỗi pose | LBS mất thể tích khi góc xoay tăng (MED); không có metric chuẩn (unverified) | Đề xuất: thể tích (hoặc convex hull) pose/bind; cảnh báo dưới 0.85 (LOW). |
| Self-intersection | Không có ngưỡng (unverified) | Đề xuất: đếm cặp tam giác giao nhau bằng BVH mỗi pose (LOW). |
| Candy wrapper | Không có metric công bố (unverified) | Cơ chế: blend ma trận tuyến tính (MED). Dual quaternion giảm candy wrapper nhưng gây bulging (MED). |
| ROM sequence | defQA (Maya): neutral, positive, neutral, negative, neutral theo từng controller (MED, https://github.com/zebraed/defQA) | Blog: idle, walk, run, turn, jump, crouch và một pose cường điệu (LOW). Vendor: kiểm vai, khuỷu, cổ tay, hông, gối, cổ chân, cột sống, chuỗi twist (LOW). |
| Đánh giá người | Anymate: 4.6% trên 5,000 mẫu kém (HIGH) | Cho thấy tỉ lệ lỗi nền ngay cả khi dữ liệu tốt. |
| Baseline học sâu | UniRig J2J 0.0092–0.0103 (unit cube, Mixamo/VRoid); Puppeteer J2J 3.03 (x10^-2) Arti-2.0; Pinocchio 8.3 (x10^-2) (HIGH) | Dùng để biết mô hình đang ở đâu, không phải ngưỡng đạt. |

---

## 5. Non-humanoid

- Tripo rig_type (HIGH, docs): octopod cho nhện (8 chân), serpentine cho rắn, avian cho chim và sinh vật có cánh, quadruped, hexapod, others cho quái không khớp kiểu nào. Chất lượng với ghost (others) unverified.
- Learned: RigNet gặp khó với đuôi và cánh (HIGH, RigAnything paper). UniRig thiếu tail và wing bone làm hỏng (HIGH). SkinTokens có số định lượng cho động vật (Truebones) nhưng không so baseline; bird, insect và dragon chỉ định tính (HIGH).
- Quadruped digitigrade (LOW, forum và sản phẩm): chuỗi hông, đùi, gối, khớp cổ chân (hock), bàn, ngón. IK chân sau có hai pole target (double IK) (LOW). Animal Rigger Pro có tuỳ chọn digitigrade (LOW, sản phẩm thương mại: https://superhivemarket.com/products/animal-rigger-pro).
  - Gợi ý (LOW): chân sau 5–6 bone, chân trước 4–5 bone, cộng control IK và pole.
- Nhện: Blender wiki "A cartoonish spider" dùng mỗi chân một IK chain ChainLen=2 (MED, https://wiki.blender.jp/%E3%83%86%E3%83%B3%E3%83%97%E3%83%AC%E3%83%BC%E3%83%88:Tutorials/A_cartoonish_spider). Blender Studio (Sprite Fright) có 8 chân với IK/FK và control gốc chân (MED, https://studio.blender.org/blog/rigging-sprite-frights-spider/).
  - Gợi ý (LOW): 3–4 bone mỗi chân gộp coxa, femur, tibia, tarsus, cộng IK target; 8 chân là 24–32 bone cộng root và thân.
- Rắn, đuôi, xúc tu, cột sống: Spline IK (MED, https://docs.blender.org/manual/id/dev/animation/constraints/tracking/spline_ik.html): cần chuỗi bone liên tiếp và một curve; dùng cho tail, tentacle, spine, rope. Khi Spline IK và IK cùng tác động một bone, IK chuẩn ưu tiên (MED, wiki cũ).
  - Gợi ý (LOW): 8–16 đốt.
- Cánh: không tìm thấy nguồn đếm bone (unverified).
  - Gợi ý (LOW): chuỗi shoulder–elbow–wrist–finger. Màng cánh xử lý bằng weight theo tấm hoặc shape key; lông vũ để mesh riêng.
- Bóng ma (không chân, nổi): không tìm thấy nguồn (unverified).
  - Gợi ý (LOW): root, vài đốt thân, xúc tu hoặc vạt bằng FK hay spline; có thể dùng cloth hoặc shape key thay cho skin nặng.
- Số bone tham chiếu:
  - Rig-XL có hai đỉnh: 52 (Mixamo có tay) và 28 (Mixamo không tay) (HIGH, UniRig).
  - Make-It-Animatable dùng 52 bone (HIGH).
  - MagicArticulate loại model >55 khớp khi đánh giá skin (HIGH).
- Nhân vật nhỏ: Pinocchio ghi "large arms and tiny legs ... causes problems" (HIGH). Đây là vùng yếu của phương pháp hình học.

---

## Khuyến nghị: phương pháp theo từng bước, xếp theo độ chính xác và độ bền

1. Triage: chạy Tripo rig-check và chọn rig_type (biped, octopod, serpentine, avian, quadruped) cho từng asset để có baseline. Đối chiếu bằng mắt trong Blender (HIGH về API; quyết định là LOW).
2. Khớp cho người: Tripo v3.0 (humanoid) làm chuẩn; SkinTokens hoặc UniRig chạy local làm đối chứng. Make-It-Animatable chỉ dùng cho humanoid. A/B trên ít nhất 3 mesh Tripo đã có (LOW).
3. Khớp cho phi nhân (nhện, rắn, chim, quái cánh): Tripo octopod, serpentine, avian và quadruped làm chuẩn; SkinTokens làm đối chứng local. Kiểm tra thiếu tail hoặc wing bone (HIGH).
4. Môi trường: chạy inference học sâu trong venv Python 3.11 riêng, ngoài Blender 5.2. Kiểm VRAM trước (UniRig ≥8 GB, SkinTokens ≥14 GB). Không cài bpy==4.2 (Puppeteer) cùng môi trường với Blender 5.2 (HIGH).
5. Skin weight: ưu tiên SkinTokens với --use_skeleton, hoặc UniRig với skeleton đã sửa tay. Đối chiếu L1 trên tập nội bộ, không so số giữa paper (HIGH cho cấu hình; LOW cho chiến lược).
6. Dự phòng hình học cho khớp: embedding kiểu Pinocchio trên proxy kín (voxel remesh), kết hợp ROSA cho đoạn trụ có normal. Chỉ tin kết quả đã qua QA. Pinocchio đạt 81% trên mesh sạch (HIGH); với Tripo chưa có số (LOW).
7. Dự phòng weight: geodesic voxel binding tự viết bằng numpy (voxel và geodesic). Tính chất đến từ MED; khả thi là LOW. Không dùng BBW tetrahedral (HIGH).
8. Weight cho lớp quần áo dính thân: Robust Weight Transfer (MIT, cần mesh đã align và weight nguồn). Chưa có FBX trong code mẫu (HIGH).
9. Bone heat của Blender: chỉ dùng khi mesh một island và gần kín; tách island trước. Kiểm tra trên Blender 5.2 vì chưa xác nhận (unverified).
10. Không phụ thuộc Voxel Heat Diffuse Skinning: bản mới nhất 2024, khai báo tương thích đến 4.2 alpha (MED).
11. QA bắt buộc (ngưỡng tự hiệu chỉnh vì không có ngưỡng công bố): (a) khớp nằm trong thể tích (winding number); (b) tối đa 4 influence mỗi đỉnh khi xuất game (HIGH cho cảnh báo chi phí của Unity; cap 4 là LOW); (c) tổng weight bằng 1 và không âm; (d) ROM neutral–+–neutral–−–neutral theo từng khớp (MED, defQA); (e) thể tích, self-intersection và edge stretch theo pose (LOW, đề xuất).
12. Metric học sâu (CD-J2J, L1) chỉ so sánh nội bộ trong cùng giao thức, không đưa vào bảng so sánh giữa paper (HIGH).
13. Kiểm license trước khi dùng thương mại. MIT: UniRig code, Make-It-Animatable, SkinTokens, Robust transfer. Apache-2.0: MagicArticulate, Puppeteer. Chưa rõ: weights và dữ liệu UniRig, RigAnything, Anymate (unverified).
14. Nhân vật nhỏ và tay dính thành khối: đặt khớp tay thủ công, hoặc tách ngón trước khi auto-rig. Pinocchio tự nêu tay là điểm yếu (HIGH).
15. Theo dõi: SkinTokens là ứng viên mạnh nhất có mã, checkpoint và số đo tự báo cáo đầy đủ (HIGH). UniRig cần chốt lại trạng thái skinning checkpoint. Blender 5.2 LTS phát hành 2026-07-14 (MED); thay đổi API armature và bone heat trong 5.2 chưa xác nhận, nên đọc changelog 5.2 trước khi viết skill (unverified).

---

## Danh sách điều chưa xác nhận được

- Trạng thái skinning checkpoint đầy đủ của UniRig (mâu thuẫn giữa README và model card HF).
- License weights của UniRig, RigAnything và Anymate; license code Anymate và HumanRig; repo HumanRig.
- Chi tiết thuật toán và số liệu của Mean Curvature Skeletons, ROSA (không có số độ chính xác), Shape Diameter Function.
- Thay đổi về armature và bone heat trong Blender 5.2; tương thích của Voxel Heat Diffuse Skinning với 5.x.
- Ngưỡng QA công bố cho mọi metric trong mục 4 (không tìm thấy).
- Quy tắc đặt khớp cho cánh, bóng ma và digitigrade (chỉ có forum và sản phẩm thương mại).
