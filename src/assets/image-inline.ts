import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, isAbsolute, join, resolve } from "node:path";
import { fetchImage } from "./image-fetcher.js";
import { log } from "../utils/logger.js";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
};

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

  const mime = MIME[extname(path).toLowerCase()] ?? "image/jpeg";
  const b64 = (await readFile(path)).toString("base64");
  return `data:${mime};base64,${b64}`;
}
