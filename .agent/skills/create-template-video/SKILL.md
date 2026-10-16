---
name: create-template-video
description: Tạo video ngắn 9:16 (tin tức, kiến thức, động lực…) bằng TEMPLATE HyperFrames, ưu tiên HÌNH ẢNH chiếm 80–90% khung hình, từ URL bài báo, file .txt hoặc một chủ đề tiếng Việt. Trigger khi user muốn tạo video tin tức/kiến thức/động lực, làm short, video kiểu template, "tạo video template", "video chuyên nghiệp". Output: video.mp4 + voice.mp3 + script.txt cho CapCut.
---

# Create Template Video Skill

Sinh video 9:16 dùng các template HyperFrames trong `templates/`. Claude chỉ điền
**slot** của template (hình, icon, vài chữ) — toàn bộ thiết kế/animation do template lo.

## ⭐ Nguyên tắc số 1: HÌNH là chính, CHỮ là phụ

Người xem nhớ bằng **hình**, không phải bằng chữ. **Hình ảnh/icon phải chiếm
80–90% khung hình**, chữ trên màn hình chỉ là 1 dòng chú thích ngắn. Thông tin
chi tiết để **giọng đọc** nói, KHÔNG viết ra màn hình.

- **≥ 70% scene body dùng `frame-visual-full`** với **ẢNH THẬT** lấy từ mạng: mỗi scene
  ghi `image_query` (từ khoá tiếng Anh mô tả bức ảnh), pipeline **tự tìm + tải ảnh** phù
  hợp. Icon/emoji chỉ là dự phòng khi không tìm được ảnh — không phải hình chính.
- Chữ hiển thị mỗi scene **≤ 8 từ** (caption). Không đoạn văn, không bullet dài.
- Template nhiều chữ (`frame-aicoding-list`, `frame-aicoding-comparison`,
  `frame-bold-poster`) **tối đa 1 scene mỗi video**, và chỉ khi thật cần. So sánh
  2 thứ → ưu tiên `frame-visual-full` với `layout: "vs"`.
- Mỗi scene chọn 1 hình nói được ý chính: nghe giọng + nhìn hình là hiểu, không cần đọc.

## ⚠️ Nguồn, logo, tên kênh: PHẢI HỎI user trước khi điền

**Không bao giờ tự bịa** dòng "Nguồn: …", logo, tên kênh, URL kênh hay nhãn thương
hiệu (vd "AI Coding", "Senior AI Engineer"). Trước khi viết script, **hỏi user 1 lần**
(gộp trong 1 câu hỏi):

1. Tên kênh (hiện ở outro / footer)? — `metadata.channel`, `brand_name`, `brand_label`, `footer_left`…
2. File logo (đường dẫn ảnh, vd `assets/logo.png`)? — slot `logo`.
3. Có ghi nguồn không, ghi gì? — `primary_url`, `footer_right`, `brand`, `source`…

User trả lời "không"/bỏ qua → **để trống** các slot đó (`""`): template tự ẩn phần
trống. Với bài báo từ URL, chỉ ghi domain bài báo làm nguồn khi user đồng ý.

## Input

1 tham số: URL bài báo (`http://`/`https://`), đường dẫn file `.txt`, HOẶC một chủ đề
(vd "video động lực", "mẹo ngủ ngon") → Claude tự viết nội dung từ kiến thức phổ biến.

## Workflow (theo đúng thứ tự)

### Step 1–3: Lấy nội dung + tạo output dir

Phát hiện input rồi lấy nội dung:

- **URL** (bắt đầu `http://`/`https://`) → `WebFetch` với prompt:
    ```
    Trích xuất từ trang này:
    - title (string): tiêu đề bài báo
    - content (string): nội dung chính, ~500-1500 từ
    - ogImage (string|null): URL ảnh og:image
    - domain (string): domain của URL
    Trả về JSON với 4 field trên.
    ```
    Fail (paywall/JS/4xx) → bảo user lưu nội dung vào `.txt` rồi gọi lại. Stop.
