import "dotenv/config";

export type TtsProvider = "vieneu" | "omnivoice";
const PROVIDERS: TtsProvider[] = ["vieneu", "omnivoice"];

export interface Config {
    ttsProvider: TtsProvider;

    // VieNeu-TTS (local server: tools/vieneu_server.py)
    vieneuEndpoint: string;
    vieneuVoice: string;

    // OmniVoice (local TTS server)
    omnivoiceEndpoint: string;

    ttsConcurrency: number;
}

function intDefault(name: string, def: number): number {
    const v = process.env[name];
    if (!v) return def;
    const n = parseInt(v, 10);
    if (isNaN(n))
        throw new Error(`Env var ${name} must be integer, got "${v}"`);
    return n;
}

export function loadConfig(): Config {
    const provider = (process.env.TTS_PROVIDER ?? "vieneu") as TtsProvider;
    if (!PROVIDERS.includes(provider)) {
        throw new Error(
            `TTS_PROVIDER must be one of ${PROVIDERS.join(", ")}, got "${provider}"`,
        );
    }

    return {
        ttsProvider: provider,
        vieneuEndpoint:
            process.env.VIENEU_ENDPOINT ?? "http://127.0.0.1:8124",
        vieneuVoice: process.env.VIENEU_VOICE ?? "Thiện Minh",
        omnivoiceEndpoint:
            process.env.OMNIVOICE_ENDPOINT ?? "http://127.0.0.1:8123",
        ttsConcurrency: intDefault("TTS_CONCURRENCY", 1),
    };
}
