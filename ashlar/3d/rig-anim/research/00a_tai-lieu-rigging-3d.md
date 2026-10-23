# Tài liệu nghiên cứu: Rigging 3D chính xác, quần áo và hình khối đặc biệt

Tài liệu tổng hợp từ các nguồn tiếng Anh (đã diễn giải lại bằng tiếng Việt, không trích nguyên văn). Các video chỉ được ghi nhận qua tiêu đề và mô tả; nội dung video chưa được xác minh.

---

## Phần 1: Nguyên tắc nền tảng

### 1.1 Rig là gì
Rigging là quá trình tạo bộ xương (hệ thống khớp), trọng số skinning và hệ thống điều khiển để một model tĩnh có thể được tạo dáng và animate. Về bản chất, rig gồm ba phần: hệ phân cấp khớp, trọng số gắn mesh vào khớp, và các controller để animator làm việc.

### 1.2 Quy trình tham khảo của xưởng VFX
Một TD rigging của xưởng MPC mô tả quy trình như sau:
- Trước khi rig, thu thập tài liệu tham khảo: video chuyển động chậm, ảnh bộ xương, thông tin về loài.
- Đặt hình học xương vào bên trong model, rồi mới bố trí khớp và skin cluster.
- Lõi của mọi rig vẫn là khớp và skin. Kỹ năng đặt khớp và vẽ trọng số là nền tảng, đi cùng hiểu biết về giải phẫu.
- Với nhân vật chính, thường thêm rig cơ, corrective và mô phỏng da.

### 1.3 Giải phẫu làm nền cho việc đặt khớp
- Khớp nên đặt tại điểm xoay có cơ sở giải phẫu: vai, hông, khuỷu, gối, cổ.
- Một workshop của sinh viên (tham chiếu Leonardo da Vinci) gợi ý hình dung cơ thể người như có thể nằm gọn trong hình vuông và hình tròn, để nhanh chóng nắm khung xương. Đây là blog cá nhân, chỉ nên dùng làm gợi ý.
- Mỗi rigger hoặc modeler nên có kiến thức cơ bản về giải phẫu để áp dụng cho từng nhân vật cụ thể.

---

## Phần 2: Kỹ thuật xác định khớp chính xác

### 2.1 Đặt khớp theo mốc hình học (landmark)
Tài liệu Rigify của Blender chia khuôn mặt thành các vùng mốc:
- Vòng quanh mắt và mũi: xương đặt theo vòng khép kín.
- Vùng hàm và tai: xương phải phủ phần tai gắn vào xương hàm, và xương "temple" giúp xác định điểm xoay của hàm.
- Lông mày: giữ các xương giữa thẳng hàng để kết quả sau khi generate ổn định hơn.
- Xương bắc cầu (bridging): dùng để phủ phần da mềm.

Với thân người, nên xác định trước các vùng thân, rồi đặt xương theo ranh giới vùng. Ranh giới vùng cần có vòng cạnh (edge loop) tốt, vì điều này quyết định độ biến dạng sau khi bind.

### 2.2 Tư thế trước khi rig
- Rigify hoạt động dự đoán tốt nhất khi chân và cột sống thẳng trong góc nhìn chính diện.
- Nhiều hệ thống auto-rig khuyến nghị T-pose. Khi tay để sát thân, việc đặt khớp và trọng số có thể kém chính xác hơn.
- Với Wonder Dynamics: nên căn giữa, quay mặt về phía trước và chỉnh tỷ lệ trước khi đặt marker khớp.

### 2.3 Hai hướng xác định khớp tự động
1. **Khớp theo template:** fit bộ xương mẫu vào các mốc trên mesh.
2. **Dự đoán bằng học máy:** mô hình suy ra vị trí khớp từ hình học.

Cả hai thường tìm chi bằng cách nhận diện các phần hình ống nhô ra khỏi thân. Trọng số thường được tính bằng thuật toán dựa trên khoảng cách đến xương (ví dụ "bone heat" trong Blender).

### 2.4 Hướng nghiên cứu mới: RigAnything (arXiv 2502.09615)
- Mô hình transformer tự hồi quy, "mọc" bộ xương từ khớp gốc theo từng bước, không cần template.
- Dùng diffusion để cải thiện độ chính xác vị trí khớp trong hệ phân cấp.
- Biểu diễn bộ xương theo thứ tự BFS, mỗi khớp gồm vị trí 3D và chỉ số khớp cha.
- Trọng số skinning được suy ra từ toàn bộ các khớp.