- **File `.txt`** → `Read`; title = dòng đầu (≤80 ký tự), content = phần còn lại, ogImage = `null`, domain = `"local"`.
- slug = ASCII không dấu (bỏ dấu tiếng Việt, đ→d), ≤40 ký tự; timestamp = `YYYYMMDD-HHmm`; `outputDir = output/<slug>-<timestamp>/`; `mkdir -p`.

### Step 4: Đọc danh mục template

Đọc `templates/CATALOG.md` để biết template nào có + slot inputs của mỗi cái.
**Chỉ dùng templateId có trong CATALOG.** Hiện có:

**HOOK (chỉ 1):**
- `frame-visual-full` — **ưu tiên**: 1 ảnh thật gây tò mò (`image_query`) + câu hook ngắn.
- `frame-liquid-bg-hero` — hero aurora (blob động + headline ngắn) khi hook là 1 câu hỏi mạnh, không có hình hợp.

**BODY (Claude tự chọn theo nội dung — xem Step 5):**
- `frame-visual-full` — **MẶC ĐỊNH cho body**: ảnh thật toàn màn hình (Ken Burns), tự tìm theo `image_query`; chữ chỉ 1 caption ngắn ở đáy. Icon khổng lồ chỉ hiện khi không có ảnh.
- `frame-vignelli` — 1 con số nền tối charcoal + đỏ.
- `frame-pentagram-stat` — 1 con số nền tối neon (Swiss grid, số cam phát sáng + accent cyan + biểu đồ cột).
- `frame-bold-poster` — tuyên bố mạnh nhiều dòng + figure số lớn.
- `frame-build-minimal` — câu chốt mạnh nền tối (1 từ lớn IN ĐẬM, glow cam, reveal từng chữ).
- `frame-creative-voltage` — câu sáng tạo/khẩu hiệu, split xanh điện + chữ viết tay.
- `frame-glitch-title` — cyberpunk glitch RGB-split (nền nhiễu) — hợp tin sốc/breaking/công nghệ.
- `frame-aicoding-list` — **DANH SÁCH** 2–5 mục (mỗi mục có icon + tag mức độ), nền tối gradient. Dùng khi scene là list/xếp hạng.
- `frame-aicoding-comparison` — **SO SÁNH 2 thứ** (cũ vs mới, A vs B) — 2 card khung gradient + badge WIN + stat. Dùng khi scene đối đầu/đối chiếu.

**OUTRO:**
- `frame-logo-outro` — mặc định (logo glow + tên + tagline + url).
- `frame-statement-outro` — thay thế (card đỏ nền giấy).
- `frame-logo-outro` — **outro mặc định** / end-card thương hiệu (logo glow + tên + tagline + url).
- `frame-statement-outro` — outro thay thế (card đỏ trên nền giấy).

### Step 5: Sinh script.json (template mode)

Cấu trúc bắt buộc:

```json
{
    "version": "1.0",
    "renderer": "hyperframes",
    "aspect": "9:16",
    "metadata": {
        "title": "...",
        "source": { "url": "...", "domain": "...", "image": null },
        "channel": "<tên kênh user đưa, hoặc \"\">"
    },
    "voice": { "provider": "vieneu", "speed": 1.0 },
    "scenes": [
        /* 8–12 scene: 1 hook + 6–10 body + 1 outro */
    ]
}
```

