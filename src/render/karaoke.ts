import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";

/**
 * Word-by-word karaoke subtitles (ASS) for the template pipeline. The TTS gives
 * no word timestamps, so they are estimated: each scene's audio is split into
 * speech segments with ffmpeg silencedetect, matched to the text's clauses
 * (split at punctuation), and each word gets a share of its segment weighted by
 * its length. Vietnamese words are single syllables, so this tracks closely.
 */

export interface WordTiming {
  word: string;
  start: number;
  end: number;
}

export interface KaraokeStyle {
  /** Words shown per subtitle line (3–6 reads well). */
  wordsPerLine: number;
  fontName: string;
  /** Font size in px of the video height. */
  fontSize: number;
  /** Already-spoken word colour (#RRGGBB). */
  activeColor: string;
  /** Not-yet-spoken word colour (#RRGGBB). */
  baseColor: string;
  uppercase: boolean;
  /** Distance from the bottom edge in px. */
  marginV: number;
}

export const DEFAULT_KARAOKE: KaraokeStyle = {
  wordsPerLine: 5,
  fontName: "Anton",
  fontSize: 0, // 0 → derived from the video height
  activeColor: "#FFD400",
  baseColor: "#FFFFFF",
  uppercase: true,
  marginV: 0,
};

function run(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args);
    let err = "";
    proc.stderr.on("data", (d) => (err += d.toString()));
    proc.on("close", (code) => (code === 0 ? resolve(err) : reject(new Error(`${cmd} failed (exit ${code}): ${err.slice(-500)}`))));
    proc.on("error", reject);
  });
}

/** Speech segments [start, end] of an audio file, from ffmpeg silencedetect. */
export async function detectSpeechSegments(audioPath: string, durationSec: number): Promise<[number, number][]> {
  const log = await run("ffmpeg", ["-hide_banner", "-i", audioPath, "-af", "silencedetect=noise=-35dB:d=0.14", "-f", "null", "-"]);
  return speechFromSilenceLog(log, durationSec);
}

export function speechFromSilenceLog(log: string, durationSec: number): [number, number][] {
  const silences: [number, number][] = [];
  let open: number | null = null;
  for (const line of log.split(/\r?\n/)) {
    const s = line.match(/silence_start: (-?[\d.]+)/);
    if (s) open = Math.max(0, parseFloat(s[1]));
    const e = line.match(/silence_end: ([\d.]+)/);
    if (e && open !== null) {
      silences.push([open, parseFloat(e[1])]);
      open = null;
    }
  }
  if (open !== null) silences.push([open, durationSec]);
  const speech: [number, number][] = [];
  let cursor = 0;
  for (const [a, b] of silences) {
    if (a - cursor > 0.05) speech.push([cursor, a]);
    cursor = b;
  }
  if (durationSec - cursor > 0.05) speech.push([cursor, durationSec]);
  return speech;
}

/** Split narration into clauses at punctuation; each clause is a list of words. */
export function splitClauses(text: string): string[][] {
  return text
    .split(/(?<=[.,!?;:…])\s+/)
    .map((c) => c.trim().split(/\s+/).filter(Boolean))
    .filter((c) => c.length > 0);
}

const weight = (w: string) => 1 + 0.06 * w.replace(/[^\p{L}\p{N}]/gu, "").length;

function spread(words: string[], start: number, end: number): WordTiming[] {
  const total = words.reduce((a, w) => a + weight(w), 0);
  let t = start;
  return words.map((word) => {
    const d = ((end - start) * weight(word)) / total;
    const wt = { word, start: t, end: t + d };
    t += d;
    return wt;
  });
}

/**
 * Estimate per-word timings for one scene. When the number of speech segments
 * matches the number of clauses they are paired 1:1; otherwise clauses are laid
 * over the whole speech span, proportional to their weight.
 */
