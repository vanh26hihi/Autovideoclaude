---
name: create-motion-video
description: Tạo video MOTION GRAPHICS (chữ, số, icon, danh sách, so sánh chuyển động dựng bằng code, không ảnh/video stock) cho chủ đề kiến thức, mẹo, "N cách", số liệu, so sánh. Trigger khi user muốn "video motion graphics", "chữ chuyển động", "kiểu motion", "infographic động", hoặc khi make-video chọn thể loại này.
---

# Create Motion-Graphics Video

Mọi scene body dùng template `frame-motion` (xem `templates/CATALOG.md`): hình ảnh do
code vẽ và chuyển động bằng GSAP, đồng đều chất lượng giữa các cảnh, không phụ thuộc
Pixabay. Nguyên lý chuyển động lấy từ các skill motion có license mở trong
`vendor/motion/` (LottieFiles motion-design-skill, iart-ai, claude-motion, hyperframes
motion-reel): mỗi cảnh build → breathe → resolve, vào chậm ra nhanh, easing khác nhau.

## Trước khi viết

Hỏi tên kênh, logo, nguồn nếu chưa có (không tự bịa). Khung mặc định **9:16**;
user nói YouTube/ngang thì `"aspect": "16:9"`.

## Kịch bản

- 8–12 scene, tổng voiceText 250–330 từ (~60–90 s), mỗi scene 1 ý, 20–35 từ.
- scene đầu `type: "hook"`, cuối `type: "outro"` dùng `frame-logo-outro`
  (`brand_name` = tên kênh, `tagline` ≤ 6 từ, `primary_url` chỉ khi user đưa).
- Số trong voiceText viết bằng chữ ("hai mươi lăm phút"); trên màn hình dùng số ("25").
- Chữ trên màn hình NGẮN: `headline` ≤ 7 từ, không chép nguyên câu đọc.

## Chọn `kind` cho từng scene (đổi liên tục, không lặp 2 cảnh liền nhau)

| Ý của scene | kind | slot chính |
| --- | --- | --- |
| Câu hỏi mở đầu, khái niệm, lời khuyên | `title` | `icon`, `headline`, `kicker`, `label` |
| Có con số (thời gian, %, số lần) | `number` | `number`, `unit`, `percent`, `headline` |
| Liệt kê 2–4 thứ (tổng kết, các bước) | `list` | `headline`, `items[{icon,text}]` |
| Sai vs đúng, cũ vs mới, A vs B | `compare` | `headline`, `left`, `right` |
| Câu trích, câu chốt | `quote` | `headline` |

Mỗi video nên có ít nhất 1 `number`, 1 `list`, 1 `compare` nếu nội dung cho phép.
`tone` đổi giữa các cảnh (blue, purple, warm, green, red, dark). Emoji: 1 cái, đúng ý.

## script.json mẫu (rút gọn)

```json
{
  "version": "1.0", "renderer": "hyperframes", "aspect": "9:16",
  "metadata": { "title": "...", "source": { "url": "", "domain": "", "image": null }, "channel": "Vanhhehe" },
  "voice": { "provider": "vieneu", "speed": 1.0 },
  "music": { "file": "assets/music/default.mp3", "volume": 0.18, "fadeOutSec": 3 },
  "scenes": [
    { "id": "hook", "type": "hook", "voiceText": "…", "templateId": "frame-motion",
      "inputs": { "kind": "title", "icon": "😩", "headline": "Học nhiều mà *vẫn quên?*", "tone": "dark" } },
    { "id": "m1", "type": "body", "voiceText": "Cách một là Pomodoro. Học tập trung hai mươi lăm phút…", "templateId": "frame-motion",
      "inputs": { "kind": "number", "kicker": "Cách 1 · Pomodoro", "number": "25", "unit": "phút", "percent": 80, "headline": "Tập trung *tuyệt đối*", "label": "rồi nghỉ năm phút", "tone": "blue" } },
    { "id": "outro", "type": "outro", "voiceText": "…", "templateId": "frame-logo-outro",
      "inputs": { "brand_name": "Vanhhehe", "tagline": "Học ít hơn, nhớ lâu hơn", "primary_url": "" } }
  ]
}
```

## Render và kiểm tra

Ghi `output/<slug>-<YYYYMMDD-HHmm>/script.json`, chạy `npm run pipeline -- <đường dẫn>`.
Mỗi cảnh motion render ~10–20 s. Xem 1 khung giữa mỗi cảnh: chữ không tràn khung,
đủ dấu, highlight đúng chỗ. Báo đường dẫn video, thời lượng, dung lượng.
