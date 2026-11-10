import { readFileSync, existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { eventLabel, parseCsv, parseTracker } from "@/lib/tracker";

const SAMPLE = `First Name,Last Name,Email,,Total,(10/3) NYC Parks (3),(10/24) World Sustainability,10/31
Sanaa,Agarwal,sa9316@stern.nyu.edu,N14773521,9,,3,
Asher,Lee,jl13801@stern.nyu.edu,N14410434,2.5,-1,3.5,
"Ng, Jess",,mn3896@nyu.edu,N1,5,,,
,,,,0,,,
Nobody,Here,,,3,3,,
`;

describe("tracker CSV", () => {
  it("parses quoted cells", () => {
    expect(parseCsv('a,"b,c","d ""e"""\r\n1,2,3')).toEqual([["a", "b,c", 'd "e"'], ["1", "2", "3"]]);
  });
  it("cleans event headers", () => {
    expect(eventLabel("(10/3) NYC Parks (3)")).toEqual({ label: "10/3 NYC Parks", month: 10, day: 3 });
    expect(eventLabel("11/12 Letters of Love")).toMatchObject({ month: 11, day: 12 });
    expect(eventLabel("Card writing")).toMatchObject({ month: null, day: null });
  });
  it("reads people, events, fractional and negative points", () => {
    const t = parseTracker(SAMPLE);
    expect(t.error).toBeNull();
    expect(t.events.map((e) => e.label)).toEqual(["10/3 NYC Parks", "10/24 World Sustainability", "10/31"]);
    expect(t.people.map((p) => p.netId)).toEqual(["sa9316", "jl13801", "mn3896"]);
    expect(t.people[0]).toMatchObject({ name: "Sanaa Agarwal", sheetTotal: 9 });
    expect(t.people[1].entries.map((e) => e.points)).toEqual([-1, 3.5]);
    expect(t.mismatches).toEqual([
      { netId: "sa9316", sheetTotal: 9, sum: 3 },
      { netId: "mn3896", sheetTotal: 5, sum: 0 },
    ]);
    expect(t.invalid).toEqual(["Nobody Here"]);
  });
  it("rejects text without an email column", () => {
    expect(parseTracker("a,b\n1,2").error).toMatch(/Email/);
  });
  const real = "Fall 2026 CS Tracker - Sheet1 (1).csv";
  it.runIf(existsSync(real))("matches every Total in the real tracker", () => {
    const t = parseTracker(readFileSync(real, "utf8"));
    expect(t.people).toHaveLength(110);
    expect(t.mismatches).toEqual([]);
    expect(t.invalid).toEqual([]);
    expect(t.duplicates).toEqual([]);
  });
});
