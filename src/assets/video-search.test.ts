import { describe, it, expect, beforeEach, afterEach } from "vitest";
import nock from "nock";
import { searchVideo, pickRendition, rankVideos, searchTiming, type VideoHit } from "./image-search.js";

searchTiming.gapMs = 0;
searchTiming.retryMs = [1, 1];

beforeEach(() => {
  nock.cleanAll();
  delete process.env.PEXELS_API_KEY;
  delete process.env.PIXABAY_API_KEY;
});
afterEach(() => nock.cleanAll());

const hit = (w: number, h: number, url = `https://v/${w}x${h}.mp4`): VideoHit =>
  ({ url, provider: "x", credit: "x", width: w, height: h, duration: 10 });

describe("pickRendition", () => {
  it("takes the smallest full-HD file (no upscaling)", () => {
    const r = pickRendition([
      { width: 3840, height: 2160 }, { width: 640, height: 360 }, { width: 1280, height: 720 }, { width: 1920, height: 1080 },
    ]);
    expect(r).toEqual({ width: 1920, height: 1080 });
  });
  it("falls back to the biggest when all are small", () => {
    expect(pickRendition([{ width: 640, height: 360 }, { width: 960, height: 540 }])).toEqual({ width: 960, height: 540 });
  });
});

describe("rankVideos", () => {
  it("puts clips matching the frame orientation first", () => {
    const [a, b, c] = [hit(1920, 1080), hit(1080, 1920), hit(1280, 720)];
    expect(rankVideos([a, b, c], "portrait")).toEqual([b, a, c]);
    expect(rankVideos([b, a, c], "landscape")).toEqual([a, c, b]);
  });
});

describe("searchVideo", () => {
  it("returns null without any stock key", async () => {
    expect(await searchVideo("man running")).toBeNull();
  });

  it("finds a Pixabay clip and picks the 1080p rendition", async () => {
    process.env.PIXABAY_API_KEY = "k";
    nock("https://pixabay.com").get("/api/videos/").query(true).reply(200, {
      hits: [{
        user: "Bob", duration: 12,
        videos: {
          large: { url: "https://cdn/l.mp4", width: 1920, height: 1080 },
          medium: { url: "https://cdn/m.mp4", width: 1280, height: 720 },
          small: { url: "https://cdn/s.mp4", width: 960, height: 540 },
          tiny: { url: "", width: 0, height: 0 },
        },
      }],
    });
    const v = await searchVideo("man running sunrise", "landscape");
    expect(v).toMatchObject({ url: "https://cdn/l.mp4", provider: "Pixabay", credit: "Bob / Pixabay", duration: 12 });
  });

  it("retries a 429 from Pixabay", async () => {
    process.env.PIXABAY_API_KEY = "k";
    nock("https://pixabay.com").get("/api/videos/").query(true).reply(429)
      .get("/api/videos/").query(true)
      .reply(200, { hits: [{ user: "Bob", videos: { medium: { url: "https://cdn/m.mp4", width: 1280, height: 720 } } }] });
    expect((await searchVideo("rain", "landscape"))?.url).toBe("https://cdn/m.mp4");
  });

  it("never reuses a clip and prefers another author", async () => {
    process.env.PIXABAY_API_KEY = "k";
    const clip = (user: string, n: number) => ({ user, videos: { large: { url: `https://cdn/${n}.mp4`, width: 1920, height: 1080 } } });
    nock("https://pixabay.com").get("/api/videos/").query(true)
      .reply(200, { hits: [clip("Ann", 1), clip("Ann", 2), clip("Bob", 3)] });
    const used = { urls: new Set(["https://cdn/1.mp4"]), authors: new Set(["Ann / Pixabay"]) };
    expect((await searchVideo("rain", "landscape", 0, used))?.url).toBe("https://cdn/3.mp4");
  });
});
