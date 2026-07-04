import { MEASUREMENT_RANGES, validateRange } from "@/utils/measurementRanges";

describe("validateRange", () => {
  it("returns null when the value is within range", () => {
    expect(validateRange(98, MEASUREMENT_RANGES.glucosa)).toBeNull();
  });

  it("returns null at the exact boundaries", () => {
    expect(validateRange(MEASUREMENT_RANGES.glucosa.min, MEASUREMENT_RANGES.glucosa)).toBeNull();
    expect(validateRange(MEASUREMENT_RANGES.glucosa.max, MEASUREMENT_RANGES.glucosa)).toBeNull();
  });

  it("returns an error message when the value is below the range", () => {
    const error = validateRange(5, MEASUREMENT_RANGES.glucosa);
    expect(error).not.toBeNull();
    expect(error).toContain("20");
    expect(error).toContain("600");
  });

  it("returns an error message when the value is above the range (typo detection)", () => {
    const error = validateRange(3000, MEASUREMENT_RANGES.glucosa);
    expect(error).not.toBeNull();
  });

  it("validates the temperature range independently from glucose", () => {
    expect(validateRange(36.6, MEASUREMENT_RANGES.temperatura)).toBeNull();
    expect(validateRange(90, MEASUREMENT_RANGES.temperatura)).not.toBeNull();
  });
});
