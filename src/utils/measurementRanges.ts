type Range = {
  min: number;
  max: number;
  label: string;
  unit: string;
};

/**
 * Rangos fisiológicamente plausibles (no "normales") para cada medición.
 * El objetivo es atrapar errores de tipeo (ej. "3000" en vez de "300"), no
 * reemplazar el criterio médico — por eso son amplios.
 */
export const MEASUREMENT_RANGES = {
  glucosa: { min: 20, max: 600, label: "La glucosa", unit: "mg/dL" },
  presionSistolica: { min: 60, max: 260, label: "La presión sistólica", unit: "mmHg" },
  presionDiastolica: { min: 30, max: 150, label: "La presión diastólica", unit: "mmHg" },
  temperatura: { min: 30, max: 43, label: "La temperatura", unit: "°C" },
  peso: { min: 2, max: 300, label: "El peso", unit: "kg" },
  colesterolTotal: { min: 50, max: 500, label: "El colesterol total", unit: "mg/dL" },
  colesterolLDL: { min: 20, max: 400, label: "El LDL", unit: "mg/dL" },
  colesterolHDL: { min: 10, max: 150, label: "El HDL", unit: "mg/dL" },
  trigliceridos: { min: 20, max: 1000, label: "Los triglicéridos", unit: "mg/dL" },
} as const satisfies Record<string, Range>;

/** Devuelve un mensaje de error si el valor está fuera del rango plausible, o null si está bien. */
export function validateRange(value: number, range: Range): string | null {
  if (value < range.min || value > range.max) {
    return `${range.label} debe estar entre ${range.min} y ${range.max} ${range.unit}.`;
  }
  return null;
}