### 2.5 Chuyển rig giải phẫu giữa các nhân vật
Seo và cộng sự (KAIST, 2010, *Computer Animation and Virtual Worlds*) đề xuất phương pháp chuyển rig cơ-xương từ nhân vật này sang nhân vật khác. Phương pháp dựa trên nội suy dữ liệu trên bề mặt và thể tích, chỉ cần một số điểm đặc trưng tương ứng giữa hai mesh.

---

## Phần 3: Công cụ rigging

### 3.1 Miễn phí hoặc đi kèm phần mềm
- **Blender Rigify:** đi kèm Blender. Dùng meta-rig để tạo bộ điều khiển phức tạp từ bộ xương đơn giản. Giả định 1 đơn vị tương đương 1 mét. Có thể mở rộng bằng Python.
- **AccuRIG:** miễn phí. Tạo bộ xương nhanh cho model người hoặc quadruped, sau đó chỉnh tay. Quy trình thường là chạy trọng số tự động rồi tinh chỉnh trong chế độ weight paint.

### 3.2 Plugin và phần mềm chuyên dụng
- **Advanced Skeleton (Maya):** plugin tự động hóa nhiều khâu rig, cho phép tạo rig phức tạp nhanh hơn.
- **Maya CAT và Biped:** bộ công cụ rig nhân vật có sẵn của Maya.
- **Ziva VFX (Maya):** mô phỏng cơ và mô mềm.
  - Anatomy Transfer: chuyển cấu trúc cơ từ một rig gốc sang nhiều nhân vật có hình dạng khác nhau.
  - Có công cụ vẽ điểm bám cơ và sợi cơ.
  - Ziva RT: dùng học máy để tạo rig mô phỏng cơ dùng được thời gian thực.
  - Hữu ích cho nhân vật cần khối cơ hoặc khối mô bên trong, kể cả nhân vật stylized.

### 3.3 Auto-rig bằng AI hoặc trên web
- **Wonder Dynamics (Rigging Tool):** người dùng đặt marker tại cằm, cổ, vai, khuỷu, tay, hông, gối và cổ chân. Có tùy chọn đối xứng. Quần áo hoặc phụ kiện che tay chân có thể cho kết quả kém.
- **3D AI Studio:** auto-rig với Prism provider, theo chuẩn tên xương Mixamo. Hỗ trợ biped, quadruped, avian, serpentine. Nên dùng T-pose.
- **Uthana Character Rigging (trên Scenario):** đọc hình học mesh và đặt bộ xương biped kèm trọng số.
- **AutoRig.online:** auto-rig cho nhân vật người, động vật, quái vật, đuôi, cánh và phụ kiện. Ra mắt tháng 5/2026. Thông tin từ trang sản phẩm, cần thử trước khi đánh giá hiệu quả.

### 3.4 Xuất file cho engine
Trong glTF, bộ xương là hệ phân cấp node. Mỗi khớp được khai báo trong danh sách joints của skin, kèm inverse bind matrix để đưa tọa độ mesh về không gian của khớp. Đây là phần cần kiểm tra khi xuất GLB hoặc FBX cho game.

---

## Phần 4: Rig quần áo

### 4.1 Ba hướng tiếp cận

**(a) Chuyển trọng số từ body sang quần áo.**
- Phù hợp khi quần áo ôm sát cơ thể.
- Trong Blender có thể dùng Parent with Automatic Weights hoặc Data Transfer, sau đó tinh chỉnh bằng weight paint.
- Với áo giáp, nếu tay quá sát mesh giáp, trọng số sẽ bị lan sang hông giáp. Cách xử lý: đưa tay về T-pose trước khi chuyển trọng số.

**(b) Rig bằng xương và constraint.**
- Phù hợp với áo choàng, váy, phụ kiện treo, đặc biệt trong game.
- Cấu trúc điển hình: xương biến dạng (deformation), xương cơ chế (mechanic), xương điều khiển (control).
- Các game như Heavenly Sword và FFXIII dùng xương cho áo choàng và tóc mà không để chúng xuyên vào nhân vật.

**(c) Mô phỏng vật lý rồi bake xuống xương.**
- Phù hợp với áo rộng, áo khoác, áo choàng, váy dài.
- Với mobile hoặc real-time, nên bake mô phỏng thành animation xương thay vì chạy cloth sim lúc runtime.

### 4.2 Quy trình bake mô phỏng xuống xương (tham khảo Polycount)
1. Căn xương theo cloth ở T-pose.
2. Bind xương vào cloth để xương bám theo các đỉnh.
3. Chạy mô phỏng cloth.
4. Unbind xương khỏi cloth.
5. Tắt mô phỏng, skin cloth vào xương đã bake.
6. Import vào engine và thiết lập cloth joints nếu cần.

