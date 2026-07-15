# Android Middle Interview Handbook

Static learning app chạy tại `/android-learning/` trên GitHub Pages.

## Thành phần

- `index.html`: app shell.
- `styles/main.css`: responsive UI, dark/light theme.
- `scripts/app.js`: hash router, catalog, lesson renderer, quiz và local progress.
- `data/catalog.json`: mục lục và trạng thái xuất bản.
- `data/lessons/`: một JSON cho mỗi bài.
- `data/glossary.json`: thuật ngữ dùng chung.
- `CONTENT_RULES.md`: quy tắc bắt buộc khi generate bài mới.

## Progress

Tiến độ, bài đã hoàn thành và điểm quiz được lưu trong `localStorage` với key `android-learning-progress-v1`.

## Thêm bài mới

1. Chọn lesson `planned` tiếp theo trong `data/catalog.json`.
2. Tạo JSON đúng cấu trúc tại path đã khai báo.
3. Đổi trạng thái lesson thành `published`.
4. Bổ sung metadata vào `data/search-index.json`.
5. Kiểm tra lesson, quiz và giao diện trên mobile.
