import axios from "axios";
import { log } from "../utils/logger.js";

export type Orientation = "portrait" | "landscape" | "square";

export interface ImageHit {
  url: string;
  provider: string;
  /** Attribution line (author / licence) for the credits. */
  credit: string;
}

const UA = "autovideoclaude/1.0 (https://github.com/vanh26hihi/Autovideoclaude)";
const TIMEOUT = 20000;

type Provider = (q: string, o: Orientation) => Promise<ImageHit[]>;

/** Pexels — best stock quality; needs a free PEXELS_API_KEY. */
const pexels: Provider = async (q, o) => {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return [];
  const { data } = await axios.get("https://api.pexels.com/v1/search", {
    params: { query: q, orientation: o, per_page: 8 },
    headers: { Authorization: key, "User-Agent": UA },
    timeout: TIMEOUT,
  });
  return (data.photos ?? []).map((p: any) => ({
    url: o === "portrait" ? p.src?.portrait ?? p.src?.large2x : p.src?.large2x ?? p.src?.original,
    provider: "Pexels",
    credit: `${p.photographer ?? "Pexels"} / Pexels`,
  }));
};

/** Pixabay — needs a free PIXABAY_API_KEY. */
const pixabay: Provider = async (q, o) => {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) return [];
  const { data } = await axios.get("https://pixabay.com/api/", {
    params: {
      key,
      q,
      image_type: "photo",
      orientation: o === "portrait" ? "vertical" : o === "landscape" ? "horizontal" : "all",
      safesearch: true,
      per_page: 8,
    },
    headers: { "User-Agent": UA },
    timeout: TIMEOUT,
  });
  return (data.hits ?? []).map((h: any) => ({
    url: h.largeImageURL,
    provider: "Pixabay",
    credit: `${h.user ?? "Pixabay"} / Pixabay`,
  }));
};

/** Openverse — CC-licensed photos, no key. Not in the default chain (see PROVIDERS). */
export const openverse: Provider = async (q, o) => {
  const { data } = await axios.get("https://api.openverse.org/v1/images/", {
    params: {
      q,
      page_size: 12,
      category: "photograph",
      license_type: "commercial",
      aspect_ratio: o === "portrait" ? "tall" : o === "landscape" ? "wide" : "square",
      mature: false,
    },
    headers: { "User-Agent": UA },
    timeout: TIMEOUT,
  });
  return (data.results ?? [])
    .filter((r: any) => !r.width || r.width >= 800)
    .map((r: any) => ({
      url: r.url,
      provider: "Openverse",
      credit: `${r.creator ?? "unknown"} / ${String(r.license ?? "cc").toUpperCase()} (${r.source ?? "Openverse"})`,
    }));
};

/** Wikimedia Commons — free-licensed files, no key; returns ~1080px thumbnails. */
const wikimedia: Provider = async (q, o) => {
  const { data } = await axios.get("https://commons.wikimedia.org/w/api.php", {
    params: {
      action: "query",
      format: "json",
      generator: "search",
      gsrnamespace: 6,
      gsrsearch: `${q} filetype:bitmap`,
      gsrlimit: 12,
      prop: "imageinfo",
      iiprop: "url|mime|size|extmetadata",
      iiurlwidth: o === "portrait" ? 1080 : 1920,
    },
    headers: { "User-Agent": UA },
    timeout: TIMEOUT,
  });
  const pages = Object.values(data.query?.pages ?? {}) as any[];
  return pages
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .map((p) => p.imageinfo?.[0])
    .filter((ii) => ii && /image\/(jpeg|png)/.test(ii.mime) && (ii.width ?? 0) >= 800)
    .map((ii) => ({
      url: ii.thumburl ?? ii.url,
      provider: "Wikimedia Commons",
      credit: `${String(ii.extmetadata?.Artist?.value ?? "Wikimedia").replace(/<[^>]+>/g, "").trim()} / ${ii.extmetadata?.LicenseShortName?.value ?? "Wikimedia Commons"}`,
    }));
};

// Openverse is not in the chain: in testing it returned off-topic and even
// suggestive images despite mature=false. Kept above for manual use only.
const PROVIDERS: [string, Provider][] = [
  ["pexels", pexels],
  ["pixabay", pixabay],
  ["wikimedia", wikimedia],
];

/** "tired man yawning at desk" → ["tired man yawning at desk", "tired man yawning", "tired man"]. */
export function queryVariants(query: string): string[] {
  const words = query.trim().split(/\s+/).filter((w) => !/^(a|an|the|of|on|in|at|with|and|for|to)$/i.test(w));
  const out = [query.trim()];
  for (let n = Math.min(words.length, 4); n >= 2; n--) {
    const v = words.slice(0, n).join(" ");
    if (!out.includes(v)) out.push(v);
  }
  return out;
}

/**
 * Find a real photo for `query` (English keywords work best). Tries Pexels and
 * Pixabay when their free API keys are set (recommended: stock photos that
 * match the topic). Only without any key does it use Wikimedia Commons, with
 * shorter queries. 429s are retried with back-off. `pick` chooses among the results (0 = best match).
 * Returns null when nothing is found — the template then falls back to icons.
 */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** Pause between stock-API calls; overridable for tests. */
export const searchTiming = { gapMs: 1200, retryMs: [3000, 8000, 20000] };
let lastCall = 0;

/** Call a stock API politely: ~1 s apart, and back off on 429 (rate limit / Cloudflare). */
async function politely<T>(name: string, call: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const wait = lastCall + searchTiming.gapMs - Date.now();
    if (wait > 0) await sleep(wait);
    lastCall = Date.now();
    try {
      return await call();
    } catch (e: any) {
      const delay = searchTiming.retryMs[attempt];
      if (e.response?.status !== 429 || delay === undefined) throw e;
      log.info(`  image search ${name}: 429, retrying in ${delay / 1000}s`);
      await sleep(delay);
    }
  }
}

export async function searchImage(
  query: string,
  orientation: Orientation = "portrait",
  pick = 0,
): Promise<ImageHit | null> {
  // With a stock key, never fall back to Wikimedia: it matches file names, so
  // its photos are often off-topic — better keep the icons than a wrong photo.
  const hasStockKey = Boolean(process.env.PEXELS_API_KEY || process.env.PIXABAY_API_KEY);
  for (const [name, fn] of PROVIDERS) {
    if (name === "wikimedia" && hasStockKey) break;
    // Stock APIs handle full phrases; Wikimedia matches every word, so retry shorter.
    const variants = name === "wikimedia" ? queryVariants(query) : [query.trim()];
    for (const q of variants) {
      try {
        const hits = (await politely(name, () => fn(q, orientation))).filter((h) => h.url);
        if (hits.length) return hits[Math.min(pick, hits.length - 1)];
      } catch (e: any) {
        log.info(`  image search ${name}: ${e.response?.status ?? e.message ?? e}`);
        break;
      }
    }
  }
  return null;
}
