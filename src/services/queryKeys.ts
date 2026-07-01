export const queryKeys = {
  patientMe: ["patient", "me"] as const,
  patientAddresses: ["patient", "me", "addresses"] as const,
  patientDiseases: ["patient", "me", "diseases"] as const,
  patientThresholds: ["patient", "me", "thresholds"] as const,
  measurementsHistory: ["measurements", "history"] as const,
  latestGlucose: ["measurements", "glucose", "latest"] as const,
  latestLipids: ["measurements", "lipids", "latest"] as const,
  latestVitals: ["measurements", "vitals", "latest"] as const,
  medicationsActive: ["medications", "active"] as const,
  medicationsAll: ["medications", "all"] as const,
};
