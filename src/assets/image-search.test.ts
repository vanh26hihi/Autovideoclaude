import { describe, it, expect, beforeEach, afterEach } from "vitest";
import nock from "nock";
import { searchImage, queryVariants } from "./image-search.js";

beforeEach(() => {
  nock.cleanAll();
  delete process.env.PEXELS_API_KEY;
  delete process.env.PIXABAY_API_KEY;
});
afterEach(() => nock.cleanAll());

describe("searchImage", () => {
  it("uses Pexels first when a key is set", async () => {
    process.env.PEXELS_API_KEY = "k";
    nock("https://api.pexels.com").get("/v1/search").query(true)
      .reply(200, { photos: [{ photographer: "Ann", src: { portrait: "https://img/p.jpg", large2x: "https://img/l.jpg" } }] });
    const hit = await searchImage("sleep");
    expect(hit).toEqual({ url: "https://img/p.jpg", provider: "Pexels", credit: "Ann / Pexels" });
  });

  it("falls back to Wikimedia, shortening the query until it matches", async () => {
    nock("https://commons.wikimedia.org").get("/w/api.php")
      .query((q) => String(q.gsrsearch).startsWith("tired man yawning desk")).reply(200, {});
    nock("https://commons.wikimedia.org").get("/w/api.php")
      .query((q) => String(q.gsrsearch).startsWith("tired man yawning ")).reply(200, {});
    nock("https://commons.wikimedia.org").get("/w/api.php")
      .query((q) => String(q.gsrsearch).startsWith("tired man ")).reply(200, {
        query: { pages: { "1": { index: 1, imageinfo: [{ mime: "image/jpeg", width: 3000, url: "https://w/o.jpg", thumburl: "https://w/t.jpg" }] } } },
      });
    expect((await searchImage("tired man yawning desk"))?.url).toBe("https://w/t.jpg");
  });

  it("builds shorter query variants without stop words", () => {
    expect(queryVariants("tired man yawning at desk")).toEqual([
      "tired man yawning at desk", "tired man yawning desk", "tired man yawning", "tired man",
    ]);
  });

  it("returns null when nothing matches", async () => {
    nock("https://commons.wikimedia.org").get("/w/api.php").query(true).times(3).reply(200, {});
    expect(await searchImage("zzzz")).toBeNull();
  });
});
