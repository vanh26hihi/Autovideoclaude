import { describe, it, expect, beforeEach, afterEach } from "vitest";
import nock from "nock";
import { searchImage } from "./image-search.js";

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

  it("falls back to key-less Openverse", async () => {
    nock("https://api.openverse.org").get("/v1/images/").query(true)
      .reply(200, { results: [{ url: "https://img/o.jpg", width: 2000, creator: "Bo", license: "by", source: "flickr" }] });
    const hit = await searchImage("running man");
    expect(hit?.url).toBe("https://img/o.jpg");
    expect(hit?.credit).toBe("Bo / BY (flickr)");
  });

  it("falls back to Wikimedia when Openverse fails", async () => {
    nock("https://api.openverse.org").get("/v1/images/").query(true).reply(500);
    nock("https://commons.wikimedia.org").get("/w/api.php").query(true).reply(200, {
      query: { pages: { "1": { index: 1, imageinfo: [{ mime: "image/jpeg", width: 3000, url: "https://w/o.jpg", thumburl: "https://w/t.jpg" }] } } },
    });
    expect((await searchImage("brain"))?.url).toBe("https://w/t.jpg");
  });

  it("returns null when nothing matches", async () => {
    nock("https://api.openverse.org").get("/v1/images/").query(true).reply(200, { results: [] });
    nock("https://commons.wikimedia.org").get("/w/api.php").query(true).reply(200, {});
    expect(await searchImage("zzzz")).toBeNull();
  });
});
