---
name: make-video
description: Điểm vào CHUNG khi user chỉ đưa chủ đề, URL hoặc file và nói "làm video", "tạo video về …", "gen video" mà KHÔNG chỉ rõ kiểu. Tự chọn thể loại phù hợp (motion graphics cho kiến thức/mẹo, short tin tức 9:16 dùng hình thật, hoặc phim động lực 16:9) rồi làm video bằng skill tương ứng.
---

# Make Video: tự chọn thể loại rồi làm

User chỉ cần đưa **chủ đề / URL / file**. Skill này chọn thể loại, nói cho user biết
đã chọn gì (1 dòng), rồi làm theo đúng skill của thể loại đó từ đầu đến cuối.

## Bước 1: chọn thể loại

Đi từ trên xuống, gặp dòng nào khớp thì dừng:

| Dấu hiệu trong yêu cầu | Thể loại | Skill |
| --- | --- | --- |
| User nói rõ kiểu: "motion", "chữ chuyển động", "infographic" | Motion graphics | `create-motion-video` |
| User nói rõ: "kiểu ai.money24", "dạng phim", "video dài", "ảnh/video thật" | Phim động lực 16:9 hoặc short hình thật | `create-cinematic-motivation` / `create-template-video` |
| Có URL bài báo, hoặc chủ đề là tin tức / sự kiện / ra mắt sản phẩm / người thật, nơi thật | Short tin tức 9:16, hình thật | `create-template-video` |
| Mẹo, hướng dẫn, kiến thức, "N cách / N điều", so sánh A vs B, số liệu, sức khoẻ, học tập, công nghệ | Motion graphics | `create-motion-video` |
| Động lực, tư duy, kỷ luật, trì hoãn, thói quen, ước mơ, vượt qua nỗi sợ, triết lý sống, thành công | Phim động lực 16:9 | `create-cinematic-motivation` |
| Không rõ | Motion graphics 9:16 (đồng đều, nhanh, không phụ thuộc kho ảnh) | `create-motion-video` |

Khung: "TikTok", "Shorts", "Reels", "dọc" → 9:16; "YouTube", "ngang" → 16:9 (áp cho mọi thể loại).

Chủ đề động lực nhưng user muốn ngắn (≤ 1 phút) → `create-template-video`, tone ấm, có `video_query`.

## Bước 2: báo lựa chọn

Một dòng, rồi làm tiếp ngay (không chờ user đồng ý):
"Chủ đề này hợp **motion graphics dọc 9:16 (~1 phút)**. Muốn bản dùng video/ảnh thật thì nói mình."

## Bước 3: hỏi những gì KHÔNG được tự điền

Theo quy tắc của dự án: **tên kênh, logo, nguồn** phải hỏi user (nếu chưa có trong
cuộc trò chuyện). Hỏi gọn trong 1 tin, 3 dòng đánh số. Không bịa.

## Bước 4: làm theo skill đã chọn

Đọc và làm đúng toàn bộ SKILL.md của thể loại đã chọn (kịch bản, script.json, render,
kiểm tra hình). Mặc định cho mọi thể loại:
- Thể loại dùng hình thật: mỗi scene có cả `video_query` (clip stock chuyển động) và
  `image_query` (ảnh dự phòng). Từ khoá tiếng Anh dạng "ai + làm gì + ở đâu".
- Không tải nhạc có bản quyền; dùng nhạc user cung cấp trong `assets/music/`.

## Bước 5: báo kết quả

Đường dẫn video, thời lượng, dung lượng, số cảnh có video / ảnh / icon, và cảnh nào
hình lệch ý (để user nói "đổi cảnh X").
