import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { loadConfig } from "./config.js";

const ENV_KEYS = ["TTS_PROVIDER", "OMNIVOICE_ENDPOINT", "VIENEU_ENDPOINT", "VIENEU_VOICE", "TTS_CONCURRENCY"];

describe("loadConfig", () => {
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
    ENV_KEYS.forEach((k) => delete process.env[k]);
  });

  afterEach(() => {
    Object.entries(saved).forEach(([k, v]) => {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    });
  });

  it("defaults to vieneu (Thiện Minh) with sensible defaults", () => {
    const cfg = loadConfig();
    expect(cfg.ttsProvider).toBe("vieneu");
    expect(cfg.vieneuEndpoint).toBe("http://127.0.0.1:8124");
    expect(cfg.vieneuVoice).toBe("Thiện Minh");
    expect(cfg.omnivoiceEndpoint).toBe("http://127.0.0.1:8123");
    expect(cfg.ttsConcurrency).toBe(1);
  });

  it("respects OMNIVOICE_ENDPOINT override", () => {
    process.env.OMNIVOICE_ENDPOINT = "http://localhost:9000";
    const cfg = loadConfig();
    expect(cfg.omnivoiceEndpoint).toBe("http://localhost:9000");
  });

  it("respects VIENEU_VOICE override and omnivoice provider", () => {
    process.env.VIENEU_VOICE = "Hải Đăng";
    process.env.TTS_PROVIDER = "omnivoice";
    const cfg = loadConfig();
    expect(cfg.vieneuVoice).toBe("Hải Đăng");
    expect(cfg.ttsProvider).toBe("omnivoice");
  });

  it("rejects unknown providers", () => {
    process.env.TTS_PROVIDER = "elevenlabs";
    expect(() => loadConfig()).toThrow(/TTS_PROVIDER/);
  });
});