- `music` (tuỳ chọn): nhạc nền lồng dưới giọng đọc — `{ "file": "assets/music/<tên>.mp3", "volume": 0.15, "fadeOutSec": 2 }`. Bỏ trống → dùng `assets/music/default.mp3` nếu có; `"file": "none"` để tắt. Nhạc tự lặp cho đủ độ dài, tự hạ nhỏ khi có giọng, fade in/out. Video buồn/cảm xúc → volume 0.12–0.18; video sôi động → 0.18–0.25. **Không tự tải nhạc từ YouTube/Zing/Spotify** (nhạc có bản quyền) — chỉ dùng file user cung cấp hoặc nhạc miễn phí bản quyền.
- `speed`: hệ số nhân tốc độ đọc trên nền mặc định của server (`VIENEU_SPEED`, mặc định 1.15 — nhịp tự nhiên cho video ngắn). Để `1.0`; chỉ tăng (vd 1.1) khi muốn nhanh hơn nữa.
- `provider`: `vieneu` (mặc định — VieNeu-TTS, giọng **Thiện Minh**, nam miền Bắc, giọng kể chuyện). Giọng do server quyết định (`VIENEU_VOICE`), không cần `voiceId`/API key. `omnivoice` chỉ dùng khi user yêu cầu (đặt `TTS_PROVIDER=omnivoice` trong `.env.local`).
- Mỗi scene: `{ id, type, voiceText, templateId, inputs }`. `inputs` khớp slot trong CATALOG.
- scenes[0].type = `hook`; scene cuối .type = `outro` (templateId = `frame-logo-outro`).
- **8–12 scene**; tổng voiceText ~270–360 từ (~90–120s) — **GIỮ NGUYÊN tổng thời lượng**, chỉ chia nhỏ ra NHIỀU scene hơn cho nhịp nhanh, đỡ nhàm. Mỗi body scene **~25–40 từ** (mỗi scene chỉ 1 ý duy nhất — nếu 1 đoạn có 2 ý thì TÁCH thành 2 scene thay vì nhồi vào 1). Mục tiêu: mỗi scene xuất hiện trên màn hình chỉ ~6–10s rồi chuyển cảnh.

**Map nội dung → template:**

- hook → **ưu tiên `frame-visual-full`** (1 icon/ảnh cực lớn + caption hook ngắn), hoặc `frame-liquid-bg-hero` (slots: kicker, headline, subheadline, cta, brand, logo, brand_label; `headline` ≤ 6 từ, gradient tuỳ chỉnh qua `headline_from`/`headline_to`). `kicker`/`brand`/`logo`/`brand_label` chỉ điền khi user đã cung cấp.
- **body → mặc định `frame-visual-full`** (≥ 70% scene body). Slots: `image_query`, `image`, `image_pick`, `icons[]`, `layout`, `labels[]`, `caption`, `kicker`, `tone`:
    - `image_query` (**bắt buộc mỗi scene**): **3–6 từ tiếng Anh theo dạng "ai + đang làm gì + ở đâu"**, tả đúng hành động chính nhìn thấy được — vd "person using phone at night", "tired man at desk", "runner on beach sunrise", "woman reading book". Thiếu hành động (vd "phone bed night") dễ ra ảnh tạo dáng sai ý. Tránh từ trừu tượng ("motivation", "success") và tên riêng dễ nhầm. Pipeline tự tìm ảnh dọc (9:16) qua **Pexels/Pixabay** (cần `PEXELS_API_KEY` hoặc `PIXABAY_API_KEY` miễn phí trong `.env.local` — **nên có**, ảnh stock khớp nội dung), không có key nào thì mới dùng Wikimedia Commons (tự rút ngắn từ khoá; ảnh hay lệch chủ đề). Có key mà Pixabay báo bận (429) thì pipeline tự chờ và thử lại; vẫn lỗi thì giữ icon chứ không lấy ảnh sai ý. Ảnh tìm được + nguồn ghi vào `image-credits.txt` trong outputDir; ảnh tải về được cache theo từ khoá ở `output/.image-cache/` nên render lại không gọi API nữa.
    - Chưa có key Pexels/Pixabay → **nhắc user đăng ký key miễn phí** trước khi render.
    - `image_pick` (tuỳ chọn, mặc định 0): lấy kết quả thứ n nếu ảnh đầu không hợp (xoá `clips/scene-<id>.mp4` rồi chạy lại).
    - `image`: đường dẫn file hoặc URL ảnh cụ thể (file user đưa, `og:image` bài báo) — có `image` thì bỏ qua `image_query`. Tải lỗi / không tìm được → tự dùng `icons`.
    - `icons` (dự phòng, vẫn nên điền): 1–3 emoji to (📱 💡 😴 🔥 🧠 💪 ⏰ 📈 …) — Claude TỰ CHỌN emoji nói đúng ý. `layout`: `single` (1 icon khổng lồ), `flow` (2–3 icon nối mũi tên = nguyên nhân → kết quả / các bước), `vs` (2 icon đối đầu, `labels` = tên 2 vế, ≤ 10 ký tự). Có `image` thì chỉ hiện ảnh; `icons` là phương án dự phòng khi ảnh tải lỗi (nên luôn điền).
    - `caption`: **≤ 8 từ**, bọc `*từ khoá*` để tô màu nhấn. `kicker`: nhãn nhỏ tuỳ chọn (vd "Mẹo 1", ≤ 16 ký tự).
    - `tone`: nền khi không có ảnh — `blue` / `warm` / `green` / `purple` / `red` / `dark`; đổi tone giữa các scene cho đỡ nhàm.
