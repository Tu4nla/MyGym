# Android Learning Content Rules

Mỗi bài học phải có đầy đủ các nhóm nội dung sau:

1. Mục tiêu bài học.
2. Kiến thức nền.
3. Định nghĩa và chú giải thuật ngữ.
4. Cơ chế hoạt động bên trong.
5. Mục đích của kỹ thuật.
6. Vấn đề kỹ thuật giải quyết.
7. Dấu hiệu cần dùng.
8. Khi không nên dùng.
9. Yêu cầu sản phẩm cụ thể.
10. Phân tích dependency, error policy, lifecycle và resource limits.
11. Ví dụ code tối giản.
12. Ví dụ thực tế Upzi hoặc dự án liên quan.
13. Phương án thay thế.
14. Lý do lựa chọn và trade-off.
15. Edge cases.
16. Sai lầm thường gặp.
17. Câu hỏi phỏng vấn cơ bản.
18. Câu hỏi xoáy sâu và câu hỏi bẫy.
19. Mẫu trả lời gắn với kinh nghiệm của người học.
20. Bài tập thực hành.
21. Bài tập tình huống.
22. Checklist tự đánh giá.
23. Tóm tắt cần nhớ.
24. Quiz có giải thích đáp án.

## Quy tắc tính trung thực

Mọi ví dụ liên quan Upzi phải phân biệt rõ:

- `confirmed`: đã xác nhận thực sự áp dụng.
- `inferred`: suy luận hợp lý từ kiến trúc nhưng chưa xác nhận chi tiết.
- `proposed`: phương án đề xuất hoặc thiết kế lại.
- `needs-confirmation`: cần người học xác nhận trước khi dùng như kinh nghiệm phỏng vấn.

Không được biến phương án minh họa thành tuyên bố đã triển khai.

## Quy trình xuất bản

1. Chọn bài `planned` đầu tiên theo thứ tự trong `data/catalog.json`.
2. Viết file JSON tại `data/lessons/<chapter>/<lesson>.json`.
3. Cập nhật `status` thành `published`.
4. Kiểm tra JSON hợp lệ, section ID không trùng, quiz có đáp án và giải thích.
5. Không rút gọn nội dung thành bài blog; mỗi bài phải đủ dùng như một chương sách và tài liệu phỏng vấn.