### 4.3 Rig váy theo chuyển động chân
- Copy rotation constraint thường chỉ nhận một nguồn. Khi có hai chân, một constraint có thể bị bỏ qua.
- Xương váy có thể không khớp đúng góc xoay của xương chân, dẫn đến uốn sai hướng hoặc xoay quá mức.
- Kích thước váy có thể phình khi nâng lên. Một gợi ý là coi vòng viền váy như một chu vi không đổi.
- Hướng khắc phục: dùng drivers để nhận nhiều đầu vào (xoay của cả hai đùi) rồi tính góc xoay đầu ra.
- Có thể cho váy ngồi sát hơn lên chân khi chân nâng lên để trông tự nhiên hơn.

### 4.4 Rig áo choàng và tóc
- Vấn đề thường gặp: áo choàng hoặc tóc xuyên vào mesh nhân vật khi chuyển động.
- Cách tiếp cận: dùng xương IK spline được điều khiển bởi tóc hoặc cloth, kèm collision hoặc ràng buộc để tránh xuyên.
- Với Maya, có thể dùng công cụ tạo joint động từ joint chain (make joint chain dynamic) cho váy và phụ kiện.
- Một người dùng báo cáo khó khăn khi biến váy thành collider thụ động cho chân. Đây là vấn đề cần tinh chỉnh riêng.

### 4.5 Khi nào nên mô phỏng thay vì rig
- Một sinh viên có skinning quần áo không sửa được. Giải pháp: animate nhân vật không mặc đồ, rồi mô phỏng quần áo theo từng shot.
- Cộng đồng nhận định: với quần áo rộng, mô phỏng là lựa chọn duy nhất đáng tin về mặt thẩm mỹ.

### 4.6 Quần áo trong Unity
- Skinned Cloth cần cả trọng số và cấu hình cloth.
- Nên áp cloth lên đúng mesh quần áo, không phải lên group.
- Một hướng khác: dùng morph target cho hình dạng nhân vật, rồi dùng công cụ wrap (như MegaFiers) để tự động biến dạng quần áo theo.

### 4.7 Quy trình tham khảo từ đồ án sinh viên
1. Tạo rig bằng Advanced Skeleton.
2. Đặt skeleton khớp với model.
3. Skin cho thân.
4. Vẽ trọng số trong khi animate bằng ngSkinTools.
5. Copy trọng số sang quần áo.
6. Xuất backup trọng số.
7. Làm face rig.
8. Làm rig đặc biệt cho dây xích, váy, giày bằng key drives.

---

## Phần 5: Hình khối đặc biệt và nhân vật phi nhân dạng

### 5.1 Pixar (Elio, 2025)
Bài báo mô tả rig cho nhân vật ngoài hành tinh có cấu trúc khác người: không chi, nhiều đoạn, dạng lỏng. Các điểm chính:
- Quy trình cộng tác sớm giữa nhóm nhân vật và nhóm animation.
- Dùng preview nhanh bằng hình khối đơn giản để duyệt thiết kế trước khi rig.
- Rig mô-đun và deformer tùy chỉnh.
- Dùng AutoSplines (đường cong điều khiển xương) để dẫn xương theo hình dạng.
- Điều khiển dáng bằng profile curves.

### 5.2 DreamWorks (Penguins of Madagascar)
Bạch tuộc cần rig xúc tu. Các điểm chính:
- Xúc tu được tách thành asset riêng, có thể gắn vào nhân vật khác.
- Hệ thống xúc tu được phát triển dựa trên hệ thống đuôi có sẵn.
- Xúc tu cần linh hoạt hơn đuôi: dùng để di chuyển, bám bề mặt không nằm ngang, và thao tác đồ vật.

### 5.3 Đuôi, tai và phụ kiện
- Tạo xương bổ sung cho tai, đuôi trên khung xương chính.
- Phụ kiện mang theo nhân vật (ví dụ túi, vũ khí) có thể dùng constraint hoặc chuỗi xương để chuyển động thứ cấp.

### 5.4 Công cụ AI cho sinh vật
AutoRig.online nhắm vào động vật, quái vật, tai, đuôi, cánh. Cần kiểm chứng trên model thực tế.

---

## Phần 6: Kỹ thuật skinning cho vùng khớp phức tạp

