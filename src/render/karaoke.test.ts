import { describe, it, expect } from "vitest";
import { speechFromSilenceLog, splitClauses, estimateWordTimings, groupLines, buildAss } from "./karaoke.js";

describe("karaoke timing", () => {
  it("turns a silencedetect log into speech segments", () => {
    const log = "[silencedetect] silence_start: 1.5\n[silencedetect] silence_end: 1.8 | silence_duration: 0.3\n";
    expect(speechFromSilenceLog(log, 4)).toEqual([[0, 1.5], [1.8, 4]]);
  });

  it("splits clauses at punctuation", () => {
    expect(splitClauses("Một hai, ba bốn. Năm?")).toEqual([["Một", "hai,"], ["ba", "bốn."], ["Năm?"]]);
  });

  it("pairs clauses with speech segments when counts match", () => {
    const w = estimateWordTimings("Một hai, ba bốn.", [[0, 1], [2, 3]]);
    expect(w.map((x) => x.word)).toEqual(["Một", "hai,", "ba", "bốn."]);
    expect(w[2].start).toBeCloseTo(2);
    expect(w[3].end).toBeCloseTo(3);
  });

  it("falls back to the whole speech span when counts differ", () => {
    const w = estimateWordTimings("Một hai ba bốn.", [[0.2, 1], [1.3, 2.2]]);
    expect(w[0].start).toBeCloseTo(0.2);
    expect(w[3].end).toBeCloseTo(2.2);
  });

  it("groups lines without one-word orphans", () => {
    const words = "a b c d e f".split(" ").map((word, i) => ({ word, start: i, end: i + 1 }));
    expect(groupLines(words, 5).map((l) => l.length)).toEqual([6]);
  });

  it("writes uppercase karaoke events", () => {
    const ass = buildAss([{ word: "bắt", start: 0, end: 0.3 }, { word: "đầu.", start: 0.3, end: 0.7 }], 1920, 1080);
    expect(ass).toContain("Style: Karaoke,Anton,");
    expect(ass).toMatch(/Dialogue: 0,0:00:00\.00,0:00:01\.30,Karaoke,,0,0,0,,\{\\k30\}BẮT \{\\k40\}ĐẦU\./);
  });
});
