# Autovideo Claude

Tạo video bằng code với [Remotion](https://www.remotion.dev) + React + TypeScript.

## Cài đặt

Cần Node.js 18 trở lên.

```bash
npm install
```

## Xem trước (Remotion Studio)

```bash
npm run dev
```

Mở địa chỉ hiện trong terminal (mặc định http://localhost:3000) để xem và chỉnh video trực tiếp. Có thể sửa `title`, `subtitle`, `accent` trong bảng props bên phải.

## Render ra file

```bash
npm run render        # -> out/social-media.mp4 (1920x1080, 30fps, 60 giây)
npm run render:hello  # -> out/hello.mp4 (video demo 5 giây)
npm run still    # -> out/thumbnail.png (khung hình 60)
```

Render với props khác mà không sửa code:

```bash
npx remotion render HelloVideo out/custom.mp4 --props='{"title":"Xin chào","subtitle":"Video thứ hai","accent":"#ff5c8a"}'
```

Nếu máy không tải được Chrome Headless Shell, chỉ định trình duyệt có sẵn bằng `--browser-executable=/đường/dẫn/tới/chrome`.

## Âm thanh

Nhạc nền và hiệu ứng âm thanh (`public/audio/*.mp3`) được tổng hợp bằng code, không dính bản quyền. Muốn tạo lại hoặc chỉnh nhạc:

```bash
python3 scripts/make-audio.py   # cần numpy và ffmpeg
```

Muốn dùng nhạc khác thì chỉ cần thay file `public/audio/music.mp3`.

Giọng đọc tiếng Việt (`public/audio/vo-1.mp3` đến `vo-6.mp3`, mỗi file một cảnh) được tạo bằng eSpeak NG. Sửa lời đọc trong `scripts/make-voiceover.py` rồi chạy:

```bash
python3 -m pip install espeakng-loader
python3 scripts/make-voiceover.py
```

Muốn giọng tự nhiên hơn, thay các file `vo-*.mp3` bằng bản ghi âm hoặc giọng AI khác, giữ nguyên tên file.

## Cấu trúc

```
src/
  index.ts        # điểm vào, đăng ký root
  Root.tsx        # khai báo các composition (id, kích thước, fps, thời lượng)
  HelloVideo.tsx  # video demo: tiêu đề chạy từng chữ, gạch chân, phụ đề, fade out
  social/         # video 1 phút "Giới trẻ và mạng xã hội"
    scenes.tsx            # 6 cảnh: câu hỏi mở đầu, phép tính thời gian, tác hại, câu hỏi suy ngẫm, giải pháp, kết
    SocialMediaVideo.tsx  # ghép các cảnh với hiệu ứng chuyển mờ, chỉnh thời lượng từng cảnh ở đây
    theme.ts              # màu sắc, font
    common.tsx            # nền, hiệu ứng xuất hiện, phát hiệu ứng âm thanh
public/audio/     # nhạc nền và hiệu ứng âm thanh
scripts/make-audio.py      # tạo nhạc nền và hiệu ứng âm thanh
scripts/make-voiceover.py  # tạo giọng đọc
remotion.config.ts
```

Thêm video mới: tạo component trong `src/`, rồi khai báo thêm một `<Composition>` trong `Root.tsx`.
