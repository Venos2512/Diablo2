# Tài liệu chuyên sâu: Rigging cho game (từ cơ bản đến nâng cao)

Tài liệu tổng hợp từ tài liệu chính thức của Unity và Unreal, các tài liệu kỹ thuật của Pixar và DreamWorks, các mô tả phiên GDC, các bài báo nghiên cứu, và một số bài viết cộng đồng. Nội dung đã được diễn giải lại bằng tiếng Việt.

---

## 0. Cách đọc tài liệu này và mức độ tin cậy

Các nguồn không đồng đều về độ tin cậy. Khi đọc, nên hiểu như sau:

- **Tin cậy cao:** tài liệu chính thức của Unity (SkinnedMeshRenderer, Animation Rigging, Mecanim), tài liệu chính thức của Unreal (IK Rig, IK Retargeter, MetaHuman), tài liệu Autodesk về skinning, tài liệu Blender Rigify, các bài báo học thuật (Pixar, DreamWorks, KAIST, Disney Research, arXiv).
- **Trung bình:** mô tả phiên GDC (chỉ có tóm tắt, không có slide), các bài thuyết trình trích từ báo cáo sản xuất.
- **Thấp, cần kiểm chứng:** các bài blog SEO và trang bán công cụ. Đặc biệt, các con số về số lượng xương thường mâu thuẫn nhau giữa các nguồn (xem Phần 2.1).
- **Video:** chưa xem nội dung. Chỉ dựa trên tiêu đề và mô tả.

---

## 1. Nền tảng (cơ bản)

### 1.1 Rig gồm những gì
Một rig game gồm ba lớp:
1. **Hệ phân cấp khớp (skeleton):** cây xương có quan hệ cha con. Khi xương cha xoay, các xương con đi theo.
2. **Trọng số skinning (skin weights):** mỗi đỉnh mesh được gán cho một số khớp với tổng trọng số bằng 1.
3. **Hệ điều khiển (controls):** IK, FK, constraint, controller để animator làm việc, và phần này thường bị loại khỏi bản export cuối.

Quan trọng: trong game, phần runtime chỉ cần skeleton và skin. Controller và constraint thường chỉ tồn tại trong DCC (Maya, Blender) và không được export. Đây là lý do một số kỹ thuật tốn kém vẫn dùng được trong game: chúng được bake xuống khớp trước khi xuất.

### 1.2 Quy ước đặt tên và hướng xương
- **Tên xương phải đúng quy ước của engine.** Unity dùng Avatar mapping để nhận diện các khớp người. Unreal dùng tên của Mannequin hoặc IK Rig chain. Nếu tên sai, retargeting và Humanoid mapping sẽ lỗi.
- **Hướng xương trong một chain phải nhất quán.** Tất cả các xương trong một chuỗi nên hướng về cùng một phía.
- **Không dùng scale không đều (non-uniform scale) trên xương.** Scale không đều làm cách biểu diễn rotation bị sai và gây lỗi biến dạng khi áp dụng animation.
- **Root bone nên đặt tại gốc tọa độ (0, 0, 0)** khi xuất.
- **Đơn vị:** Rigify giả định 1 đơn vị tương đương 1 mét. Nên kiểm tra tỷ lệ trước khi xuất, đặc biệt với nhân vật có kích thước đặc biệt.

### 1.3 Tư thế bind (T-pose và A-pose)
Game rig thường dùng T-pose hoặc A-pose làm bind pose. A-pose thường được ưa thích hơn cho nhân vật người vì vai và tay ít bị xoắn hơn khi skin, và cũng dễ retarget hơn trong Unreal. Với tay để sát thân, nên chuyển về T-pose trước khi chuyển trọng số, vì trọng số có thể bị lan sang các phần gần đó (ví dụ trường hợp áo giáp dính vào tay).

### 1.4 Hierarchy cơ bản và xương xoắn (twist bones)
- Xương xoắn (twist bones) đặt ở cẳng tay và cánh tay giúp tránh hiện tượng candy wrapper khi một xương duy nhất phải xử lý toàn bộ xoay.
- Một nguồn cộng đồng khuyên dùng 2 khớp cho mỗi ngón tay để tiết kiệm xương, nhưng đây không phải tiêu chuẩn cứng. Ngón cái, ngón trỏ và các khớp biến dạng cần đủ chi tiết hơn tùy nhân vật.

---

## 2. Ngân sách hiệu năng real-time (trung cấp)

