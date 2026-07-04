/**
 * Formatea un teléfono chileno como "+56 9 XXXX XXXX" a partir de los 8
 * dígitos del celular (sin el 9). Devuelve "" si no hay ningún dígito, para
 * no forzar el prefijo en campos opcionales vacíos.
 */
export function formatChileanPhone(rawDigits: string): string {
  const digits = extractPhoneDigits(rawDigits);
  if (digits.length === 0) return "";

  const part1 = digits.slice(0, 4);
  const part2 = digits.slice(4, 8);

  let result = "+56 9";
  if (part1) result += ` ${part1}`;
  if (part2) result += ` ${part2}`;
  return result;
}

/**
 * Extrae solo los 8 dígitos editables del celular a partir de cualquier
 * texto (un valor completo "+56 9 XXXX XXXX", o dígitos sueltos que el
 * usuario esté tipeando). Ignora el código de país/9 si vienen incluidos.
 */
export function extractPhoneDigits(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("56")) digits = digits.slice(2);
  if (digits.startsWith("9")) digits = digits.slice(1);
  return digits.slice(0, 8);
}

/** Agrupa los dígitos del celular como "XXXX XXXX" para mostrarlos en el input editable. */
export function formatPhoneDigitsForDisplay(digits: string): string {
  const part1 = digits.slice(0, 4);
  const part2 = digits.slice(4, 8);
  return part2 ? `${part1} ${part2}` : part1;
}