- Chỉ khi scene thật sự là **1 con số** hoặc **1 từ chốt**, có thể xen 1–2 scene template chữ dưới đây (giữ chữ cực ngắn):
    - `frame-vignelli` — scene có **1 con số/stat** muốn nhấn mạnh, tông tối charcoal + đỏ. Slots: kicker, number, label, note, brand.
    - `frame-pentagram-stat` — scene có **1 con số/benchmark**, nền tối neon (Swiss grid, số cam phát sáng + accent cyan) + biểu đồ cột. Slots: label, headline (số), subtitle, anchor, footer_left, footer_right.
    - `frame-build-minimal` — **câu chốt/nhận định ngắn** xoay quanh 1 từ khoá, nền tối + 1 từ lớn in đậm glow cam. Slots: eyebrow, hero (1 từ), desc, side_left, side_right.
    - `frame-bold-poster` — **tuyên bố mạnh nhiều dòng** + figure số lớn. Slots: kicker, date, figure, headline[], standfirst, footer_left, footer_right.
    - `frame-creative-voltage` — **câu sáng tạo/khẩu hiệu** (vài từ), split xanh điện + viết tay. Slots: meta, display_lines, accent_index, script, caption.
    - `frame-glitch-title` — **tin sốc/breaking/công nghệ** kiểu cyberpunk glitch. Slots: title, subtitle.
    - `frame-aicoding-list` — **scene là DANH SÁCH / SO SÁNH 2–5 mục** (ai bị ảnh hưởng, ưu/nhược, các bậc, checklist). Slots: title, accent, accent_from, accent_to, subtitle, items[]. Mỗi item `{icon, title, desc, tag, level}`:
        - `icon`: Claude TỰ CHỌN emoji hợp từng mục (🚫 ⚠️ ✅ ❌ 📈 💡 🔒 🚀 …), KHÔNG cố định.
        - `level`: `danger`/`warn`/`good`/`info` → quyết định màu icon+tag+thanh. `tag`: nhãn ngắn (Nguy/Cao/Lợi…).
        - `accent_from`/`accent_to`: Claude TỰ CHỌN 2 màu hex cho gradient chữ nhấn (hợp tông bài), vd cam→đỏ, tím→lam, xanh lá.
    - `frame-aicoding-comparison` — **scene SO SÁNH ĐÚNG 2 thứ** (cũ vs mới, A vs B, trước/sau). Slots: badge, pre, vs, post, left{}, right{}. Mỗi vế `{label, from, to, icon?, bullets[], stat?, stat_label?, win?}`:
        - `from`/`to`: Claude TỰ CHỌN 2 màu hex gradient cho mỗi vế (thường 2 vế khác tông, vd trái cam→đỏ, phải teal→lam).
        - `icon`: emoji tuỳ chọn cho mỗi vế. `win: true` cho vế thắng (viền sáng + badge WIN). `stat`/`stat_label`: số liệu tuỳ chọn dưới mỗi card.
    - Gợi ý cân bằng: nếu nhiều scene đều là số, xen kẽ `frame-vignelli` (than + đỏ/vàng) và `frame-pentagram-stat` (tối neon cam/cyan) cho đỡ đơn điệu; chèn `frame-build-minimal` cho scene không-số.