### 2.1 Số lượng xương
Đây là câu hỏi hay gặp nhất, nhưng không có con số chuẩn. Các nguồn cộng đồng đưa ra khoảng khác nhau:
- 50–100 xương cho nhân vật game (nhiều bài SEO)
- 50–80 xương, không tính ngón tay (một hướng dẫn khác)
- 65–100 xương cho nhân vật chính, 20–35 xương cho nhân vật nền hoặc đám đông
- 45–55 xương cho game không cần face animation real-time và không có cloth mô phỏng

Các con số này không được tài liệu chính thức của engine xác nhận. Cách đúng hơn là đặt ngân sách theo nền tảng và đo bằng profiler trong engine. Chi phí không chỉ đến từ số xương mà còn từ số shape, số constraint và số lần skinning.

### 2.2 Số khớp ảnh hưởng mỗi đỉnh (max influences)
Đây là con số có tài liệu chính thức rõ ràng hơn:
- **Unity** cho phép chọn số khớp mỗi đỉnh là 1, 2 hoặc 4 trong SkinnedMeshRenderer. Unity ghi rõ: hai khớp là lựa chọn phổ biến cho game vì cân bằng giữa chất lượng và hiệu năng. Unity cũng nói rõ hơn bốn khớp làm giảm hiệu năng, và nếu cần nhiều hơn bốn khớp cho một đỉnh, phải dùng thiết lập Blend Weights Quality.
- **Lý do chung** của giới hạn 4 khớp là phần cứng GPU thường xử lý vertex buffer theo bốn trọng số mỗi đỉnh. Một pull request của three.js cho biết phương pháp vertex buffer mặc định chỉ hỗ trợ tối đa bốn trọng số, và họ thêm một lựa chọn dùng texture cho trường hợp nhiều hơn.

Kết luận thực hành: mục tiêu mặc định nên là tối đa 4 khớp mỗi đỉnh, và ưu tiên 2 khớp ở những vùng không cần nhiều hơn.

### 2.3 Skinning chạy trên GPU hay CPU
Với game, skinning nên chạy trên GPU. Đây là điểm cần kiểm tra khi tối ưu. Một bài viết cộng đồng nêu cách tối ưu là giảm số khớp không cần thiết, dùng corrective shape thay cho khớp phụ, và bake các hàm rig phức tạp thành điều khiển đơn giản cho runtime.

### 2.4 LOD cho nhân vật
- **MetaHuman** có 8 LOD cho đầu (0–7) và 4 LOD cho thân (0–3), mỗi LOD thân ứng với hai LOD đầu. Đây là ví dụ tham khảo về cách một hệ thống chuyên nghiệp chia nhỏ chi phí.
- Một nguồn cộng đồng đề xuất LOD cho skeleton, tức là giảm số xương ở các mức xa hơn, nhưng cần kiểm tra kỹ vì giảm xương có thể làm hỏng animation.
- Nhân vật nền (background, đám đông) nên dùng skeleton đơn giản hơn nhiều so với nhân vật chính.

### 2.5 Đo lường và phối hợp
- Tài liệu GDC và một số bài viết nhấn mạnh: nên thử rig với dữ liệu motion capture thực tế, không chỉ với pose đơn giản của animator. Lý do là dữ liệu capture có nhiều biến dạng và góc quay khác thường.
- Đo CPU và GPU của từng nhân vật bằng profiler của engine trong cảnh thực tế.
- Cần có kênh trao đổi trực tiếp giữa nhóm rigging và nhóm tích hợp real-time.

### 2.6 Bake hay giữ runtime
Bake là đưa phép tính phức tạp (mô phỏng, rig động) thành animation keyframe trước khi chạy. Ưu điểm: runtime nhẹ. Nhược điểm: dữ liệu nặng hơn và khó chỉnh sửa. Trong GDC 2006, một bài thuyết trình về rigging cũng so sánh hai cách animator có thể dùng: baking cho phép trộn animation đơn giản nhưng sinh nhiều dữ liệu, còn cách còn lại giữ phép tính.

---

## 3. Thiết kế rig game (trung cấp)

### 3.1 Bộ constraint của Unity Animation Rigging
Unity Animation Rigging là gói chính thức cho procedural animation trong runtime. Danh sách constraint trong tài liệu chính thức (phiên bản 1.0) gồm 12 loại:

