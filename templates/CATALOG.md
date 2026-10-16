# Template Catalog (HyperFrames, renderer: "hyperframes")

Each scene in a template-mode `script.json` names a `templateId` below and fills
`inputs` with the listed slots. The template owns all visual design; you only
write text. Keep text SHORT — these are poster layouts, not paragraphs.

**Visual first:** images/icons should fill 80–90% of the frame. Use
`frame-visual-full` for most body scenes; the narration carries the detail.
Brand/source/logo slots are filled only with what the user gave — leave them
`""` otherwise (templates hide empty brand bars, chips and URL lines).

Render aspect is set once per script (`"aspect": "9:16"` for TikTok/Shorts).

> Vietnamese: visual text (inputs) keeps normal formatting ("5.5", "82.7%").
> Only `voiceText` must spell numbers out phonetically (see the skill rules).
> Emoji/icons (🔥 🚀 → …) are allowed in on-screen `inputs` (they render in colour),
> but NEVER in `voiceText`. Don't put emoji in char-by-char animated fields
> (e.g. `hero` of build-minimal).

---

## frame-motion

**Role:** body or hook for **motion-graphics** videos (no photos, no stock footage):
everything is drawn and animated in code with a GSAP timeline: kinetic headline
(words rise out of masks, `*phrase*` gets a marker sweep), counters, icon lists,
A-vs-B cards, drifting glow + grid background. Build → breathe → resolve; the
pipeline stretches it to the scene length, so it never freezes. 16:9 and 9:16.
**Best for:** knowledge, tips, lists, numbers, comparisons ("5 cách…", "25 phút", "A hay B").

| slot       | type     | limit       | notes                                                                      |
| ---------- | -------- | ----------- | -------------------------------------------------------------------------- |
| `kind`     | string   | enum        | `title` (icon + headline) · `number` (counter + unit + bar) · `list` (2–4 rows) · `compare` (two cards + VS) · `quote` |
| `headline` | string   | ≤7 words    | main line; wrap `*a phrase*` for the marker highlight                       |
| `kicker`   | string   | ≤20         | pill on top (e.g. "Cách 1 · Pomodoro"); also the faint giant background word |
| `label`    | string   | ≤12 words   | small supporting line under everything (optional)                          |
| `icon`     | string   | 1 emoji     | `title`: big icon that pops in and floats                                  |
| `number`   | string   | digits      | `number`: counts up from 0 (e.g. "25", "2,5")                              |
| `unit`     | string   | ≤8          | `number`: word after the number (e.g. "phút", "%")                         |
| `percent`  | number   | 0–100       | `number`: how full the progress bar gets (default 100)                     |
| `items`    | object[] | 2–4         | `list`: `{ "icon": "⏱️", "text": "Pomodoro" }`, text ≤4 words              |
| `left` / `right` | object | —       | `compare`: `{ "icon", "title" (≤3 words), "text" (≤6 words) }`; left = the wrong/old way (struck through), right = the better way |
| `tone`     | string   | enum        | `blue` · `warm` · `green` · `purple` · `red` · `dark` — change it between scenes |

---

## frame-visual-full

**Role:** body (default) or hook. The visual fills ~85% of the frame: either a
full-bleed photo with a slow Ken Burns zoom, or (no photo) 1–3 giant emoji icons on a
coloured radial background. Text is one short caption at the bottom.
**Best for:** almost every body beat — show the idea, let the voice explain it.
Renders 7 s of motion, so it stays alive for long narration.

| slot      | type     | limit       | notes                                                                      |
| --------- | -------- | ----------- | -------------------------------------------------------------------------- |
| `image_query` | string | 3–6 words | English "who + doing what + where" (e.g. "person using phone at night") describing a photo — the pipeline searches Pexels/Pixabay (free API key) or else Wikimedia, and fills `image`. Use on every scene |
| `image_pick`  | number | ≥0        | take the n-th search result instead of the first (optional)                |
| `video_query` | string | 2–5 words | English "who + doing what" for a stock VIDEO clip (Pexels/Pixabay Videos, same keys). Wins over the photo: the clip is cropped to fill, looped/trimmed to the scene, and played full-frame under the term/kicker/caption. Falls back to `image_query`/icons when nothing is found |
| `video_pick`  | number | ≥0        | take the n-th video result (optional)                                      |
| `video`       | string | path      | explicit local .mp4 instead of searching (optional)                        |
| `image`   | string   | path / URL  | explicit photo (local file or http(s)); overrides `image_query`. Optional   |
| `icons`   | string[] | 1–3 emoji   | giant illustration; ignored when an `image` is shown (fallback if it fails) |
| `layout`  | string   | enum        | `single` · `flow` (A → B → C) · `vs` (two sides + VS badge)                 |
| `labels`  | string[] | ≤10 each    | label under each icon (handy for `vs`)                                      |
| `caption` | string   | ≤8 words    | bottom caption; wrap `*a word*` to highlight it                             |
| `kicker`  | string   | ≤16         | small pill on top (optional, e.g. "Mẹo 1")                                  |
| `term`    | string   | ≤24         | big glowing concept word, centred (e.g. "Sense of urgency"); replaces icons |
| `term_sub`| string   | ≤32         | small translation under `term` (e.g. "Cảm giác cấp bách")                  |
| `tone`    | string   | enum        | `blue` · `warm` · `green` · `purple` · `red` · `dark` (background colour)   |

