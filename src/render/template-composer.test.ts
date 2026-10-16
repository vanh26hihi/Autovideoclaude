import { describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { withBackgroundVideo } from "./template-composer.js";

describe("withBackgroundVideo", () => {
  const setup = () => {
    const base = mkdtempSync(join(tmpdir(), "bgv-"));
    const tpl = join(base, "tpl");
    mkdirSync(join(tpl, "compositions"), { recursive: true });
    const page = '<body><div id="root" data-composition-id="main" data-start="0" data-duration="7"\n  data-width="1920"><div class="photo"></div></div></body>';
    writeFileSync(join(tpl, "index.html"), page);
    writeFileSync(join(tpl, "compositions", "portrait.html"), page);
    writeFileSync(join(base, "clip.mp4"), "fake");
    return { base, tpl };
  };

  it("adds a muted video as the first layer and stretches the composition", () => {
    const { base, tpl } = setup();
    const work = withBackgroundVideo(tpl, "index.html", join(base, "clip.mp4"), join(base, "work"), 9.3);
    const html = readFileSync(join(work, "index.html"), "utf8");
    expect(html).toMatch(/data-duration="9.30"\n  data-width="1920"><video id="bgvideo"|data-duration="9.30"[^>]*>\s*<video id="bgvideo"/);
    expect(html).toContain('src="assets/bg.mp4" data-start="0" data-duration="9.30"');
    expect(html).toContain("muted");
    expect(existsSync(join(work, "assets", "bg.mp4"))).toBe(true);
    // the vendored template itself is untouched
    expect(readFileSync(join(tpl, "index.html"), "utf8")).not.toContain("bgvideo");
  });

  it("points a nested composition at ../assets", () => {
    const { base, tpl } = setup();
    const work = withBackgroundVideo(tpl, "compositions/portrait.html", join(base, "clip.mp4"), join(base, "work"));
    const html = readFileSync(join(work, "compositions", "portrait.html"), "utf8");
    expect(html).toContain('src="../assets/bg.mp4"');
    expect(html).toContain('data-duration="7"');
  });
});

import { withDuration } from "./template-composer.js";

describe("withDuration", () => {
  it("stretches #root and bundles GSAP for templates that load it locally", () => {
    const base = mkdtempSync(join(tmpdir(), "dur-"));
    const tpl = join(base, "tpl");
    mkdirSync(join(tpl, "compositions"), { recursive: true });
    writeFileSync(join(tpl, "compositions", "portrait.html"),
      '<div id="root" data-composition-id="main" data-start="0" data-duration="7"></div><script src="../assets/gsap.min.js"></script>');
    const work = withDuration(tpl, "compositions/portrait.html", join(base, "work"), 8.4);
    expect(readFileSync(join(work, "compositions", "portrait.html"), "utf8")).toContain('data-duration="8.40"');
    expect(readFileSync(join(work, "assets", "gsap.min.js"), "utf8")).toContain("GSAP");
  });
});
