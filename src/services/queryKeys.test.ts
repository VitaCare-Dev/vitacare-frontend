import { queryKeys } from "@/services/queryKeys";

describe("queryKeys", () => {
  it("gives every query key a unique array value", () => {
    const serialized = Object.values(queryKeys).map((key) => JSON.stringify(key));
    expect(new Set(serialized).size).toBe(serialized.length);
  });

  it("scopes every patient-related key under 'patient'", () => {
    expect(queryKeys.patientMe[0]).toBe("patient");
    expect(queryKeys.patientAddresses[0]).toBe("patient");
    expect(queryKeys.patientDiseases[0]).toBe("patient");
    expect(queryKeys.patientThresholds[0]).toBe("patient");
  });

  it("scopes every medication-related key under 'medications'", () => {
    expect(queryKeys.medicationsActive[0]).toBe("medications");
    expect(queryKeys.medicationsAll[0]).toBe("medications");
  });
});