---

## frame-bold-poster

**Role:** hook / strong statement. 1970s editorial poster — giant red figure,
3-line tilted headline (middle line auto-red), serif standfirst.
**Best for:** the opening hook, or a punchy single-claim body beat.

| slot           | type     | limit                    | notes                                                |
| -------------- | -------- | ------------------------ | ---------------------------------------------------- |
| `kicker`       | string   | ≤24                      | small uppercase label, top-left (e.g. "AI Coding")   |
| `date`         | string   | ≤24                      | top-right metadata (e.g. "12 · 06 · 2026")           |
| `figure`       | string   | ≤4                       | giant red figure — a number/stat (e.g. "5.5", "200") |
| `headline`     | string[] | ≤3 lines, ≤14 chars/line | line 2 renders red                                   |
| `standfirst`   | string   | ≤160                     | italic serif sub-line                                |
| `footer_left`  | string   | ≤32                      | channel name                                         |
| `footer_right` | string   | ≤32                      | source domain (renders red)                          |

---

## frame-statement-outro

**Role:** outro / closing CTA. Paper card: red rule, CTA, giant red channel
name, muted source, ink rule.
**Best for:** the final scene (always `type: "outro"`).

| slot      | type   | limit | notes                                                                  |
| --------- | ------ | ----- | ---------------------------------------------------------------------- |
| `cta`     | string | ≤60   | uppercase call-to-action (e.g. "Theo dõi để xem bản tin mới mỗi ngày") |
| `channel` | string | ≤24   | channel name (giant red)                                               |
| `source`  | string | ≤40   | "Nguồn: <domain>"                                                      |

---

## frame-pentagram-stat

**Role:** body / stat. Swiss-grid data anchor on a **dark neon** canvas
(`#0a0c12` + blue ambient glow) — giant glowing amber number, cyan eyebrow label,
faint oversized cyan number bleeding off the right, a small bar chart (cyan hero
bar), dark footer bar with a cyan rule.
**Best for:** a single hero statistic / benchmark / percentage with a premium,
high-tech dark look.

