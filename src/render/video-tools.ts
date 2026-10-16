import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { getDurationSec } from "../assets/audio-tools.js";

function run(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args);
    let out = "", err = "";
    proc.stdout.on("data", (d) => (out += d.toString()));
    proc.stderr.on("data", (d) => (err += d.toString()));
    proc.on("close", (code) =>
      code === 0 ? resolve(out) : reject(new Error(`${cmd} failed (exit ${code}): ${err.slice(-800)}`)),
    );
    proc.on("error", reject);
  });
}

/** Common encode flags so every fitted clip is concat-compatible (same codec). */
const ENCODE = (fps: number) => [
  "-an",
  "-c:v", "libx264",
  "-preset", "medium",
  "-crf", "18",
  "-pix_fmt", "yuv420p",
  "-r", String(fps),
];

/**
 * Re-encode `inPath` to exactly `targetSec` seconds (video only):
 * - longer target → freeze the last frame (tpad clone) to fill the remainder,
 *   so a 5s poster animation holds while the scene's narration continues;
 * - shorter target → trim. Output is normalized for concat.
 */
export async function fitClipToDuration(
  inPath: string,
  targetSec: number,
  outPath: string,
  fps = 30,
): Promise<void> {
  const inDur = await getDurationSec(inPath);
  const target = Math.max(0.1, targetSec);
  const args = ["-y", "-i", inPath];
  if (target > inDur + 0.02) {
    const ext = target - inDur;
    args.push("-vf", `tpad=stop_mode=clone:stop_duration=${ext.toFixed(3)}`);
  }
  args.push("-t", target.toFixed(3), ...ENCODE(fps), outPath);
  await run("ffmpeg", args);
}

/** Concatenate uniformly-encoded clips into one silent video (stream copy). */
export async function concatVideos(clipPaths: string[], outPath: string): Promise<void> {
  if (clipPaths.length === 0) throw new Error("concatVideos: empty clipPaths");
  const tmp = await mkdtemp(join(tmpdir(), "vconcat-"));
  try {
    const listFile = join(tmp, "list.txt");
    // Absolute paths: the concat demuxer resolves `file '...'` relative to the
    // list file's directory (the temp dir), not the process cwd.
    const body = clipPaths
      .map((p) => `file '${resolve(p).replace(/'/g, "'\\''")}'`)
      .join("\n");
    await writeFile(listFile, body, "utf8");
    await run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", listFile, "-c", "copy", outPath]);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

/**
 * Mux an audio track onto a silent video. The video length wins (no -shortest),
 * so an outro visual hold past the end of narration is preserved as silent tail.
 */
export async function muxAudioOntoVideo(
  videoPath: string,
  audioPath: string,
  outPath: string,
): Promise<void> {
  await run("ffmpeg", [
    "-y",
    "-i", videoPath,
    "-i", audioPath,
    "-map", "0:v:0",
    "-map", "1:a:0",
    "-c:v", "copy",
    "-c:a", "aac",
    "-b:a", "192k",
    outPath,
  ]);
}

export type LookStyle = "none" | "film";

export interface FinishOpts {
  /** Directory ffmpeg runs in: `assFile` and `fontsDir` are relative to it (no path escaping on Windows). */
  cwd: string;
  /** Karaoke subtitles (.ass), relative to cwd. */
  assFile?: string;
  /** Folder with the subtitle / stamp fonts, relative to cwd. */
  fontsDir?: string;
  /** Font file for the film date stamp, relative to cwd. */
  stampFont?: string;
  look?: LookStyle;
  /** Film look: camcorder date stamp text (e.g. "'98 10 16"); "" hides it. */
  stamp?: string;
  fps?: number;
}

/** ffmpeg -vf chain for a look. "film": warm faded tones, dark vignette, moving grain, date stamp. */
export function lookFilters(look: LookStyle, height: number, stamp: string, stampFont?: string): string[] {
  if (look !== "film") return [];
  const f = [
    "eq=contrast=1.06:saturation=0.78:gamma=0.97",
    "colorchannelmixer=rr=1.05:gg=0.98:bb=0.82",
    "vignette=angle=PI/3.6",
    "noise=alls=9:allf=t",
  ];
  if (stamp && stampFont) {
    const size = Math.round(height * 0.045);
    const txt = stamp.replace(/\\/g, "").replace(/'/g, "’").replace(/:/g, "\\:");
    f.push(
      `drawtext=fontfile=${stampFont}:text='${txt}':fontcolor=0xFF8A1E:fontsize=${size}:x=w-tw-${Math.round(height * 0.06)}:y=${Math.round(height * 0.05)}:shadowcolor=0x000000@0.6:shadowx=2:shadowy=2`,
    );
  }
  return f;
}

/** Burn the look and karaoke subtitles onto the concatenated silent video. */
export async function finishVideo(inPath: string, outPath: string, height: number, opts: FinishOpts): Promise<void> {
  const filters = lookFilters(opts.look ?? "none", height, opts.stamp ?? "", opts.stampFont);
  if (opts.assFile) {
    filters.push(`subtitles=${opts.assFile}${opts.fontsDir ? `:fontsdir=${opts.fontsDir}` : ""}`);
  }
  if (!filters.length) throw new Error("finishVideo: nothing to apply");
  await new Promise<void>((resolveP, reject) => {
    const proc = spawn("ffmpeg", ["-y", "-i", resolve(inPath), "-vf", filters.join(","), ...ENCODE(opts.fps ?? 30), resolve(outPath)], { cwd: opts.cwd });
    let err = "";
    proc.stderr.on("data", (d) => (err += d.toString()));
    proc.on("close", (code) => (code === 0 ? resolveP() : reject(new Error(`ffmpeg finish failed (exit ${code}): ${err.slice(-800)}`))));
    proc.on("error", reject);
  });
}