| Constraint | Dùng để làm gì |
|---|---|
| Two Bone IK | Giải IK cho hai xương (chân, tay). Nhẹ và ổn định cho tay chân. |
| Chain IK | Giải IK cho chuỗi xương dài bất kỳ (cột sống, đuôi, xúc tu). |
| Multi-Aim | Xoay một khớp hướng về một đích. Dùng cho đầu, cổ, thân. |
| Multi-Position | Khớp đi theo vị trí của một đối tượng khác. |
| Multi-Rotation | Khớp xoay theo trung bình của nhiều đích, theo đường ngắn nhất. |
| Multi-Parent | Khớp chịu ảnh hưởng của nhiều cha, có thể chuyển đổi cha. |
| Multi-Referential | Hai đối tượng có thể điều khiển nhau tùy tình huống (ví dụ tay cầm đạo cụ, đạo cụ điều khiển tay). |
| Override Transform | Ghi đè transform của một phần cơ thể bằng animation khác. |
| Damped Transform | Làm mượt chuyển động của một khớp theo quán tính. |
| Twist Correction | Phân phối phần xoay cho các xương xoắn để sửa biến dạng ở vai, cổ tay, đùi. |
| Twist Chain | Điều khiển xoay ở hai đầu chuỗi, nội suy phần giữa. |
| Blend | Pha trộn giữa hai nguồn chuyển động. |

Một số chi tiết kỹ thuật đáng chú ý:
- Các constraint này dựa trên C# Animation Jobs API.
- Changelog cho thấy gói phụ thuộc vào Burst, nên tác động hiệu năng sẽ khác với các phiên bản cũ.
- Gói có hỗ trợ keyframe cho constraint trong các bản sau.
- Two Bone IK được mô tả là tối ưu hơn cho tay và chân đơn giản. Chain IK linh hoạt hơn nhưng nặng hơn.

### 3.2 Mẫu thiết kế thường gặp
- **Head và neck aim:** chuỗi Multi-Aim (đầu, cổ, thân trên) với trọng số giảm dần, cho chuyển động nhìn tự nhiên. Đây là mẫu được một nguồn cộng đồng đề xuất.
- **Chân trên địa hình:** Two Bone IK cho mỗi chân với mục tiêu chân và hint. Hint giúp đầu gối quay đúng hướng.
- **Tay cầm đạo cụ:** Multi-Referential cho phép tay và đạo cụ điều khiển nhau tùy trạng thái, ví dụ tay nhặt đạo cụ rồi đạo cụ theo tay.
- **Vai và cổ tay:** Twist Correction để tránh biến dạng khi xoay mạnh.

### 3.3 Không gian và root (triết lý thiết kế)
Một bài thuyết trình GDC 2006 về rigging có hai ý đáng nhớ:
- **Rig không phải là giao diện, mà là tập hợp các chuyển động tiềm năng.** Việc tạo pose là thứ yếu. Mục tiêu chính là cho phép chuyển động.
- **Quản lý không gian là chìa khóa.** Nếu animator phải bù trừ một animation, rig đã thất bại.

Cũng trong bài này, hai kiểu root được mô tả:
- **C-G root:** điều khiển 6 bậc tự do, dựa trên trọng tâm nhân vật. Tốt cho chuyển động theo chiều đứng nhưng có thể gặp vấn đề khi di chuyển xa.
- **Ground shadow rig:** root nằm trên mặt đất dưới nhân vật, cho phép dịch chuyển và xoay quanh trục đứng. Phù hợp hơn cho nhân vật di chuyển trên mặt phẳng.

Một ý khác trong tài liệu này: rig không nên hạn chế biểu cảm của animator, nhưng cũng nên loại bỏ khả năng làm hỏng nhân vật.

---

## 4. Retargeting và pipeline (trung cấp đến nâng cao)

### 4.1 Unity: Humanoid và Avatar
- Unity dùng hệ thống Avatar (còn gọi là Mecanim) để ánh xạ xương của nhân vật vào một định dạng nội bộ chung cho humanoid.
- Nhờ đó, animation từ một nhân vật có thể áp dụng cho nhân vật khác, miễn là cả hai đều có Avatar hợp lệ.
- Retargeting chỉ hoạt động với humanoid. Quadruped hoặc sinh vật phi người cần cách khác.
- Tài liệu chính thức khuyến nghị cấu trúc scene có model nhân vật với Avatar và Animator component.

Một bài viết cộng đồng nhấn mạnh: trong Unity, khi xuất FBX cho humanoid, cần đặt Animation Type là Humanoid và kiểm tra bản đồ Avatar. Đây là bước dễ bỏ sót.

### 4.2 Unreal: IK Rig và IK Retargeter
Đây là hệ thống mạnh nhất trong các engine về retargeting, theo tài liệu chính thức:
- **IK Rig** cho phép tạo solver để chỉnh pose và gắn vào Animation Blueprint, điều chỉnh các solver theo tham số trong runtime.
- **IK Retargeter** cho phép chuyển animation giữa các skeleton khác nhau về số lượng xương, tên xương và hướng xương. Có thể giữ điểm tiếp xúc tay hoặc chân bằng IK.
- Retargeting có thể chạy lúc runtime hoặc offline để tạo sequence mới.