- outro → `frame-logo-outro` (mặc định; slots: brand_name, tagline, primary_url, logo, brand_label). Dùng `frame-statement-outro` nếu muốn card đỏ nền giấy. **Tên kênh, logo, URL/nguồn lấy từ câu trả lời của user** — không có thì để `""`.

### ⚠️ Quy tắc TTS tiếng Việt (BẮT BUỘC cho `voiceText`)

`voiceText` được VieNeu-TTS (giọng Thiện Minh) đọc to. **Số và ký
hiệu bị đọc theo nghĩa đen** — vd "5.5" có thể thành "năm rưỡi" (sai cho số phiên
bản). Vì vậy **luôn viết số ra chữ tiếng Việt trong `voiceText`**. Còn `inputs`
(chữ hiển thị trên màn hình) thì GIỮ định dạng số đẹp ("5.5" / "82.7%").

Bảng đầy đủ (áp dụng cho `voiceText`):

| Dạng số                  | SAI (TTS đọc nhầm)             | ĐÚNG (viết ra chữ)                                          |
| ------------------------ | ------------------------------ | ---------------------------------------------------------- |
| Phiên bản thập phân      | `GPT 5.5` → "năm rưỡi"         | `GPT năm chấm năm`                                         |
| Số liệu thập phân        | `82.7%`                        | `tám mươi hai phẩy bảy phần trăm`                          |
| Phiên bản số nguyên      | `iPhone 17`                    | `iPhone mười bảy` (hoặc `iPhone 17` cũng được)             |
| Phiên bản có chấm        | `iOS 18.2`                     | `iOS mười tám chấm hai`                                    |
| Thông số kỹ thuật        | `200MP`                        | `hai trăm megapixel`                                       |
| Pin                      | `5000mAh`                      | `năm nghìn miliampe giờ`                                   |
| Token                    | `1M tokens`                    | `một triệu token`                                         |
| Giá VND                  | `21 triệu đồng`                | `hai mươi mốt triệu đồng`                                  |
| Giá USD                  | `$5`                           | `năm đô la` (hoặc `năm đô`)                                |
| Bội số                   | `2x`                           | `gấp đôi` (tự nhiên hơn "hai lần")                         |
| Phần trăm                | `30%`                          | `ba mươi phần trăm`                                        |
| Thời gian                | `60 giây`                      | `sáu mươi giây`                                            |
| Tỉ lệ                    | `3:1`                          | `ba trên một` / `ba so với một`                           |

- Dấu thập phân: dùng `chấm` (nói tự nhiên) hoặc `phẩy` (trang trọng) — chọn nhất quán.
- Acronym tiếng Anh: `AI`/`GPT` thường OK; nếu đọc sai thì viết phiên âm `ây ai` / `gí pi tí`, `API` → `ây pi ai`.
- **`voiceText` TUYỆT ĐỐI KHÔNG có emoji/icon, không có URL** và không có `→ & % $ # + =` (giọng đọc sạch). Brand (Apple, OpenAI, TikTok) giữ nguyên. Kết câu bằng `.` hoặc `?` để có ngắt nghỉ tự nhiên.
- **`inputs` (chữ HIỂN THỊ trên màn hình) ĐƯỢC PHÉP dùng emoji/icon** để sinh động (🔥 🚀 ✨ ⚡ 📈 ⚠️ → …) — render màu OK. Giữ định dạng số đẹp ("5.5", "82%"). Tách biệt hoàn toàn với voiceText.
  - Dùng emoji **vừa phải** (0–1 icon mỗi field, đặt ở nhãn/headline/CTA ngắn — vd kicker "🔥 Tin nóng", cta "Theo dõi ngay →"). ĐỪNG nhét emoji vào chữ lớn pop từng ký tự (vd `hero` của build-minimal) vì sẽ vỡ animation.

### Step 6: Tự kiểm tra

