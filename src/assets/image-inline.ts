import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { extname, isAbsolute, join, resolve } from "node:path";
import { fetchImage, fetchVideo } from "./image-fetcher.js";
import { creditAuthor, searchImage, searchVideo, type Orientation } from "./image-search.js";
import { log } from "../utils/logger.js";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

/** Content type from magic bytes (cached search photos are stored as *.img). */
function sniffMime(buf: Buffer): string {
  if (buf.subarray(0, 4).toString("hex") === "89504e47") return "image/png";
  if (buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return "image/webp";
  if (buf.subarray(0, 3).toString() === "GIF") return "image/gif";
  return "image/jpeg";
}

/** Input slots that may hold an image path/URL (photo, channel logo). */
const IMAGE_KEYS = ["image", "logo"] as const;

/**
 * Templates render from their own folder, so image slots (`image`, `logo`: a
 * local path or an http(s) URL) are turned into data: URIs here — the render
 * then needs no file copy and no network. A missing/failed image is dropped
 * (the template hides it / falls back to icons) rather than failing the video.
 */
export async function inlineSceneImage(
  inputs: Record<string, unknown>,
  cacheDir: string,
  sceneId: string,
): Promise<Record<string, unknown>> {
  let out = inputs;
  for (const key of IMAGE_KEYS) {
    const src = out[key];
    if (typeof src !== "string" || !src.trim() || src.startsWith("data:")) continue;
    out = { ...out, [key]: await toDataUri(src, cacheDir, `${key}-${sceneId}`) };
  }
  return out;
}

async function toDataUri(src: string, cacheDir: string, name: string): Promise<string> {

  let path: string;
  if (/^https?:\/\//i.test(src)) {
    const ext = MIME[extname(new URL(src).pathname).toLowerCase()] ? extname(new URL(src).pathname).toLowerCase() : ".jpg";
    path = join(cacheDir, `${name}${ext}`);
    if (!existsSync(path)) {
      const res = await fetchImage(src, path);
      if (!res.success) {
        log.info(`  ${name}: download failed (${res.reason}) — skipped`);
        return "";
      }
    }
  } else {
    path = isAbsolute(src) ? src : resolve(process.cwd(), src);
    if (!existsSync(path)) {
      log.info(`  ${name}: not found (${path}) — skipped`);
      return "";
    }
  }

  const buf = await readFile(path);
  const mime = MIME[extname(path).toLowerCase()] ?? sniffMime(buf);
  const b64 = buf.toString("base64");
  return `data:${mime};base64,${b64}`;
}

/** Searched photos are cached here by query, so re-renders don't hit the APIs again. */
export const IMAGE_CACHE_DIR = join("output", ".image-cache");

/**
 * Fill a scene's photo automatically: when `inputs.image` is empty and
 * `inputs.image_query` is set (English keywords), search the web for a real
 * photo (see image-search.ts) and download it at once (stock URLs expire).
 * `image_pick` (0-based) picks another result if the first one doesn't fit.
 * Returns the inputs (image = local file) plus the credit line, if any.
 */
export async function autoFindSceneImage(
  inputs: Record<string, unknown>,
  orientation: Orientation,
  sceneId: string,
  cacheDir: string = IMAGE_CACHE_DIR,
): Promise<{ inputs: Record<string, unknown>; credit?: string }> {
  const query = inputs.image_query;
  if (inputs.image || typeof query !== "string" || !query.trim()) return { inputs };
  const pick = typeof inputs.image_pick === "number" ? inputs.image_pick : 0;
  const key = createHash("sha1").update(`${query.trim().toLowerCase()}|${orientation}|${pick}`).digest("hex").slice(0, 16);
  const file = join(resolve(cacheDir), `${key}.img`);
  const creditFile = `${file}.txt`;

  if (existsSync(file)) {
    const credit = existsSync(creditFile) ? (await readFile(creditFile, "utf8")).trim() : "cached";
    log.info(`  scene ${sceneId}: photo "${query}" (cached)`);
    return { inputs: { ...inputs, image: file }, credit: `${sceneId}: ${credit}` };
  }

  const hit = await searchImage(query.trim(), orientation, pick);
  if (!hit) {
    log.info(`  scene ${sceneId}: no photo found for "${query}" — using icons`);
    return { inputs };
  }
  const res = await fetchImage(hit.url, file);
  if (!res.success) {
    log.info(`  scene ${sceneId}: photo download failed (${res.reason}) — using icons`);
    return { inputs };
  }
  const credit = `${hit.credit} — ${hit.url}`;
  await writeFile(creditFile, credit + "\n", "utf8");
  log.info(`  scene ${sceneId}: photo "${query}" → ${hit.provider} (${hit.credit})`);
  return { inputs: { ...inputs, image: file }, credit: `${sceneId}: ${credit}` };
}

/**
 * Find a stock video clip for a scene: `inputs.video` (a local .mp4 path) wins,
 * otherwise `inputs.video_query` (English keywords) is searched on Pexels/Pixabay
 * and the clip is downloaded into the cache. `video_pick` picks another result.
 * Returns the local file + credit, or null (the scene then uses its photo/icons).
 */
/** Clips and authors already placed in the current video (see autoFindSceneVideo). */
export type UsedVideos = { urls: Set<string>; authors: Set<string> };
export const newUsedVideos = (): UsedVideos => ({ urls: new Set(), authors: new Set() });

export async function autoFindSceneVideo(
  inputs: Record<string, unknown>,
  orientation: Orientation,
  sceneId: string,
  cacheDir: string = IMAGE_CACHE_DIR,
  used: UsedVideos = newUsedVideos(),
): Promise<{ file: string; credit?: string } | null> {
  if (typeof inputs.video === "string" && inputs.video.trim()) {
    const file = isAbsolute(inputs.video) ? inputs.video : resolve(process.cwd(), inputs.video);
    if (existsSync(file)) return { file };
    log.info(`  scene ${sceneId}: video not found (${file}) — skipped`);
  }
  const query = inputs.video_query;
  if (typeof query !== "string" || !query.trim()) return null;
  const pick = typeof inputs.video_pick === "number" ? inputs.video_pick : 0;
  const key = createHash("sha1").update(`video|${query.trim().toLowerCase()}|${orientation}|${pick}`).digest("hex").slice(0, 16);
  const file = join(resolve(cacheDir), `${key}.mp4`);
  const creditFile = `${file}.txt`;
  const remember = (credit: string) => {
    const url = credit.split(" — ")[1]?.trim();
    if (url) used.urls.add(url);
    used.authors.add(creditAuthor(credit));
  };

  if (existsSync(file)) {
    const credit = existsSync(creditFile) ? (await readFile(creditFile, "utf8")).trim() : "cached";
    const url = credit.split(" — ")[1]?.trim();
    // a cached clip another scene of this video already shows → search again for a different one
    if (!url || !used.urls.has(url)) {
      remember(credit);
      log.info(`  scene ${sceneId}: video "${query}" (cached)`);
      return { file, credit: `${sceneId}: ${credit}` };
    }
  }

  const hit = await searchVideo(query.trim(), orientation, pick, used);
  if (!hit) {
    log.info(`  scene ${sceneId}: no video found for "${query}" — using photo/icons`);
    return null;
  }
  // a re-search after a duplicate must not overwrite the other scene's cached clip
  const target = existsSync(file) ? join(resolve(cacheDir), `${key}-${createHash("sha1").update(hit.url).digest("hex").slice(0, 8)}.mp4`) : file;
  const res = await fetchVideo(hit.url, target);
  if (!res.success) {
    log.info(`  scene ${sceneId}: video download failed (${res.reason}) — using photo/icons`);
    return null;
  }
  const credit = `${hit.credit} — ${hit.url}`;
  await writeFile(`${target}.txt`, credit + "\n", "utf8");
  remember(credit);
  log.info(`  scene ${sceneId}: video "${query}" → ${hit.provider} ${hit.width}x${hit.height} (${hit.credit})`);
  return { file: target, credit: `${sceneId}: ${credit}` };
}