Quy trình cơ bản:
1. Tạo IK Rig cho cả nhân vật nguồn và nhân vật đích.
2. Định nghĩa chain (tay, chân, cột sống) trong IK Rig Editor. Có nút Auto Create Retarget Chains để tự tạo.
3. Đặt pelvis cho cả hai rig (chuột phải vào xương trong Hierarchy, chọn Set Pelvis).
4. Tạo IK Retargeter, chọn rig nguồn và rig đích.
5. Đặt IK Goal cho các chain không retarget chính xác, ví dụ chân, để ổn định.

Điểm cần chú ý: tên chain trong hai rig không cần khớp hoàn toàn, nhưng nên cố gắng khớp để công cụ tự gán đúng.

### 4.3 MetaHuman
- MetaHuman có Control Rig riêng cho mặt và thân. Các Control Rig này nằm trong asset của MetaHuman.
- Có sẵn IK Retargeter cho MetaHuman (RTG_MH_IKRig) và IK Rig cho MetaHuman (IK_MH_IKRig).
- MetaHuman Creator hỗ trợ import từ mesh tùy chỉnh trong UE 5.8 trở lên. Quy trình là: tạo nhân vật bằng mesh topology của MetaHuman và rig thân sơ bộ, sau đó chỉnh trong Maya, rồi đưa lại vào MetaHuman Creator để regenerate rig mặt.
- Cape rigging và mô phỏng dùng Chaos physics được mô tả trong tài liệu hướng dẫn stylized character.
- Có bộ tích hợp Maya để chỉnh rig MetaHuman qua file DNA.

### 4.4 Lỗi thường gặp khi retargeting
- Tên xương không khớp quy ước engine.
- Hướng xương khác nhau giữa hai nhân vật.
- Scale không đều hoặc tỷ lệ không khớp.
- Thiếu bước đặt pelvis hoặc chain.
- Chân hoặc tay trượt trên mặt đất do retarget không giữ tiếp xúc. Khi đó cần IK Goal hoặc Two Bone IK để giữ điểm chạm.

---

## 5. Khuôn mặt trong game (nâng cao)

### 5.1 Xương hay blendshape
Đây là lựa chọn quan trọng nhất trong facial rig:
- **Blendshape** cho biến dạng mượt, phổ biến trong phim. Trong game, engine hiện đã hỗ trợ blendshape rộng rãi.
- **Xương** hiệu quả hơn cho real-time, tương thích tốt với retargeting mocap. Đây là lựa chọn an toàn cho game có nhiều nhân vật cùng lúc.
- **Kết hợp:** dùng xương cho biến dạng chính, và blendshape hiệu chỉnh (corrective) cho vùng khó như môi, mắt, hàm.

Một bài thảo luận trên Polycount trích dẫn một ví dụ: một trò chơi dùng 260 khớp với 8 ảnh hưởng, cộng với 230 corrective blendshape. Đây là ví dụ, không phải chuẩn. Số liệu này đến từ một diễn đàn, nên cần xác minh trước khi dùng.

### 5.2 Corrective blendshape
Corrective blendshape là shape được kích hoạt khi một tổ hợp xương hoặc điều khiển đạt một giá trị nhất định. Ví dụ: shape cho môi khi hàm mở và má nâng.
- Cần tính toán phụ thuộc giữa các shape, đặc biệt với tổ hợp nhiều điều khiển.
- Một công cụ Maya do Daniel Martinez Ojeda phát triển tự động tính phụ thuộc cho corrective shape, và có thể chia shape theo mask hoặc vùng. Đây là ví dụ về cách công cụ hóa quy trình này.

### 5.3 Tạo blendshape tự động bằng ML
Tại GDC 2024 (Machine Learning Summit), SEED (EA) trình bày một hệ thống gồm:
- **FaceMixer:** tạo blendshape từ một khuôn mặt trung tính.
- **FaceOptim:** tự động tạo blendshape và animation từ biểu cảm đã scan hoặc dữ liệu 4D.
- **FaceBot** và **FaceAnim:** phần khác trong pipeline, FaceAnim được nêu là hướng phát triển tiếp theo.

Đây là tài liệu từ nhà phát triển, nên cần đọc như một mô tả hệ thống chứ không phải kết quả đã kiểm chứng.

