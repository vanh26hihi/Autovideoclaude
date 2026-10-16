import axios, { AxiosError } from "axios";
import { writeFile } from "node:fs/promises";
import type { TtsClient } from "./tts-client.js";

export interface VieNeuOpts {
  endpoint: string; // e.g. "http://127.0.0.1:8124"
  voice: string; // VieNeu preset voice, e.g. "Thiện Minh"
  speed?: number; // multiplier on the server's base speed (script.voice.speed)
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// VieNeu-TTS local server (tools/vieneu_server.py): POST { text, voice, speed } → audio/mpeg bytes.
// srtOutPath is ignored (no subtitle support).
export class VieNeuClient implements TtsClient {
  constructor(private cfg: VieNeuOpts) {}

  async generate(text: string, audioOutPath: string, _srtOutPath?: string): Promise<void> {
    const delays = [1000, 2000, 4000];
    let lastErr: unknown;

    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        const resp = await axios.post<ArrayBuffer>(
          `${this.cfg.endpoint}/tts`,
          { text, voice: this.cfg.voice, speed: this.cfg.speed ?? 1.0 },
          { headers: { "Content-Type": "application/json", Accept: "audio/mpeg" }, responseType: "arraybuffer", timeout: 300000 },
        );
        await writeFile(audioOutPath, Buffer.from(resp.data));
        return;
      } catch (e) {
        lastErr = e;
        const status = (e as AxiosError).response?.status;
        if (status !== undefined && status < 500 && status !== 429) {
          throw new Error(`VieNeu TTS failed (status ${status})`);
        }
        if (attempt < delays.length) await sleep(delays[attempt]);
      }
    }
    throw lastErr;
  }
}
