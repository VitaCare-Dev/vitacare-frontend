import { chileRegions, getComunasByRegion } from "@/data/chileRegions";

describe("chileRegions", () => {
  it("includes all 16 Chilean regions", () => {
    expect(chileRegions.length).toBe(16);
  });

  it("is sorted by region id", () => {
    const ids = chileRegions.map((region) => region.id);
    const sortedIds = [...ids].sort((a, b) => a.localeCompare(b));
    expect(ids).toEqual(sortedIds);
  });

  it("includes the Región Metropolitana", () => {
    expect(chileRegions.some((region) => region.name.includes("Metropolitana"))).toBe(true);
  });
});

describe("getComunasByRegion", () => {
  it("returns communes belonging to a valid region", () => {
    const [metropolitana] = chileRegions.filter((region) =>
      region.name.includes("Metropolitana")
    );
    const communes = getComunasByRegion(metropolitana.id);
    expect(communes.length).toBeGreaterThan(0);
  });

  it("returns communes sorted alphabetically", () => {
    const [metropolitana] = chileRegions.filter((region) =>
      region.name.includes("Metropolitana")
    );
    const communes = getComunasByRegion(metropolitana.id);
    const names = communes.map((commune) => commune.name);
    const sortedNames = [...names].sort((a, b) => a.localeCompare(b, "es"));
    expect(names).toEqual(sortedNames);
  });

  it("returns an empty array for an unknown region id", () => {
    expect(getComunasByRegion("no-existe")).toEqual([]);
  });
});
