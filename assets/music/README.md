# Nhạc nền / Background music

Đặt file nhạc nền mặc định ở đây với tên `default.mp3` — pipeline sẽ tự lồng nó dưới giọng đọc
(lặp lại cho đủ độ dài, tự hạ nhỏ khi có giọng nói, fade in/out).

- Chỉ dùng nhạc bạn có quyền sử dụng (tự sáng tác, mua license, hoặc miễn phí bản quyền như
  YouTube Audio Library / Pixabay Music). Nhạc có bản quyền dễ bị Content ID tắt tiếng hoặc gỡ video.
- File `.mp3`/`.wav` trong thư mục này không được commit (xem `.gitignore`).
- Đổi file hoặc âm lượng cho từng video: thêm `"music": { "file": "assets/music/khac.mp3", "volume": 0.15 }`
  vào `script.json`; `"file": "none"` để tắt. Hoặc đặt `BG_MUSIC_FILE` / `BG_MUSIC_VOLUME` trong `.env.local`.
