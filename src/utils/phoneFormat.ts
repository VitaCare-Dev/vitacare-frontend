/**
 * Formatea un teléfono chileno como "+56 9 XXXX XXXX" a partir de los dígitos
 * YA LIMPIOS del abonado (sin prefijo) — típicamente lo que el usuario está
 * tipeando en vivo en PhoneInput, donde el "+56 9" es un texto fijo aparte y
 * nunca forma parte de lo editable. Si el valor puede traer el prefijo (ej.
 * viene del backend), extráelo primero con `extractPhoneDigits`.
 *
 * NO intenta quitar un "56"/"9" inicial: hacerlo aquí rompía números cuyo
 * abonado empieza legítimamente con esos dígitos (ej. 5693 3245), porque el
 * primer "5" y "6" tipeados se interpretaban como si fueran el prefijo de
 * país y se borraban solos mientras el usuario escribía.
 */
export function formatChileanPhone(rawDigits: string): string {
  const digits = rawDigits.replace(/\D/g, "").slice(0, 8);
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
 * Extrae los 8 dígitos del abonado a partir de un valor COMPLETO que puede
 * incluir el prefijo real "+56 9" (ej. lo que devuelve el backend, o el valor
 * ya formateado que guarda el formulario). Quita el código de país/9 una vez,
 * al inicio.
 *
 * No usar esto para sanear lo que el usuario tipea en vivo dentro del input
 * (ver `formatChileanPhone`) — ese texto nunca trae el prefijo, y aplicarle
 * esta misma lógica de todos modos hacía desaparecer números que empiezan
 * con 56/9 apenas se tipeaban esos primeros dígitos.
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
