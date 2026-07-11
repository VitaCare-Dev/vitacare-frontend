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

/** Calcula el dígito verificador (0-9 o "K") de un cuerpo de RUT según el algoritmo módulo 11. */
function calcularDigitoVerificador(cuerpo: string): string {
  let suma = 0;
  let factor = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const resto = 11 - (suma % 11);
  if (resto === 11) return "0";
  if (resto === 10) return "K";
  return String(resto);
}

/**
 * Valida que un RUT chileno tenga un cuerpo numérico no vacío y un dígito
 * verificador correcto según el algoritmo módulo 11 (DEF-AUTH-03: antes solo
 * se exigía que el campo no estuviera vacío, sin validar el formato real).
 */
export function isValidRut(input: string): boolean {
  const clean = input.replace(/[^0-9kK]/g, "").toUpperCase();
  if (clean.length < 2) return false;

  const body = clean.slice(0, -1);
  const checkDigit = clean.slice(-1);

  if (!/^\d+$/.test(body)) return false;

  return calcularDigitoVerificador(body) === checkDigit;
}
