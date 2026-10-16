---
name: create-cinematic-motivation
description: Tạo video ĐỘNG LỰC / TƯ DUY THÀNH CÔNG khung NGANG 16:9 dài 2–3 phút theo phong cách "phim điện ảnh truyền động lực" — giọng nam trầm đọc nhanh kịch tính, phụ đề karaoke chữ in hoa tô vàng từng từ, ảnh thật toàn khung với look phim cũ (tông ấm, viền tối, hạt nhiễu, dấu ngày giờ cam), thuật ngữ tiếng Anh hiện chữ lớn. Trigger khi user muốn "video kiểu ai.money24", "video động lực dạng phim", "video tư duy/kỷ luật/trì hoãn/tập trung 16:9", "video truyền cảm hứng có phụ đề karaoke".
---

# Create Cinematic Motivation Video

Video ngang 16:9, 90–180 giây, về tư duy thành công / kỷ luật / trì hoãn / tập trung /
kỹ năng. Học **cách dựng** của các kênh động lực kiểu điện ảnh (không sao chép nội
dung, hình, nhạc hay thương hiệu của kênh nào). Dùng chung pipeline với
`create-template-video` (đọc skill đó cho các quy tắc chung: TTS tiếng Việt viết số
ra chữ, chạy server VieNeu, chạy pipeline).

## ⚠️ Trước khi viết: hỏi user 1 lần

Tên kênh (cho cảnh cuối, có thể bỏ), logo (đường dẫn file, có thể bỏ), có ghi nguồn
không. **Không tự bịa** — trống thì để `""`. Phong cách này mặc định **không có
outro thương hiệu**; chỉ thêm `frame-logo-outro` khi user đưa tên kênh.

## Công thức phong cách (giữ đúng)

| Yếu tố | Cách làm |
| --- | --- |
| Khung | `"aspect": "16:9"` (1920×1080) |
| Thời lượng | 450–600 chữ voiceText ≈ 2–2,5 phút; 12–20 scene, mỗi scene 1 ý (20–40 chữ ≈ 5–10 s) |
| Giọng | VieNeu Thiện Minh, `"voice": { "speed": 1.1 }` (≈ ×1.27 so với gốc — nhanh, liền mạch). Câu đầu vào ngay, không chào hỏi |
| Phụ đề | `"subtitles": { "style": "karaoke", "wordsPerLine": 5, "activeColor": "#FFD400" }` — chữ IN HOA font Anton, trắng, từ đang đọc chuyển vàng và giữ vàng |
| Look | `"look": { "style": "film", "stamp": "'98 6 12" }` — tông ấm phai, viền tối, hạt nhiễu, dấu ngày giờ cam góc trên phải (đổi số tuỳ ý, `""` để ẩn) |
| Hình | MỌI scene dùng `frame-visual-full` với **video stock thật** (`video_query`, chuyển động chậm) + `image_query` làm ảnh dự phòng; không caption (`caption: ""`) vì phụ đề đã có |
| Thuật ngữ | Mỗi khái niệm chính có 1 thuật ngữ tiếng Anh → scene đó đặt `term` (chữ lớn phát sáng, vd "SENSE OF URGENCY") + `term_sub` (nghĩa tiếng Việt, vd "Cảm giác cấp bách") đè lên ảnh |
| Chương | Tuỳ chọn: `kicker` = "Chương 01 · Tiếng ồn"… ở scene mở mỗi phần |
| Nhạc | Nhạc nền cinematic/epic do user cung cấp (`assets/music/…`), `"volume": 0.28`, `"fadeOutSec": 3` — to hơn video thường |

## Kịch bản (5 nhịp)

1. **Hook — gọi tên "kẻ thù"** (scene `hook`, 1 câu dài gây sốc, vào thẳng):
   vd "Căn bệnh tàn độc nhất đang giết chết hàng triệu giấc mơ không phải là thiếu tài năng, mà là lời nói dối mang tên để ngày mai."
2. **Ngộ nhận phổ biến** (1–2 scene): điều mọi người tưởng là đúng.
3. **Sự thật phũ phàng** (1–2 scene): lật ngược ngộ nhận.
4. **3–5 khái niệm** (mỗi khái niệm 2–3 scene): scene đầu có `term` tiếng Anh + nghĩa;
   voiceText đọc cả thuật ngữ rồi giải thích ("Sense of urgency, cảm giác cấp bách. Những người vĩ đại…").
   Các scene sau minh hoạ bằng ảnh, ví dụ đời thường.
5. **Kết — câu hỏi thách thức** (scene cuối, type `outro`): kêu gọi bình luận,
   vd "Mục tiêu nào bạn vẫn luôn để ngày mai? Bạn cam kết làm gì trong hai mươi bốn giờ tới? Viết nó xuống phần bình luận."

