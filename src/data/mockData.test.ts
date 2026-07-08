import {
  glucosePeriods,
  healthControlOptions,
  patient,
  providers,
  summaryMeasurements,
} from "@/data/mockData";

describe("mockData", () => {
  it("exposes a mock patient with the expected fields", () => {
    expect(patient.fullName).toBe("María Carolina Pérez");
    expect(patient.diseases.length).toBeGreaterThan(0);
  });

  it("exposes 4 summary measurements", () => {
    expect(summaryMeasurements).toHaveLength(4);
  });

  it("exposes the 3 glucose measurement periods", () => {
    expect(glucosePeriods).toHaveLength(3);
    expect(glucosePeriods.map((item) => item.period)).toEqual([
      "En ayunas",
      "Después de comer",
      "Antes de dormir",
    ]);
  });

  it("exposes the 4 health control options", () => {
    expect(healthControlOptions).toHaveLength(4);
    expect(healthControlOptions.map((item) => item.key)).toEqual([
      "vitales",
      "glucosa",
      "lipidos",
      "tratamiento",
    ]);
  });

  it("exposes mock providers including a 'not found' case", () => {
    expect(providers.some((provider) => provider.status === "No encontrado")).toBe(true);
  });
});
