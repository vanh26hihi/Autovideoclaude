import { spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { log } from "../utils/logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
/** Repo-root/templates — where vendored HyperFrames templates live. */
const TEMPLATES_DIR = join(__dirname, "..", "..", "templates");

export type Aspect = "16:9" | "9:16" | "1:1";

/**
 * Each aspect renders a dedicated composition file authored at that native
 * canvas (these templates use absolute-px layouts, so we re-lay-out per aspect
 * rather than scale a single composition). Missing file → fall back to index.html.
 */
const ASPECT_ENTRY: Record<Aspect, string> = {
    "16:9": "index.html",
    "9:16": "compositions/portrait.html",
    "1:1": "compositions/square.html",
};

export interface ComposeArgs {
    /** Folder name under templates/, e.g. "frame-bold-poster". */
    templateId: string;
    /** Content slots, matching the template's data-composition-variables schema. */
    inputs: Record<string, unknown>;
    /** Absolute or repo-relative output .mp4 path. */
    outputPath: string;
    /** Force an output aspect. Omit to render the template's native canvas. */
    aspect?: Aspect;
    fps?: number;
    quality?: "draft" | "standard" | "high";
    /** A prepared background clip (see prepBackgroundVideo) played full-frame under the template. */
    bgVideo?: string;
    /** Composition length in seconds (scene length), so motion/video runs for the whole scene instead of freezing. */
    durationSec?: number;
    /** Screenshot capture (1 worker): needed for <video> and for big colour-emoji scenes, which stall BeginFrame capture. */
    screenshotCapture?: boolean;
}

const require = createRequire(import.meta.url);

/** A template that loads `assets/gsap.min.js` gets GSAP from node_modules (no CDN at render time). */
const usesLocalGsap = (html: string) => html.includes("assets/gsap.min.js");

function bundleLocalLibs(workDir: string, entryFile: string): void {
    if (!usesLocalGsap(readFileSync(join(workDir, entryFile), "utf8"))) return;
    mkdirSync(join(workDir, "assets"), { recursive: true });
    cpSync(require.resolve("gsap/dist/gsap.min.js"), join(workDir, "assets", "gsap.min.js"));
}

/** Copy the template into workDir (fresh), with local libraries bundled. */
function copyTemplate(templateDir: string, entryFile: string, workDir: string): void {
    rmSync(workDir, { recursive: true, force: true });
    cpSync(templateDir, workDir, { recursive: true });
    bundleLocalLibs(workDir, entryFile);
}

/**
 * Copy the template next to the output and set the scene length on #root
 * (`data-duration` is read at compile time, so it can't come from a variable).
 */
export function withDuration(templateDir: string, entryFile: string, workDir: string, durationSec?: number): string {
    copyTemplate(templateDir, entryFile, workDir);
    if (!durationSec) return workDir;
    const entryPath = join(workDir, entryFile);
    const html = readFileSync(entryPath, "utf8").replace(/<div id="root"[^>]*>/, (tag) =>
        tag.replace(/data-duration="[\d.]+"/, `data-duration="${durationSec.toFixed(2)}"`),
    );
    writeFileSync(entryPath, html, "utf8");
    return workDir;
}

/**
 * Copy the template next to the output and add a static, muted <video> as the
 * first layer of #root (HyperFrames only plays <video> tags that are in the
 * HTML with id/data-start/data-duration and a src on disk). The template's JS
 * sees #bgvideo and skips its photo/icons.
 */
export function withBackgroundVideo(
    templateDir: string,
    entryFile: string,
    bgVideo: string,
    workDir: string,
    durationSec?: number,
): string {
    copyTemplate(templateDir, entryFile, workDir);
    mkdirSync(join(workDir, "assets"), { recursive: true });
    cpSync(bgVideo, join(workDir, "assets", "bg.mp4"));
    const entryPath = join(workDir, entryFile);
    // the entry may sit in compositions/, so point at the clip relative to it
    const src = entryFile.includes("/") ? "../assets/bg.mp4" : "assets/bg.mp4";
    const html = readFileSync(entryPath, "utf8").replace(
        /<div id="root"[^>]*>/,
        (tag) => {
            const dur = durationSec ? durationSec.toFixed(2) : (/data-duration="([\d.]+)"/.exec(tag)?.[1] ?? "7");
            return `${tag.replace(/data-duration="[\d.]+"/, `data-duration="${dur}"`)}
  <video id="bgvideo" class="bgvideo" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" src="${src}" data-start="0" data-duration="${dur}" data-track-index="0" muted playsinline></video>`;
        },
    );
    if (!html.includes('id="bgvideo"')) throw new Error(`No #root in ${entryPath} to add a background video to`);
    writeFileSync(entryPath, html, "utf8");
    return workDir;
}

/**
 * Render one vendored HyperFrames template into an MP4, injecting `inputs`
 * as composition variables. This is the deterministic "fill the slots" step:
 * the agent only supplies text, the template owns all the visual design.
 */
export async function composeTemplate(args: ComposeArgs): Promise<string> {
    const { templateId, inputs, fps = 30, quality = "standard", aspect } = args;
    const templateDir = join(TEMPLATES_DIR, templateId);
    if (!existsSync(join(templateDir, "index.html"))) {
        throw new Error(`Template not found: ${templateDir}/index.html`);
    }

    // Pick the composition file for the requested aspect (fall back to index.html).
    const entry = aspect ? ASPECT_ENTRY[aspect] : "index.html";
    const entryFile = existsSync(join(templateDir, entry))
        ? entry
        : "index.html";

    const outputPath = isAbsolute(args.outputPath)
        ? args.outputPath
        : resolve(process.cwd(), args.outputPath);
    const workDir = args.bgVideo
        ? withBackgroundVideo(templateDir, entryFile, args.bgVideo, `${outputPath}.tpl`, args.durationSec)
        : args.durationSec || usesLocalGsap(readFileSync(join(templateDir, entryFile), "utf8"))
          ? withDuration(templateDir, entryFile, `${outputPath}.tpl`, args.durationSec)
          : undefined;

    // Pass variables via a temp file, NOT --variables: a JSON arg through
    // npx + shell:true on Windows mangles quotes/Unicode (em-dash, Vietnamese)
    // and the render silently no-ops. A file is shell-safe and UTF-8 clean.
    const varsFile = join(
        mkdtempSync(join(tmpdir(), "hf-vars-")),
        "variables.json",
    );
    writeFileSync(varsFile, JSON.stringify(inputs), "utf8");

    const spawnArgs = [
        // -y: never prompt to install. Pinned version → deterministic renders.
        "-y",
        "hyperframes@0.6.94",
        "render",
        workDir ?? templateDir,
        "--composition",
        entryFile,
        "--output",
        outputPath,
        "--fps",
        String(fps),
        "--quality",
        quality,
        "--variables-file",
        varsFile,
        // With a <video> or giant colour emoji, the default BeginFrame capture hangs;
        // low-memory mode uses screenshot capture (1 worker), which renders them fine.
        ...(args.bgVideo || args.screenshotCapture ? ["--low-memory-mode"] : []),
    ];

    log.info(`Compose ${templateId} (${entryFile}) → ${outputPath}`);

    await new Promise<void>((resolve, reject) => {
        // shell: true joins args with spaces, so quote any arg containing one
        // (e.g. a repo under "D:/Video AI/...") — double quotes work in cmd.exe and sh.
        const shellArgs = spawnArgs.map((a) => (/\s/.test(a) ? `"${a}"` : a));
        const proc = spawn("npx", shellArgs, {
            stdio: ["ignore", "inherit", "inherit"],
            shell: true,
        });
        proc.on("close", (code) =>
            code === 0
                ? resolve()
                : reject(new Error(`hyperframes render failed (exit ${code})`)),
        );
        proc.on("error", reject);
    });

    if (workDir) rmSync(workDir, { recursive: true, force: true });
    log.info(`Rendered: ${outputPath}`);
    return outputPath;
}

/** POC entry: `tsx src/render/template-composer.ts` renders sample clips. */
// pathToFileURL handles Windows backslash paths (a raw `file://${argv[1]}`
// never matches import.meta.url on win32, silently skipping this block).
if (
    process.argv[1] &&
    import.meta.url === pathToFileURL(process.argv[1]).href
) {
    const inputs = {
        kicker: "AI Coding",
        date: "12 · 06 · 2026",
        figure: "5.5",
        headline: ["GPT 5.5", "ra mắt.", "Mạnh nhất."],
        standfirst:
            "OpenAI vừa công bố mô hình mạnh nhất từ trước tới nay — nhanh hơn, rẻ hơn, hiểu tiếng Việt tốt hơn.",
        footer_left: "AI Coding",
        footer_right: "https://aicodingvn.vercel.app/",
    };
    (async () => {
        await composeTemplate({
            templateId: "frame-bold-poster",
            inputs,
            aspect: "16:9",
            outputPath: "output/poc-bold-poster-16x9.mp4",
        });
        await composeTemplate({
            templateId: "frame-bold-poster",
            inputs,
            aspect: "9:16",
            outputPath: "output/poc-bold-poster-9x16.mp4",
        });
    })().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}