**Giọng văn:** xưng "bạn" / "chúng ta"; câu dài nhiều mệnh đề xen câu ngắn đanh;
từ mạnh, kịch tính (tàn độc, giết chết, phũ phàng, chiến binh, kẻ vĩ đại, cái giá phải trả);
không emoji, không liệt kê khô khan. Thuật ngữ tiếng Anh đọc nguyên văn (VieNeu đọc
được tiếng Anh đơn giản; nếu sai thì viết phiên âm).

## Video và ảnh cho look phim

Mỗi scene đặt CẢ HAI:
- `video_query`: tiếng Anh 2–5 từ, "ai + làm gì + ở đâu", cảnh chuyển động chậm có người
  ("man walking alone city night", "woman writing in notebook", "runner at sunrise").
  Pipeline tìm clip trên Pexels/Pixabay Videos (cùng API key với ảnh), cắt/lặp cho vừa câu
  đọc, phủ cho kín khung. `video_pick: 1` để lấy clip khác nếu clip đầu không hợp.
- `image_query`: ảnh dự phòng khi không tìm/tải được video (vd Pixabay đang 429).

Clip stock ngắn hơn câu đọc sẽ tự lặp lại; nên chia câu sao cho mỗi scene ≤ 10 s.
Từ khoá video nên đơn giản hơn ảnh (kho video ít hơn): bỏ tính từ phụ, giữ hành động.
Video tạo bằng AI (Veo, Kling, Runway…) chưa hỗ trợ: các dịch vụ đó đều tính phí theo giây.

### Gợi ý `image_query`

`image_query` tả cảnh điện ảnh, có người, có cảm xúc, ánh sáng mạnh:
"man sitting alone in dark room window light", "woman looking out rainy window",
"climber reaching mountain summit", "old man in armchair thinking",
"hands shaping clay pottery", "runner training at dawn", "empty calendar on desk".
Tránh ảnh studio sáng trắng, ảnh có chữ, ảnh quảng cáo. Mỗi scene 1 ảnh khác nhau.

## script.json mẫu (rút gọn)

```json
{
  "version": "1.0", "renderer": "hyperframes", "aspect": "16:9",
  "metadata": { "title": "...", "source": { "url": "", "domain": "", "image": null }, "channel": "" },
  "voice": { "provider": "vieneu", "speed": 1.1 },
  "music": { "file": "assets/music/default.mp3", "volume": 0.28, "fadeOutSec": 3 },
  "subtitles": { "style": "karaoke", "wordsPerLine": 5, "activeColor": "#FFD400" },
  "look": { "style": "film", "stamp": "'98 6 12" },
  "scenes": [
    { "id": "hook", "type": "hook", "voiceText": "…",
      "templateId": "frame-visual-full",
      "inputs": { "video_query": "old man sitting in armchair", "image_query": "old man sitting in armchair dim room", "icons": ["⏳"], "caption": "", "tone": "warm" } },
    { "id": "c1", "type": "body", "voiceText": "Sense of urgency, cảm giác cấp bách. …",
      "templateId": "frame-visual-full",
      "inputs": { "video_query": "man looking at clock", "image_query": "man looking at clock night", "term": "Sense of urgency", "term_sub": "Cảm giác cấp bách", "kicker": "Chương 01 · Thời gian", "caption": "", "tone": "warm" } },
    { "id": "end", "type": "outro", "voiceText": "Mục tiêu nào bạn vẫn luôn để ngày mai? …",
      "templateId": "frame-visual-full",
      "inputs": { "video_query": "person walking toward sunrise", "image_query": "person walking toward sunrise road", "caption": "", "tone": "warm" } }
  ]
}
```

## Quy trình

1. Hỏi kênh/logo/nguồn (ở trên). 2. Viết script theo 5 nhịp, tự kiểm: 16:9, subtitles
karaoke, look film, mọi scene `frame-visual-full` có `video_query` + `image_query`, `caption: ""`,
3–5 scene có `term`, tổng 450–600 chữ, voiceText viết số ra chữ, không emoji.
3. Ghi `output/<slug>-<timestamp>/script.json`. 4. Chạy pipeline như
`create-template-video` (Step 8). 5. Kiểm tra video/ảnh từng scene (log ghi `video "…" → Pixabay` hoặc `photo …`; Step 8b của skill kia) và
1 khung hình có phụ đề (vd giây 5) — chữ đủ dấu, tô vàng đúng lúc. 6. Báo kết quả.

## Ghi chú

- Phụ đề karaoke ước lượng thời điểm từng từ theo khoảng lặng trong giọng đọc — lệch
  nhẹ là bình thường; nếu lệch nhiều ở 1 scene, tách câu dài thành câu ngắn hơn có dấu phẩy.
- File phụ đề: `subtitles.ass` trong outputDir (mở được bằng Aegisub để chỉnh tay).
- Hiệu ứng whoosh giữa các khái niệm: đặt `"sfx": { "name": "<tên file trong assets/sfx>" }`
  ở scene có `term` nếu đã có thư viện SFX (`npm run sfx:download`).