- scenes[0]=hook, scene cuối=outro; mỗi templateId ∈ CATALOG; mỗi inputs đủ slot bắt buộc;
- ≥ 70% body là `frame-visual-full` và **mỗi scene đó có `image_query`** (tiếng Anh, tả cảnh cụ thể); mỗi caption ≤ 8 từ; không scene nào là đoạn văn trên màn hình;
- slot nguồn/logo/kênh chỉ chứa đúng điều user đã trả lời (không thì `""`); không có nhãn "9:16"/"16:9" trên màn hình;
- headline ≤3 dòng & mỗi dòng ngắn; `hero` của `frame-build-minimal` ≤ 2 từ ngắn (vd "BẮT ĐẦU", "KỶ LUẬT") — template tự co chữ cho vừa và chỉ xuống dòng giữa các từ; voiceText đã viết số ra chữ **và KHÔNG chứa emoji/icon**; emoji (nếu có) chỉ nằm trong `inputs`. Sửa thầm tối đa 2 lần.

### Step 7: Ghi script.json

Dùng tool `Write` ghi `<outputDir>/script.json`.

### Step 8: Chạy pipeline

Trước tiên đảm bảo server giọng đọc VieNeu-TTS đang chạy (mặc định `http://127.0.0.1:8124`):

```bash
curl -s -o /dev/null -w "%{http_code}" -X POST http://127.0.0.1:8124/tts -H "Content-Type: application/json" -d '{"text":"thử"}'
```

Nếu không trả về `200` → khởi động server ở chế độ **background** rồi đợi đến khi lệnh trên trả `200` (lần đầu tải model mất vài phút):

```bash
python tools/vieneu_server.py   # cần: pip install vieneu (Python 3.10–3.12) + ffmpeg
```

Sau đó chạy pipeline bằng Bash **foreground**, stream output:

```bash
npm run pipeline -- <outputDir>/script.json
```

CLI tự nhận `renderer: "hyperframes"` và chạy template pipeline (TTS → render
từng template → fit theo giọng đọc → ghép + trộn SFX). Lỗi → báo rõ + đường dẫn outputDir.

### Step 8b: Kiểm tra ảnh

Mở `image-credits.txt` và xem 1 khung hình mỗi cảnh (vd `ffmpeg -ss 3 -i clips/scene-<id>.mp4 -frames:v 1 preview-<id>.png`). Ảnh lệch chủ đề hoặc không phù hợp (nhạy cảm, quảng cáo, chữ lạ) → đổi `image_query` hoặc tăng `image_pick`, xoá `clips/scene-<id>*.mp4` rồi chạy lại pipeline.

### Step 9: Báo kết quả

```markdown
✓ Video: [video.mp4](output/<slug>/video.mp4)
✓ Audio: [voice.mp3](output/<slug>/voice.mp3) — cho CapCut
✓ Script: [script.txt](output/<slug>/script.txt) — cho CapCut auto-caption
Tổng thời lượng: XX.Xs
```

## Ghi chú

- Logo/ảnh: slot `image` và `logo` nhận đường dẫn file hoặc URL; pipeline tự nhúng vào lúc render (không cần copy vào thư mục template).
- Render mỗi scene ~15–20s (Chromium). Video 8–10 scene ~3–5 phút. Cần ffmpeg + Chrome (đã có).
- Nhạc nền chỉ có trong `video.mp4` (file trung gian `audio-final.mp3`); `voice.mp3` vẫn là giọng + SFX cho CapCut.
- Đổi giọng: đặt `VIENEU_VOICE` (vd `"Hải Đăng"`, `"Mai Anh"`) khi chạy `tools/vieneu_server.py` hoặc trong `.env.local`; 25 giọng có sẵn xem README VieNeu-TTS. Xoá `voice/scene-*.mp3` để đọc lại bằng giọng mới.
- TTS idempotent (giữ `voice/scene-*.mp3`); clip cũng idempotent (giữ `clips/scene-*.mp4`) — xoá để render lại sau khi sửa inputs.
- Thêm template mới: làm theo mục cuối `templates/CATALOG.md` rồi bổ sung 1 dòng vào catalog.
