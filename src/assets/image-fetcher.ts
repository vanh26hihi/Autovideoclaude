import axios from "axios";
import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

export interface FetchResult {
  success: boolean;
  path?: string;
  reason?: string;
}

/** Back-off for 429 (rate limit / Cloudflare) on downloads; overridable for tests. */
export const fetchTiming = { retryMs: [3000, 8000, 20000] };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function fetchImage(url: string | null, outPath: string): Promise<FetchResult> {
  if (!url) return { success: false, reason: "no url provided (null)" };
  for (let attempt = 0; ; attempt++) {
    const res = await fetchOnce(url, outPath);
    const delay = fetchTiming.retryMs[attempt];
    if (res.success || res.reason !== "http 429" || delay === undefined) return res;
    await sleep(delay);
  }
}

async function fetchOnce(url: string, outPath: string): Promise<FetchResult> {
  try {
    const resp = await axios.get<ArrayBuffer>(url, {
      responseType: "arraybuffer",
      timeout: 30000,
      // Wikimedia (403) and Flickr (502) reject axios' default User-Agent.
      headers: { "User-Agent": "autovideoclaude/1.0 (https://github.com/vanh26hihi/Autovideoclaude)" },
      validateStatus: (s) => s < 400,
    });

    const ct = String(resp.headers["content-type"] ?? "");
    if (!ct.startsWith("image/")) {
      return { success: false, reason: `non-image content-type: ${ct}` };
    }

    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, Buffer.from(resp.data));
    return { success: true, path: outPath };
  } catch (e: any) {
    const status = e.response?.status;
    return { success: false, reason: status ? `http ${status}` : String(e.message ?? e) };
  }
}
