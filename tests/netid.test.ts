import { describe, expect, it } from "vitest";
import { canonicalEmail, netIdFromEmail, normalizeNetId, parsePointsImport, parseRoster } from "@/lib/netid";

describe("NetID identity", () => {
  it("treats nyu.edu and stern.nyu.edu as the same person", () => {
    expect(netIdFromEmail("el4640@nyu.edu")).toBe("el4640");
    expect(netIdFromEmail("EL4640@Stern.NYU.edu")).toBe("el4640");
    expect(canonicalEmail("el4640")).toBe("el4640@nyu.edu");
  });
  it("rejects other domains and look-alikes", () => {
    expect(netIdFromEmail("el4640@gmail.com")).toBeNull();
    expect(netIdFromEmail("el4640@nyu.edu.evil.com")).toBeNull();
    expect(netIdFromEmail("el4640@mail.nyu.edu")).toBeNull();
    expect(netIdFromEmail("eric.li@nyu.edu")).toBeNull();
    expect(netIdFromEmail("a@b@nyu.edu")).toBeNull();
  });
  it("normalizes bare NetIDs and emails", () => {
    expect(normalizeNetId(" AB123 ")).toBe("ab123");
    expect(normalizeNetId("ab123@stern.nyu.edu")).toBe("ab123");
    expect(normalizeNetId("hello")).toBeNull();
  });
});

describe("parseRoster", () => {
  it("handles mixed formats, headers and duplicates", () => {
    const { rows, invalid } = parseRoster(
      ["Name,NetID", "Eric Li, el4640", "Ada Lovelace <al123@stern.nyu.edu>", "gh77@nyu.edu", "EL4640@stern.nyu.edu", "not a person"].join("\n"),
    );
    expect(rows).toEqual([
      { netId: "el4640", name: "Eric Li" },
      { netId: "al123", name: "Ada Lovelace" },
      { netId: "gh77", name: null },
    ]);
    expect(invalid).toEqual(["not a person"]);
  });
});

describe("parsePointsImport", () => {
  it("reads netid, name and points in any order", () => {
    const { rows } = parsePointsImport("NetID,Name,Points\nel4640,Eric Li,6\nAda,al123@nyu.edu,-1");
    expect(rows).toEqual([
      { netId: "el4640", name: "Eric Li", points: 6 },
      { netId: "al123", name: "Ada", points: -1 },
    ]);
  });
});