### 5.4 Pipeline mặt trong sản xuất lớn
- Insomniac (Marvel's Spider-Man, GDC 2019): pipeline tích hợp khoảng 150 rig mặt từ một nhà cung cấp bên ngoài, với quy trình phản hồi, cải tiến rig và theo dõi thay đổi, để không làm ảnh hưởng toàn bộ nhóm.
- 2DNAC RigX (GDC Festival of Gaming): công cụ rig mặt và nhân vật số với tuyên bố giảm đến 80% thời gian tạo nhân vật AAA. Đây là tuyên bố của nhà cung cấp, cần kiểm chứng.

### 5.5 Tài liệu học facial rig
Một thread trên Polycount được nhắc đến các tài liệu sau:
- Paul Neale: bài hướng dẫn về phương pháp rig mặt nào phù hợp với sản xuất nào.
- Uldis Zarins: *Anatomy of Facial Expression*, tài liệu về giải phẫu biểu cảm.
- Nội dung khóa học: sử dụng corrective blendshape để xử lý các vùng khó, và kiểm thử rig trước khi bàn giao cho animator.

---

## 6. Quần áo, tóc, áo choàng trong game (nâng cao)

### 6.1 Chiến lược theo loại trang phục
- **Ôm sát:** chuyển trọng số từ thân sang quần áo, sau đó tinh chỉnh bằng weight paint. Đây là cách rẻ nhất.
- **Rộng vừa:** rig bằng xương kết hợp constraint, hoặc dùng xương dynamic (secondary motion).
- **Rộng và dài (áo choàng, váy dài):** mô phỏng vật lý rồi bake xuống xương. Trên mobile, không chạy cloth sim lúc runtime.

### 6.2 Bake mô phỏng xuống xương
Quy trình được một thảo luận Polycount mô tả:
1. Căn xương theo cloth ở T-pose.
2. Bind xương vào cloth để xương bám đỉnh cloth.
3. Chạy mô phỏng.
4. Unbind xương.
5. Skin cloth vào xương đã bake.
6. Import vào engine.

Thảo luận cũng nhắc đến một trở ngại: khi váy cần tương tác với chân như một collider thụ động, rig đơn thuần khó xử lý. Đây là điểm cần kết hợp collision trong mô phỏng hoặc dùng xương chân làm collider.

### 6.3 Unity Skinned Cloth
- Cần đồng thời skin cho quần áo và cấu hình Skinned Cloth.
- Áp cloth lên đúng mesh quần áo, không phải group.
- Một hướng khác: dùng morph target cho hình dạng nhân vật, và một công cụ wrap (như MegaFiers) để quần áo tự biến dạng theo, tránh phải làm từng animation cho từng món đồ.

### 6.4 Áo choàng và tóc bằng xương dynamic
- Áo choàng tránh xuyên vào thân bằng cách dùng xương IK spline và giới hạn chuyển động. Các game như Heavenly Sword và FFXIII được cộng đồng nhắc đến vì dùng xương mà không xuyên thân.
- Xương dynamic (wiggle bones) và các plugin mô phỏng xương là lựa chọn nhẹ hơn cloth sim.
- Cần kiểm tra va chạm với các phần cơ thể để tránh xuyên.

### 6.5 Kiểu dữ liệu cho secondary motion
Trong game, secondary motion thường được chia thành ba lớp:
- Biến dạng thụ động theo khớp (skin).
- Xương phụ (helper bones) và constraint.
- Mô phỏng bake, hoặc xương động chạy lúc runtime.

---

## 7. Đạo cụ, vũ khí, phụ kiện

- **Gắn đạo cụ vào tay:** cách đơn giản nhất là gán toàn bộ trọng số đạo cụ cho một xương tay. Với đạo cụ có nhiều phần, cần constraint hoặc skin.
- **Tay và đạo cụ tương tác:** dùng Multi-Referential để tay điều khiển đạo cụ và ngược lại tùy trạng thái.
- **Đuôi, tai, phụ kiện:** tạo xương bổ sung trên khung chính, và xương động hoặc Chain IK để có chuyển động thứ cấp.

Một thảo luận trên SideFX mô tả cách gắn súng vào tay bằng cách capture các đối tượng đóng gói. Đây là quy trình Houdini, không phải Unity hay Unreal.

---

## 8. Kỹ thuật skinning nâng cao

### 8.1 So sánh các phương pháp

| Phương pháp | Ưu điểm | Nhược điểm | Phổ biến ở đâu |
|---|---|---|---|
| Linear Blend Skinning (LBS) | Nhanh, rẻ, được hỗ trợ rộng | Candy wrapper, mất thể tích khi xoay | Gần như mọi engine real-time |
| Dual Quaternion Skinning (DQS) | Giảm candy wrapper và mất thể tích | Có thể phình ở một số vùng | Maya, 3ds Max, một số engine |
| Kết hợp LBS và DQS | Chọn từng khớp hoặc vùng | Cần tinh chỉnh thủ công | Maya, 3ds Max |
| Optimized Centers of Rotation | Giảm phình của DQS | Phức tạp khi triển khai | Nghiên cứu (Disney Research) |
| Position-based skinning | Mô phỏng jiggle và giữ thể tích | Tốn tài nguyên | Nghiên cứu (2015) |

### 8.2 Hiện tượng cần nhận diện
- **Candy wrapper:** mesh co lại quanh trục xoay, thường ở cổ tay và cẳng tay.
- **Mất thể tích:** mesh co hoặc thu nhỏ quanh khớp.
- **Bulging (phình):** mesh phình ra khi gập mạnh với DQS.
- **Collapsing (sụp):** khớp gập gần 180 độ làm mesh sụp.

### 8.3 Lưu ý theo engine
- **Unity:** hỗ trợ 1, 2 hoặc 4 khớp mỗi đỉnh trong thiết lập, và cho phép nhiều hơn bằng Blend Weights Quality, nhưng kèm chi phí hiệu năng.
- **Babylon.js:** hiện không hỗ trợ DQS. Với web, cần xử lý vùng khớp bằng trọng số và bố trí khớp hợp lý.
- **three.js:** vertex buffer mặc định hỗ trợ tối đa bốn trọng số. Có phương pháp dùng texture để hỗ trợ nhiều hơn (pull request #26222).

---

## 9. Pipeline và tổ chức sản xuất (chuyên sâu)

### 9.1 Modular rigging
Battlefield 3 (DICE, GDC 2012) là ví dụ rõ ràng:
- Nhóm tự phát triển deformation rig, kết hợp với hệ thống animation ANT (dùng trong FIFA) và mocap.
- Vấn đề chính: thay đổi nhỏ có thể yêu cầu cập nhật gần như mọi asset. Đây là lý do họ phải xây dựng hệ thống rig mô-đun và pipeline animation linh hoạt.

Rigify của Blender cũng dựa trên nguyên tắc tương tự: meta-rig là lớp trung gian để tạo rig điều khiển từ các khối xây dựng, và khi rig đã được tạo, nó không còn phụ thuộc vào Rigify.

### 9.2 Pipeline chuyển động và motion capture
Một panel GDC về Technical Art Techniques nêu các chủ đề chính:
- Tích hợp mocap và phần mềm liên quan (MotionBuilder, Blade, EVA).
- Kết hợp nhiều nguồn animation: mocap, procedural (Endorphin, Havok Behaviour).
- Rigging cho deformation nâng cao: blendshape, shader-based deformation, procedural helpers, muscle systems.
- Hệ thống quản lý asset cho nhân vật: metadata, asset markup, exporter framework.

Just Cause 3 (Avalanche Studios, GDC 2016) mô tả pipeline gồm rigging setup, giải pháp mocap, cách dùng Maya và MotionBuilder cùng nhau, và các công cụ nội bộ để đảm bảo nội dung chạy đúng trong game.

### 9.3 Nguyên tắc thiết kế rig từ GDC 2006
Phần lớn nguyên tắc này vẫn còn giá trị:
- Cần ít nhất hai chiến lược thay thế cho mỗi phần cơ thể (root, torso, chân, tay, ngón, đầu). Chọn chiến lược theo ứng dụng.
- Quản lý không gian (space) là yếu tố quyết định chất lượng rig.
- Rig nên cho phép chuyển động, không hạn chế biểu cảm của animator, nhưng cũng loại bỏ khả năng làm hỏng nhân vật.

### 9.4 Tổ chức và quản lý nhân vật
- Metadata chuẩn cho asset (tên, phiên bản, loại rig) giúp tự động hóa export.
- Exporter framework đảm bảo mọi nhân vật được xuất theo cùng một quy ước.
- Với dự án lớn, cần kênh phản hồi rõ ràng giữa nhóm rig, animation và tích hợp.

---

## 10. Công cụ và phạm vi sử dụng

| Công cụ | Vai trò | Ghi chú |
|---|---|---|
| Maya | DCC chính cho rig phức tạp | Advanced Skeleton, Ziva, MotionBuilder cho mocap |
| Blender | DCC miễn phí, Rigify | Phù hợp cho học và sản xuất nhỏ |
| Unity Animation Rigging | Procedural animation trong runtime | Có constraint chính thức |
| Unity Mecanim | Humanoid retargeting | Dựa trên Avatar |
| Unreal IK Rig và IK Retargeter | Retargeting mạnh | Hỗ trợ skeleton khác biệt |
| Unreal MetaHuman | Nhân vật người cao cấp | Có face và body Control Rig |
| AccuRIG | Auto-rig miễn phí | Hữu ích cho nhân vật người và quadruped |
| Wonder Dynamics, 3D AI Studio, Uthana, AutoRig.online | Auto-rig bằng AI | Kết quả phụ thuộc mạnh vào mesh và tư thế |

---

## 11. Lộ trình học

### Cấp 1: Cơ bản
- Hiểu cấu trúc skeleton, skin, controller.
- Đặt tên xương và hướng xương đúng quy ước.
- Skin cơ bản với hai khớp, sau đó tinh chỉnh bằng weight paint.
- Xuất FBX và kiểm tra trong engine.
- Mục tiêu: rig một nhân vật humanoid đơn giản, chạy được idle, walk, run.

### Cấp 2: Trung cấp
- Hiểu IK và FK, cách dùng Two Bone IK và Chain IK trong engine.
- Dùng Unity Animation Rigging hoặc công cụ tương đương để làm procedural animation.
- Retargeting qua Avatar (Unity) hoặc IK Retargeter (Unreal).
- Tinh chỉnh twist bones và Twist Correction.
- Mục tiêu: rig tay, chân, đầu có aim; retarget mocap cho nhân vật khác.

### Cấp 3: Nâng cao
- Corrective blendshape và facial rig kết hợp xương và blendshape.
- Tối ưu hiệu năng: số khớp, số ảnh hưởng, LOD, bake.
- Cloth và secondary motion: bake xuống xương, xương dynamic.
- Hiểu DQS và các phương pháp skinning khác.
- Mục tiêu: rig một nhân vật chính với mặt và áo choàng, đạt budget real-time.

### Cấp 4: Chuyên sâu (TD)
- Thiết kế pipeline cho nhóm nhiều người.
- Viết công cụ (Python, MEL, C#) để tự động hóa rig và kiểm tra.
- Quản lý metadata, exporter, và tích hợp với engine.
- Đánh giá các công nghệ mới như ML cho blendshape và rig tự động.

---

## 12. Khoảng trống chưa nghiên cứu

- **Video và slide GDC:** GDC Vault có nội dung giới hạn cho người không đăng ký, nên tôi chỉ có mô tả phiên, không có slide hay nội dung đầy đủ.
- **Con số hiệu năng cụ thể** trên từng nền tảng (mobile, console, PC). Các con số hiện có chủ yếu từ blog cộng đồng.
- **Animation compression** và tác động của nén lên chất lượng rig.
- **Skeleton LOD** chi tiết: cách chuyển đổi giữa các mức xương mà không làm hỏng animation.
- **Unreal Control Rig** chi tiết (solver, node, runtime). Tôi chỉ tìm được tài liệu về IK Rig và Retargeter.
- **Godot và các engine khác**: chưa tìm.
- **Spider-Man và Battlefield 3**: chỉ có mô tả, chưa có nội dung kỹ thuật chi tiết.
- **Giấy phép và chi phí** của các công cụ thương mại.

Nếu bạn cần đi sâu vào một hướng cụ thể (ví dụ Unreal Control Rig, facial rig cho mobile, hoặc pipeline cho nhóm lớn), tôi có thể tiếp tục nghiên cứu theo hướng đó.

---

## Nguồn tham khảo

**Unity (chính thức)**
- SkinnedMeshRenderer (quality, bones per vertex): https://docs.unity3d.com/ru/2021.1/Manual/class-SkinnedMeshRenderer.html
- Animation Rigging – Constraint Components: https://docs.unity3d.com/Packages/com.unity.animation.rigging@1.0/manual/ConstraintComponents.html
- Animation Rigging – Changelog: https://docs.unity3d.com/Packages/com.unity.animation.rigging@1.2/changelog/CHANGELOG.html
- Retargeting (Mecanim): https://docs.unity3d.com/2019.1/Documentation/Manual/Retargeting.html
- Animation Overview (legacy, tham khảo khái niệm): https://docs.unity3d.com/560/Documentation/Manual/AnimationOverview.html

**Unreal Engine (chính thức)**
- IK Rig: https://dev.epicgames.com/documentation/unreal-engine/unreal-engine-ik-rig
- IK Rig Animation Retargeting: https://dev.epicgames.com/documentation/unreal-engine/ik-rig-animation-retargeting-in-unreal-engine
- MetaHuman Assets Overview: https://dev.epicgames.com/documentation/metahuman/assets-overview
- MetaHuman Stylized Character Tutorial: https://dev.epicgames.com/documentation/metahuman/metahuman-stylized-character-tutorial

**Blender**
- Rigify (Introduction, Bone Positioning): https://docs.blender.org/manual/en/2.81/addons/rigging/rigify.html

**Autodesk**
- Maya smooth skinning methods: https://help.autodesk.com/cloudhelp/ENU/MayaCRE-CharacterAnimation/files/GUID-630C335C-B63E-4F2E-A4A4-AEA1DD00B0D6.htm
- 3ds Max What's New (Dual Quaternion): https://help.autodesk.com/cloudhelp/2016/ENU/3DSMax/files/GUID-1D319823-5D8E-4C84-AE9C-D7DCDD07317D.htm

**Học thuật và nghiên cứu**
- Pixar – Crafting Expressive, Non-Humanoid Alien Characters: https://graphics.pixar.com/library/ElioCharsRig/paper.pdf
- DreamWorks – Rigging Octopuses in Penguins of Madagascar: https://research.dreamworks.com/wp-content/uploads/2018/07/octopus_rigging_digipro_extended_abstract_FINAL-Edited.pdf
- Seo và cộng sự (KAIST, 2010): https://koasas.kaist.ac.kr/handle/10203/98067
- Recent Trends in 3D Reconstruction (arXiv:2403.15064): https://arxiv.org/pdf/2403.15064
- Disney Research – Optimized Centers of Rotation: https://la.disneyresearch.com/wp-content/uploads/Real-time-Skeletal-Skinning-with-Optimized-Centers-of-Rotation-Paper.pdf
- Position-based Skinning for Soft Articulated Characters: https://bura.brunel.ac.uk/bitstream/2438/21213/2/FullText.pdf
- RigAnything (arXiv:2502.09615): https://arxiv.org/html/2502.09615v2

**GDC và sản xuất**
- GDC 2024 – From Photo to Expression (SEED/EA): https://schedule.gdconf.com/session/machine-learning-summit-from-photo-to-expression-generating-photorealistic-facial-rigs/902241
- GDC 2019 – Facial Rigging in Marvel's Spider-Man (Insomniac): https://www.gameanim.com/?p=72728
- GDC 2012 – Modular Rigging in Battlefield 3 (DICE): https://www.gdcvault.com/play/1015573/Modular-Rigging-in-Battlefield
- GDC 2016 – Just Cause 3 Animation and Rigging Pipeline (Avalanche): https://www.gdcvault.com/play/1023566
- Technical Art Techniques: Character Rigging and Technical Animation (GDC panel): https://gdcvault.com/play/1012716/Technical-Art-Techniques-Character-Rigging
- GDC 2006 – Character Rigging Best Practices: https://gdcvault.com/play/1022920/Character-Rigging-Best
- GDC 2006 (tóm tắt từ gamedev.net): https://archive.gamedev.net/archive/columns/events/gdc2006/articlee9d2.html?id=655
- GDC Festival of Gaming – RigX: https://schedule.gdconf.com/session/the-future-of-facial-rigging-rigx-and-the-next-era-of-digital-humans-presented-by-2dnac/917088

**Cộng đồng và blog**
- Polycount – Cape and hair bones: https://polycount.com/discussion/comment/1414722
- Polycount – Maya cloth rig for Unity: https://polycount.com/discussion/comment/2693621
- Polycount – Face rigging thread: https://polycount.com/discussion/comment/2667131
- Polycount – Character rigging for long clothing: https://polycount.com/discussion/comment/2664444
- Blender Artists – Make skirt rig react to leg movement: https://blenderartists.org/t/make-skirt-rig-react-to-leg-movement/1563573
- Blender Artists – Skirt rigging problem: https://blenderartists.org/t/skirt-rigging-problem/670900
- Unity Discussions – Skinned cloth: https://discussions.unity.com/t/skinned-cloth-tutorials-tips-and-tricks/500364
- Babylon.js Forum – Dual quaternion skinning: https://forum.babylonjs.com/t/dual-quaternion-skinning/10595
- three.js PR #26222 – Bone weight texture: https://github.com/mrdoob/three.js/pull/26222
- Mocap Online – Game rigging guide: https://mocaponline.com/blogs/mocap-news/character-rigging-game-dev-guide
- Mocap Online – Skeleton for games: https://mocaponline.com/blogs/mocap-news/skeleton-3d-model-rigging-games
- Mimic Productions – Rigging for real time: https://www.mimicproductions.com/post/rigging-for-real-time
- AutoRig.online – Product Hunt: https://www.producthunt.com/products/autorig-online/launches/autorig-online
- Daniel Martinez Ojeda – Corrective blendshape tool (LinkedIn): https://es.linkedin.com/in/danielmaoj
- SideFX Forum – Rigging a prop to hand: https://www.sidefx.com/forum/post/342215/