| slot           | type   | limit | notes                                                      |
| -------------- | ------ | ----- | ---------------------------------------------------------- |
| `label`        | string | ≤40   | small cyan uppercase eyebrow (e.g. "Hiệu năng · Coding")   |
| `headline`     | string | ≤12   | the giant glowing amber stat (e.g. "82%", "1M", "200")     |
| `subtitle`     | string | ≤120  | one supporting sentence under the stat                     |
| `anchor`       | string | ≤4    | faint giant number behind it (usually = the stat's digits) |
| `footer_left`  | string | ≤32   | channel name (on the dark footer bar)                      |
| `footer_right` | string | ≤32   | source domain                                              |

---

## frame-build-minimal

**Role:** body / bold statement. Dark cinematic canvas (`#0b0a09` + a warm amber
ambient glow) — one **big bold word** revealed letter-by-letter (glowing warm
white), an amber eyebrow, an amber hairline, a two-line description, rotated side
labels.
**Best for:** a punchy single-concept beat (a verdict, a theme, a turning point)
with a premium dark/amber look.

| slot         | type   | limit | notes                                                         |
| ------------ | ------ | ----- | ------------------------------------------------------------- |
| `eyebrow`    | string | ≤20   | small uppercase label above the word                          |
| `hero`       | string | ≤10   | ONE short word/phrase (revealed char-by-char — keep it short) |
| `desc`       | string | ≤90   | one supporting sentence below                                 |
| `side_left`  | string | ≤20   | rotated label on the left edge (e.g. channel)                 |
| `side_right` | string | ≤20   | rotated label on the right edge                               |

---

## frame-vignelli

**Role:** body / bold stat hero. Massimo Vignelli editorial — **dark charcoal**
canvas, a single red accent column on the right, 6-column grid, a giant white
number, uppercase label, footer wordmark with red underline.
**Best for:** a striking single statistic when you want a dark, high-contrast
beat (variety vs the white/paper templates).

| slot     | type   | limit | notes                                                            |
| -------- | ------ | ----- | ---------------------------------------------------------------- |
| `kicker` | string | ≤30   | small uppercase label next to a red bar (e.g. "Khảo sát · 2026") |
| `number` | string | ≤6    | the giant white stat (e.g. "62%", "3/4", "1M")                   |
| `label`  | string | ≤40   | uppercase white label under the number (≤2 short lines)          |
| `note`   | string | ≤120  | one muted supporting sentence                                    |
| `brand`  | string | ≤24   | footer wordmark (channel name)                                   |

---

## frame-logo-outro

**Role:** outro / brand end-card (**default outro**). Deep-violet radial canvas,
a glowing segmented logo mark that assembles in, brand name with a shimmer
sweep, tagline, and a footer URL.
**Best for:** the final scene (`type: "outro"`) — a polished brand sign-off.

| slot          | type   | limit | notes                                                       |
| ------------- | ------ | ----- | ----------------------------------------------------------- |
| `brand_name`  | string | ≤60   | channel/brand name (big, shimmering)                        |
| `tagline`     | string | ≤120  | one line under the name                                     |
| `primary_url` | string | ≤40   | footer URL / source — only what the user gave, else `""` (hidden) |
| `logo`        | string | path / URL | channel logo for the top brand bar (portrait) — only if the user gave one |
| `brand_label` | string | ≤24   | text next to the logo — only if the user gave it              |
| `corner_left` / `corner_right` | string | ≤20 | small corner labels (16:9 only), optional             |

---

## frame-liquid-bg-hero

**Role:** hook / hero (**default hook**). "Aurora Violet" — deep-indigo canvas
with large soft floating colour blobs + faint grid; a centred white headline,
subheadline and a rounded CTA pill.
**Best for:** the opening hook (`type: "hook"`) — a modern, premium intro.

| slot          | type   | limit | notes                                              |
| ------------- | ------ | ----- | -------------------------------------------------- |
| `kicker`        | string | ≤24  | small uppercase label, top-left (empty → chip hidden)         |
| `headline`      | string | ≤60  | the hook line (keep punchy, ~2 short lines) — shown in a vivid gradient |
| `headline_from` | string | hex  | headline gradient start (optional; default vivid gold→purple) |
| `headline_to`   | string | hex  | headline gradient end (optional)                              |
| `subheadline`   | string | ≤120 | one supporting sentence                                       |
| `cta`           | string | ≤24  | rounded pill label (e.g. "Theo dõi ngay")                    |
| `brand`         | string | ≤24  | footer-left label (channel/source) — only if the user gave it |
| `logo`          | string | path / URL | channel logo in the top brand bar (portrait), optional  |
| `brand_label`   | string | ≤24  | text next to the logo, optional                               |

> Headline renders in an eye-catching gradient (default gold→orange→pink→purple).
> Override with `headline_from`/`headline_to` to fit the tone if you want.

---

## frame-creative-voltage
**Role:** hook / creative statement (alternative). Electric split — an electric-
blue panel (mono meta + a handwritten script accent + hand-drawn underline) and
a dark panel with a stacked display title, one line outlined in electric blue.
Bold, energetic, design-forward.
**Best for:** a punchy hook or a strong creative body statement (a few short words).

| slot            | type     | limit            | notes                                                            |
| --------------- | -------- | ---------------- | ---------------------------------------------------------------- |
| `meta`          | string   | ≤40              | mono label on the blue panel (e.g. "// CHE_DO_SANG_TAO · ON")    |
| `display_lines` | string[] | ≤4 lines, short  | the big title, one line per word/phrase                          |
| `accent_index`  | number   | 0-based          | which `display_lines` line gets the electric blue outline (default 1) |
| `script`        | string   | ≤20              | handwritten accent on the blue panel (Dancing Script)            |
| `caption`       | string   | ≤60              | mono caption, bottom-right                                       |

---

## frame-glitch-title
**Role:** hook / cyberpunk glitch (alternative). Dark signal-noise canvas —
scanlines, grid, grain, vignette, mono "REC"/timecode chrome, and a big title
with a cyan×magenta RGB-split glitch. High-energy, edgy.
**Best for:** a dramatic/breaking or tech hook (a short shouty title).

| slot       | type   | limit | notes                                                  |
| ---------- | ------ | ----- | ------------------------------------------------------ |
| `title`    | string | ≤40   | the big glitch title (short; uppercased automatically) |
| `subtitle` | string | ≤80   | mono line under the title                              |

---

## frame-aicoding-list
**Role:** body / list · comparison (original). Dark canvas with a warm gradient
glow, a big gradient-accent title + subtitle, then a stack of rounded item cards
— each with a coloured icon chip, title + description, and a coloured level tag.
**Best for:** any scene that is a **list / ranking / comparison of 2–5 items**
(who's affected, pros vs cons, tiers, a checklist).

| slot       | type     | limit       | notes                                                        |
| ---------- | -------- | ----------- | ------------------------------------------------------------ |
| `title`       | string   | ≤40       | big headline (text before the accent)                          |
| `accent`      | string   | ≤20       | trailing word shown in a gradient (optional)                   |
| `accent_from` | string   | hex       | gradient start colour for `accent` (optional; default `#ff9a3d`) |
| `accent_to`   | string   | hex       | gradient end colour for `accent` (optional; default `#ff2d55`)   |
| `subtitle`    | string   | ≤60       | muted line under the title                                     |
| `items`       | object[] | 2–5 items | each: `{ icon, title, desc, tag, level }`                      |

Each `items[]` entry:
- `icon` — **you choose** an emoji that fits the item (🚫 ⚠️ ✅ 🔴 📈 ❌ 💡 🔒 🚀 …), shown in a tinted chip. Not fixed.
- `title` — bold item name (≤24). `desc` — small muted line (≤40).
- `tag` — short right-hand label (≤6, e.g. "Nguy", "Cao", "Lợi").
- `level` — `danger` (red) · `warn` (amber) · `good` (green) · `info` (blue); sets the icon/tag/bar colour.

> The accent gradient colours (`accent_from`/`accent_to`) are free to choose to fit the tone
> (e.g. warm `#ff9a3d`→`#ff2d55`, cool `#7c5cff`→`#22d3ee`, green `#34d399`→`#22c55e`).

---

## frame-aicoding-comparison
**Role:** body / head-to-head comparison (original). Dark canvas with a teal
glow, a pill badge, a "X vs Y" headline with two differently-coloured gradient
sides, two framed cards (big gradient label + bullets, a WIN badge on the winner)
and an optional stat row.
**Best for:** comparing **two things** (old vs new, A vs B, before vs after).

| slot       | type   | limit | notes                                                            |
| ---------- | ------ | ----- | ---------------------------------------------------------------- |
| `badge`    | string | ≤16   | pill label (e.g. "Đối đầu", "HEAD TO HEAD")                      |
| `pre`      | string | ≤16   | plain word before the left side in the headline (optional)       |
| `vs`       | string | ≤6    | middle word (default "vs")                                       |
| `post`     | string | ≤16   | plain word after the right side in the headline (optional)       |
| `left`     | object | —     | left side (see below)                                            |
| `right`    | object | —     | right side (see below)                                           |

Each side (`left` / `right`) object:
- `label` — short name (≤8, e.g. "LMS", "AI") shown gradient in the headline + big on the card.
- `from` / `to` — **caller-chosen** gradient hex for that side (e.g. left warm `#ffb020`→`#ff7a3d`, right teal `#34e0c0`→`#22d3ee`).
- `icon` — optional emoji shown above the card label.
- `bullets` — array of short lines (use "/" inside a line, e.g. "Khoá cố định / lộ trình tuyến tính").
- `stat` + `stat_label` — optional stat chip under the card (e.g. "88%" + "Ưa nền tảng mới").
- `win` — `true` (or a custom badge string) marks the winning side (teal border + WIN badge).

---

## Adding a template

Drop a folder `templates/<id>/` with `index.html` (16:9 root, `data-composition-id`),
`compositions/portrait.html` (9:16), `hyperframes.json`, `meta.json`, and a
`NOTICE.md` if vendored. Use a Vietnamese-capable font stack (Alfa Slab One /
Lora / Be Vietnam Pro are known-good). Then add a row here.
