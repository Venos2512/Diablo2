# Quy tắc phân công agent

Áp dụng cho các tác vụ trong dự án này, trừ khi người dùng chỉ định khác.

## Phân công model

| Công việc | Model phụ trách | Provider T3 | Model ID |
| --- | --- | --- | --- |
| Tạo hoặc chỉnh sửa ảnh | Astra | `codex` | `gpt-6-astra` |
| Research, tra cứu, tổng hợp nguồn | Haiku 5.5 | `claudeAgent` | `claude-haiku-5-5` |
| Viết code, sửa lỗi, refactor, viết test | Sonnet 5.5 | `claudeAgent` | `claude-sonnet-5-5` |
| Review code sau khi triển khai hoặc sửa | Opus 5.5 | `claudeAgent` | `claude-opus-5-5` |
| Rigging (dựng skeleton, skin, kiểm và ảnh QA rig) | Opus 5.5 | `claudeAgent` | `claude-opus-5-5` |
| Animation (làm clip, kiểm clip, bake / xuất / reimport) | Opus 5.5 | `claudeAgent` | `claude-opus-5-5` |

Astra phụ trách tác vụ ảnh và sử dụng công cụ/skill tạo ảnh khả dụng để xuất ảnh thực tế.

**Codex (Astra) chỉ dùng để tạo hoặc chỉnh sửa ảnh** (quyết định của người dùng, 2026-10-21). Không giao cho Codex việc viết code,
viết script, review code hay rigging.

Rigging và animation của hero, quái, NPC ASHLAR: Opus 5.5 làm cả rig lẫn animation, mỗi phần một phiên riêng, theo bước và cổng duyệt trong
[`ashlar/3d/rig-anim/Agent.md`](./ashlar/3d/rig-anim/Agent.md) mục 1. Hai dòng này áp dụng cho việc rig và clip của một asset; việc viết script
công cụ dùng chung vẫn là Sonnet viết, và vòng review code ở dưới không đổi.

## Quy trình code và review bắt buộc

1. Giao Sonnet 5.5 triển khai với yêu cầu, phạm vi, file liên quan và tiêu chí nghiệm thu rõ ràng.
2. Sonnet chạy các kiểm tra phù hợp, bàn giao thay đổi, kết quả kiểm tra và vấn đề còn tồn tại.
3. Giao Opus 5.5 review thay đổi thực tế theo yêu cầu ban đầu; kiểm tra tính đúng đắn, lỗi hồi quy, bảo mật và mức độ kiểm chứng phù hợp.
4. Opus trả kết luận `PASS` hoặc `NEEDS_CHANGES`. Mỗi yêu cầu sửa cần nêu vị trí, vấn đề, tác động và hướng khắc phục. Opus review, Sonnet thực hiện sửa code.
5. Nếu `NEEDS_CHANGES`, tiếp tục gọi Sonnet 5.5 với đầy đủ findings để sửa và chạy lại các kiểm tra liên quan.
6. Sau mỗi lượt sửa, gọi Opus 5.5 review lại phiên bản mới; cung cấp yêu cầu gốc, findings trước đó, phản hồi của Sonnet và các điểm chưa giải quyết.
7. Lặp Sonnet → Opus đến khi Opus kết luận `PASS` và các kiểm tra cần thiết đạt. Nếu bị chặn hoặc các vòng lặp không tiến triển, báo rõ vấn đề còn lại; không tuyên bố hoàn thành.

Không bỏ qua bước review của Opus chỉ vì Sonnet đã tự kiểm tra hoặc test đã pass.

## Điều phối trong T3 Code

- Agent chính phân loại công việc và giao cho đúng model ở trên; tác vụ hỗn hợp được chia theo từng phần việc.
- Dùng `orchestrator_capabilities` để xác nhận provider/model khả dụng trước khi giao việc. Các ID trong bảng là cấu hình đã xác nhận khi tạo file; kiểm tra lại khi bắt đầu phiên mới.
- Dùng cơ chế subagent/delegation khả dụng với đúng model. Khi native subagent không hỗ trợ model yêu cầu hoặc cần gọi khác provider, dùng T3 `delegate_task`.
- Mỗi vòng review T3 là một lần `delegate_task` mới, có `clientRequestId` riêng và giữ nguyên ID khi retry cùng vòng. Lưu `taskId` để theo dõi; không dùng `t3_thread_send` vào `childThreadId` để mở vòng review tiếp theo.
- Truyền rõ vai trò cho từng subagent. Subagent hoàn thành phần được giao rồi trả kết quả; agent chính quản lý vòng lặp Sonnet/Opus để tránh tự gọi đệ quy.
- Đảm bảo reviewer đọc đúng phiên bản thay đổi mới nhất. Worktree mới chỉ nhận commit hiện có, không tự nhận các thay đổi chưa commit của agent chính.
- Nếu model hoặc công cụ cần thiết không khả dụng, báo rõ giới hạn và xin lựa chọn thay thế; không âm thầm đổi model.
- Báo cáo cuối nêu phần đã làm, kiểm tra đã chạy, kết luận review và các điểm còn tồn tại nếu có.
