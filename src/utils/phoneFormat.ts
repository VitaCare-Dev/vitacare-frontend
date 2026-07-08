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

  // part1 siempre tiene al menos 1 carácter aquí (ya se cortó arriba si
  // digits estaba vacío), así que solo part2 puede faltar.
  let result = `+56 9 ${part1}`;
  if (part2) result += ` ${part2}`;
  return result;
}

/**
 * Extrae solo los 8 dígitos editables del celular a partir de cualquier
 * texto (un valor completo "+56 9 XXXX XXXX", o dígitos sueltos que el
 * usuario esté tipeando). Ignora el código de país/9 si vienen incluidos.
 *
 * El "56" y el "9" solo se quitan cuando hay MÁS de 8 dígitos (o sea, cuando
 * realmente vienen pegados como prefijo, ej. un copy/paste del número
 * completo). Con 8 dígitos o menos son parte del número que el usuario está
 * tipeando: sin esta condición, un celular legítimo como +56 9 9843 7654 (o
 * uno que empiece con 56) era imposible de ingresar, porque sus primeros
 * dígitos se descartaban como si fueran el prefijo.
 */
export function extractPhoneDigits(input: string): string {
  let digits = input.replace(/\D/g, "");
  if (digits.length > 8 && digits.startsWith("56")) digits = digits.slice(2);
  if (digits.length > 8 && digits.startsWith("9")) digits = digits.slice(1);
  return digits.slice(0, 8);
}

/** Agrupa los dígitos del celular como "XXXX XXXX" para mostrarlos en el input editable. */
export function formatPhoneDigitsForDisplay(digits: string): string {
  const part1 = digits.slice(0, 4);
  const part2 = digits.slice(4, 8);
  return part2 ? `${part1} ${part2}` : part1;
}
