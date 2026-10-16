/**
 * Common TTS client interface. Providers: VieNeu-TTS (default) and OmniVoice,
 * both local HTTP servers; the interface keeps the pipeline decoupled from them.
 */
export interface TtsClient {
  /**
   * Generate speech audio for `text` and write to `audioOutPath` (mp3 or wav).
   * If `srtOutPath` is provided AND the provider supports subtitles,
   * write the SRT to that path. Otherwise silently skip.
   */
  generate(text: string, audioOutPath: string, srtOutPath?: string): Promise<void>;
}

import type { Config } from "../config.js";
import { OmniVoiceClient } from "./omnivoice-client.js";
import { VieNeuClient } from "./vieneu-client.js";

export function createTtsClient(cfg: Config): TtsClient {
  if (cfg.ttsProvider === "vieneu") {
    return new VieNeuClient({ endpoint: cfg.vieneuEndpoint, voice: cfg.vieneuVoice });
  }
  return new OmniVoiceClient({ endpoint: cfg.omnivoiceEndpoint });
}