export function estimateWordTimings(text: string, speech: [number, number][]): WordTiming[] {
  const clauses = splitClauses(text);
  if (!clauses.length || !speech.length) return [];
  if (clauses.length === speech.length) {
    return clauses.flatMap((c, i) => spread(c, speech[i][0], speech[i][1]));
  }
  // Merge gaps: keep only overall start/end, distribute clauses by weight.
  const start = speech[0][0];
  const end = speech[speech.length - 1][1];
  const weights = clauses.map((c) => c.reduce((a, w) => a + weight(w), 0));
  const total = weights.reduce((a, b) => a + b, 0);
  let t = start;
  return clauses.flatMap((c, i) => {
    const d = ((end - start) * weights[i]) / total;
    const out = spread(c, t, t + d);
    t += d;
    return out;
  });
}

/** Group words into lines of ≤ n words, also breaking after clause punctuation. */
export function groupLines(words: WordTiming[], n: number): WordTiming[][] {
  const lines: WordTiming[][] = [];
  let cur: WordTiming[] = [];
  for (const w of words) {
    cur.push(w);
    if (cur.length >= n || /[.,!?;:…]$/.test(w.word)) {
      lines.push(cur);
      cur = [];
    }
  }
  if (cur.length) lines.push(cur);
  // avoid 1-word orphan lines by merging into the previous line
  for (let i = lines.length - 1; i > 0; i--) {
    if (lines[i].length === 1 && lines[i - 1].length < n + 1) {
      lines[i - 1].push(...lines[i]);
      lines.splice(i, 1);
    }
  }
  return lines;
}

const assTime = (t: number) => {
  const cs = Math.max(0, Math.round(t * 100));
  const h = Math.floor(cs / 360000);
  const m = Math.floor((cs % 360000) / 6000);
  const s = Math.floor((cs % 6000) / 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs % 100).padStart(2, "0")}`;
};
/** #RRGGBB → ASS &H00BBGGRR */
const assColor = (hex: string) => {
  const h = hex.replace("#", "");
  return `&H00${h.slice(4, 6)}${h.slice(2, 4)}${h.slice(0, 2)}`.toUpperCase();
};
const escapeAss = (s: string) => s.replace(/[{}]/g, "").replace(/\\/g, "");

/** Build a karaoke .ass document (\k tags: each word turns active when spoken and stays). */
export function buildAss(words: WordTiming[], width: number, height: number, style: KaraokeStyle = DEFAULT_KARAOKE): string {
  const fontSize = style.fontSize || Math.round(height * (width > height ? 0.085 : 0.05));
  const marginV = style.marginV || Math.round(height * (width > height ? 0.07 : 0.16));
  const header = [
    "[Script Info]",
    "ScriptType: v4.00+",
    `PlayResX: ${width}`,
    `PlayResY: ${height}`,
    "WrapStyle: 0",
    "ScaledBorderAndShadow: yes",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: Karaoke,${style.fontName},${fontSize},${assColor(style.activeColor)},${assColor(style.baseColor)},&H00000000,&H96000000,0,0,0,0,100,100,1,0,1,${Math.max(2, Math.round(fontSize / 18))},${Math.max(2, Math.round(fontSize / 14))},2,${Math.round(width * 0.08)},${Math.round(width * 0.08)},${marginV},1`,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ];
  const events = groupLines(words, style.wordsPerLine).map((line, i, all) => {
    const start = line[0].start;
    const next = all[i + 1]?.[0].start;
    // hold the line until the next one starts (short pauses), max +0.6 s
    const end = Math.min(next ?? line[line.length - 1].end + 0.6, line[line.length - 1].end + 0.6);
    let text = "";
    let t = start;
    for (const w of line) {
      const lead = Math.round((w.start - t) * 100);
      if (lead > 0) text += `{\\k${lead}}`;
      const dur = Math.max(1, Math.round((w.end - w.start) * 100));
      const shown = escapeAss(style.uppercase ? w.word.toLocaleUpperCase("vi") : w.word);
      text += `{\\k${dur}}${shown} `;
      t = w.start + dur / 100;
    }
    return `Dialogue: 0,${assTime(start)},${assTime(end)},Karaoke,,0,0,0,,${text.trim()}`;
  });
  return [...header, ...events, ""].join("\n");
}

export async function writeKaraokeAss(path: string, words: WordTiming[], width: number, height: number, style?: KaraokeStyle) {
  await writeFile(path, buildAss(words, width, height, style), "utf8");
}
