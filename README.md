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
npm run render   # -> out/hello.mp4 (1920x1080, 30fps, 5 giây)
npm run still    # -> out/thumbnail.png (khung hình 60)
```

Render với props khác mà không sửa code:

```bash
npx remotion render HelloVideo out/custom.mp4 --props='{"title":"Xin chào","subtitle":"Video thứ hai","accent":"#ff5c8a"}'
```

Nếu máy không tải được Chrome Headless Shell, chỉ định trình duyệt có sẵn bằng `--browser-executable=/đường/dẫn/tới/chrome`.

## Cấu trúc

```
src/
  index.ts        # điểm vào, đăng ký root
  Root.tsx        # khai báo các composition (id, kích thước, fps, thời lượng)
  HelloVideo.tsx  # video demo: tiêu đề chạy từng chữ, gạch chân, phụ đề, fade out
remotion.config.ts
```

Thêm video mới: tạo component trong `src/`, rồi khai báo thêm một `<Composition>` trong `Root.tsx`.