### 6.1 Các vấn đề thường gặp
- **Candy wrapper:** mesh bị co lại khi xương xoay quanh trục, thường thấy ở cổ tay, cẳng tay.
- **Mất thể tích (volume loss):** mesh co hoặc thu nhỏ quanh khớp.
- **Bulging:** mesh phình ra ở vùng khớp gập khi dùng DQS.
- **Collapsing:** khớp gập gần 180 độ làm mesh sụp.

### 6.2 Các phương pháp skinning

| Phương pháp | Ưu điểm | Nhược điểm |
|---|---|---|
| Linear Blend Skinning (LBS) | Nhanh, phổ biến | Candy wrapper, mất thể tích |
| Dual Quaternion Skinning (DQS) | Giảm candy wrapper | Có thể phình ở một số vùng |
| Kết hợp LBS và DQS | Linh hoạt theo từng khớp hoặc vùng | Cần tinh chỉnh thủ công |
| Optimized Centers of Rotation | Giảm phình của DQS | Phức tạp hơn khi triển khai |
| Position-based skinning | Có thể mô phỏng jiggle và giữ thể tích | Đòi hỏi tài nguyên tính toán |

### 6.3 Thực hành trong các phần mềm
- **Maya:** có thể chọn LBS, DQS hoặc kết hợp cả hai khi bind (Smooth Bind Options), hoặc thay đổi sau trong skinCluster.
- **3ds Max:** Skin modifier có tùy chọn Dual Quaternion, có thể vẽ vùng ảnh hưởng và giảm dần về LBS ở vùng khác.
- **Babylon.js:** hiện không hỗ trợ DQS. Với web hoặc engine này, phải xử lý vùng khớp bằng trọng số và bố trí khớp hợp lý.

---

## Phần 7: Lưu ý thực tế

- Chất lượng mesh và tư thế ban đầu quyết định nhiều nhất trong auto-rig.
- Auto-rig chỉ là điểm khởi đầu. Khớp và trọng số thường cần chỉnh tay, đặc biệt ở vai, hông và các vùng gập.
- Quần áo rộng: ưu tiên mô phỏng hoặc rig bằng xương kết hợp constraint.
- Quần áo ôm sát: ưu tiên chuyển trọng số, sau đó tinh chỉnh.
- Với game: bake mô phỏng xuống xương, không chạy cloth sim lúc runtime trên mobile.
- Trước khi xuất file, kiểm tra hệ phân cấp khớp và inverse bind matrix.

---

## Phần 8: Video tham khảo (chưa xem nội dung)

Các video sau được nhắc đến trong nguồn tìm được. Chỉ dựa trên tiêu đề hoặc mô tả:

