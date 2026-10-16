---
name: make-video
description: Điểm vào CHUNG khi user chỉ đưa chủ đề, URL hoặc file và nói "làm video", "tạo video về …", "gen video" mà KHÔNG chỉ rõ kiểu. Tự chọn thể loại phù hợp (short 9:16 tin tức/kiến thức, hoặc phim động lực 16:9) rồi làm video bằng skill tương ứng.
---

# Make Video: tự chọn thể loại rồi làm

User chỉ cần đưa **chủ đề / URL / file**. Skill này chọn thể loại, nói cho user biết
đã chọn gì (1 dòng), rồi làm theo đúng skill của thể loại đó từ đầu đến cuối.

## Bước 1: chọn thể loại

Đi từ trên xuống, gặp dòng nào khớp thì dừng:

| Dấu hiệu trong yêu cầu | Thể loại | Skill |
| --- | --- | --- |
| User nói rõ khung/nền tảng: "YouTube", "ngang", "16:9", "video dài", "kiểu ai.money24", "dạng phim" | Phim động lực 16:9 | `create-cinematic-motivation` |
| User nói rõ: "TikTok", "Shorts", "Reels", "dọc", "9:16", "short" | Short 9:16 | `create-template-video` |
| Có URL bài báo, hoặc chủ đề là tin tức / sự kiện / ra mắt sản phẩm / số liệu | Short tin tức 9:16 | `create-template-video` |
| Mẹo, hướng dẫn, kiến thức, "N cách / N điều", so sánh A vs B, sức khoẻ, công nghệ | Short kiến thức 9:16 | `create-template-video` |
| Động lực, tư duy, kỷ luật, trì hoãn, thói quen, ước mơ, vượt qua nỗi sợ, triết lý sống, thành công | Phim động lực 16:9 | `create-cinematic-motivation` |
| Không rõ | Short 9:16 (rẻ, nhanh, hợp mọi chủ đề) | `create-template-video` |

Chủ đề động lực nhưng user muốn ngắn (≤ 1 phút) → `create-template-video`, tone ấm, có `video_query`.

## Bước 2: báo lựa chọn

Một dòng, rồi làm tiếp ngay (không chờ user đồng ý):
"Chủ đề này hợp **phim động lực 16:9 (~2 phút, phụ đề karaoke, look phim)**. Muốn bản short dọc thì nói mình."

## Bước 3: hỏi những gì KHÔNG được tự điền

Theo quy tắc của dự án: **tên kênh, logo, nguồn** phải hỏi user (nếu chưa có trong
cuộc trò chuyện). Hỏi gọn trong 1 tin, 3 dòng đánh số. Không bịa.

## Bước 4: làm theo skill đã chọn

Đọc và làm đúng toàn bộ SKILL.md của thể loại đã chọn (kịch bản, script.json, render,
kiểm tra hình). Mặc định cho mọi thể loại:
- Mỗi scene ảnh thật có cả `video_query` (clip stock chuyển động) và `image_query`
  (ảnh dự phòng). Từ khoá tiếng Anh dạng "ai + làm gì + ở đâu".
- Không tải nhạc có bản quyền; dùng nhạc user cung cấp trong `assets/music/`.

## Bước 5: báo kết quả

Đường dẫn video, thời lượng, dung lượng, số cảnh có video / ảnh / icon, và cảnh nào
hình lệch ý (để user nói "đổi cảnh X").
