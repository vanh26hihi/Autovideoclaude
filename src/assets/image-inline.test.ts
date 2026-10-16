import { describe, it, expect, beforeEach, afterEach } from "vitest";
import nock from "nock";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { inlineSceneImage } from "./image-inline.js";

const TINY_PNG = Buffer.from("89504e470d0a1a0a", "hex");
let tmp: string;
beforeEach(() => { nock.cleanAll(); tmp = mkdtempSync(join(tmpdir(), "inl-")); });
afterEach(() => { nock.cleanAll(); rmSync(tmp, { recursive: true, force: true }); });

describe("inlineSceneImage", () => {
  it("leaves inputs without an image untouched", async () => {
    const inputs = { icons: ["😴"], caption: "x" };
    expect(await inlineSceneImage(inputs, tmp, "s1")).toBe(inputs);
  });

  it("inlines a local file as a data URI", async () => {
    const p = join(tmp, "a.png");
    writeFileSync(p, TINY_PNG);
    const out = await inlineSceneImage({ image: p, caption: "x" }, tmp, "s1");
    expect(out.image).toBe(`data:image/png;base64,${TINY_PNG.toString("base64")}`);
    expect(out.caption).toBe("x");
  });

  it("downloads a URL then inlines it", async () => {
    nock("https://example.com").get("/p.jpg").reply(200, TINY_PNG, { "content-type": "image/jpeg" });
    const out = await inlineSceneImage({ image: "https://example.com/p.jpg" }, tmp, "s2");
    expect(String(out.image)).toMatch(/^data:image\/jpeg;base64,/);
  });

  it("inlines a logo slot too", async () => {
    const p = join(tmp, "logo.png");
    writeFileSync(p, TINY_PNG);
    const out = await inlineSceneImage({ logo: p, brand_label: "Kênh" }, tmp, "s4");
    expect(String(out.logo)).toMatch(/^data:image\/png;base64,/);
  });

  it("drops a missing image so the template falls back to icons", async () => {
    const out = await inlineSceneImage({ image: join(tmp, "nope.jpg"), icons: ["🔥"] }, tmp, "s3");
    expect(out.image).toBe("");
    expect(out.icons).toEqual(["🔥"]);
  });
});

describe("autoFindSceneImage", () => {
  it("searches a photo when only image_query is given", async () => {
    nock("https://api.openverse.org").get("/v1/images/").query(true)
      .reply(200, { results: [{ url: "https://img/run.jpg", width: 2000, creator: "Bo", license: "by", source: "flickr" }] });
    const { autoFindSceneImage } = await import("./image-inline.js");
    const r = await autoFindSceneImage({ image_query: "man running sunrise", icons: ["🏃"] }, "portrait", "b1");
    expect(r.inputs.image).toBe("https://img/run.jpg");
    expect(r.credit).toContain("Bo / BY");
  });

  it("keeps an explicit image", async () => {
    const { autoFindSceneImage } = await import("./image-inline.js");
    const r = await autoFindSceneImage({ image: "a.jpg", image_query: "x" }, "portrait", "b2");
    expect(r.inputs.image).toBe("a.jpg");
    expect(r.credit).toBeUndefined();
  });
});