- *The EASIEST Way to Model & Rig Clothes in Blender 3D*: model và rig quần áo trong Blender, có phần weight và bind.
- *Mixing Cloth Simulations and Weight Painting/Rigging*: kết hợp cloth với weight painting cho váy.
- *Use Rigify to Easily Rig Your Characters* (Blender 2.92, hai phần): phần đầu tạo rig và gắn mesh, phần sau về weight painting.
- Video skirt rigging (https://www.youtube.com/watch?v=RzrETjZ7S1c) và dog rigging (https://www.youtube.com/watch?v=EZI0aVx9_As) từ blog sinh viên.
- Tutorial Pierrick Picaut về skirt rig và dynamic cloth rigging.
- Video gắn súng vào tay (https://www.youtube.com/watch?v=0XPCNxefOz8) từ diễn đàn SideFX.

---

## Phần 9: Khoảng trống chưa nghiên cứu

- Rig quần áo nhiều lớp (áo khoác trên áo trong) và xử lý va chạm giữa các lớp.
- Xác định tâm khớp từ dữ liệu y khoa (CT, MRI) hoặc motion capture.
- So sánh chi phí và giới hạn của các công cụ AI với Advanced Skeleton và Rigify.
- Giấy phép và chi phí của Ziva VFX.

---

## Nguồn tham khảo

**Rigging và giải phẫu**
- Blender Manual – Rigify Bone Positioning: https://docs.blender.org/manual/en/4.1/addons/rigging/rigify/bone_positioning.html
- Blender Manual – Rigify: https://docs.blender.org/manual/en/2.81/addons/rigging/rigify.html
- RigAnything (arXiv:2502.09615): https://arxiv.org/html/2502.09615v2
- Seo và cộng sự (KAIST, 2010): https://koasas.kaist.ac.kr/handle/10203/98067
- MPC – Planning a successful rig (3D World): https://www.pressreader.com/australia/3d-world/20180905/281908774012153
- Student blog – Rigging workshop: https://marianna3dcomputeranimation.myblog.arts.ac.uk/2022/04/26/character-rigging-and-animation-workshop-week-1/

**Công cụ**
- Wonder Dynamics – Rigging Tool: https://help.wonderdynamics.com/wonder-tools/rigging/
- 3D AI Studio – Rigging docs: https://docs.3daistudio.com/processing/rigging
- Uthana Character Rigging trên Scenario: https://www.scenario.com/blog/uthana-character-rigging-is-now-on-scenario
- AutoRig.online – Product Hunt: https://www.producthunt.com/products/autorig-online/launches/autorig-online
- Cinevva – How Automatic Rigging Works: https://app.cinevva.com/guides/automatic-rigging-explained
- Sloyd – AccuRIG và rig model AI: https://www.sloyd.ai/es/blog/how-to-rig-ai-models-for-animation-in-minutes

**Ziva VFX**
- CG Channel – Ziva VFX 1.6: https://www.cgchannel.com/?p=103182
- Gnomon – Ziva VFX Volume 2: https://bmc.thegnomonworkshop.com/workshops/introduction-to-ziva-vfx-volume-2
- Unity Blog – Fantasy character animation with Ziva VFX: https://blog.unity.com/industry/fantasy-character-animation-with-ziva-vfx

**Quần áo và mô phỏng**
- CGCookie – How do you rig clothes: https://cgcookie.com/community/7103-how-do-you-rig-clothes-your-process
- Polycount – Character rigging for long clothing: https://polycount.com/discussion/comment/2664444
- Polycount – Cape and hair bones: https://polycount.com/discussion/comment/1414722
- Polycount – Maya cloth rig for Unity: https://polycount.com/discussion/comment/2693621
- Blender Artists – Make skirt rig react to leg movement: https://blenderartists.org/t/make-skirt-rig-react-to-leg-movement/1563573
- Blender Artists – Skirt rigging problem: https://blenderartists.org/t/skirt-rigging-problem/670900
- Tutsplus – Maya nCloth part 6: https://design.tutsplus.com/tutorials/understanding-particles-and-dynamics-in-maya-part-6--cms-28481
- Blender Bazaar – Mixing cloth and weight painting: https://bazaar.blendernation.com/?p=3454
- Blender Bazaar – Easiest way to model and rig clothes: https://bazaar.blendernation.com/?p=8290
- Blender Bazaar – Rigify tutorial: https://bazaar.blendernation.com/?p=9633
- Student blog – Texturing, rigging and clothing: https://adeb.myblog.arts.ac.uk/?p=257
- Student blog – Rigging process: https://jtang.myblog.arts.ac.uk/?p=687
- Unity Discussions – Skinned cloth: https://discussions.unity.com/t/skinned-cloth-tutorials-tips-and-tricks/500364
- Steam – Armor weight painting guide: https://steamcommunity.com/app/233860/discussions/3/2650805212046750520
- SideFX Forum – Rigging a prop to hand: https://www.sidefx.com/forum/post/342215/

**Hình khối đặc biệt**
- Pixar – Crafting Expressive, Non-Humanoid Alien Characters: https://graphics.pixar.com/library/ElioCharsRig/paper.pdf
- DreamWorks – Rigging Octopuses in Penguins of Madagascar: https://research.dreamworks.com/wp-content/uploads/2018/07/octopus_rigging_digipro_extended_abstract_FINAL-Edited.pdf

**Skinning**
- Survey – Recent Trends in 3D Reconstruction of Non-Rigid Scenes (arXiv:2403.15064): https://arxiv.org/pdf/2403.15064
- Autodesk – Maya smooth skinning methods: https://help.autodesk.com/cloudhelp/ENU/MayaCRE-CharacterAnimation/files/GUID-630C335C-B63E-4F2E-A4A4-AEA1DD00B0D6.htm
- Autodesk – 3ds Max What's New (Dual Quaternion): https://help.autodesk.com/cloudhelp/2016/ENU/3DSMax/files/GUID-1D319823-5D8E-4C84-AE9C-D7DCDD07317D.htm
- Disney Research – Optimized Centers of Rotation: https://la.disneyresearch.com/wp-content/uploads/Real-time-Skeletal-Skinning-with-Optimized-Centers-of-Rotation-Paper.pdf
- Position-based Skinning for Soft Articulated Characters: https://bura.brunel.ac.uk/bitstream/2438/21213/2/FullText.pdf
- Babylon.js Forum – Dual quaternion skinning: https://forum.babylonjs.com/t/dual-quaternion-skinning/10595
