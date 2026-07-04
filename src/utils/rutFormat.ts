/**
 * Formatea un RUT chileno como "12.345.678-9" mientras el usuario escribe.
 * El dígito verificador puede ser 0-9 o "K" (siempre mayúscula) y es siempre
 * el último carácter — el guion se ubica justo antes de él, y el cuerpo lleva
 * puntos de miles.
 */
export function formatRut(input: string): string {
  const clean = input.replace(/[^0-9kK]/g, "").toUpperCase();
  if (clean.length === 0) return "";

  // Máximo 8 dígitos de cuerpo + 1 dígito verificador.
  const limited = clean.slice(0, 9);
  const body = limited.slice(0, -1);
  const checkDigit = limited.slice(-1);

  if (body.length === 0) return checkDigit;

  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${formattedBody}-${checkDigit}`;
}
