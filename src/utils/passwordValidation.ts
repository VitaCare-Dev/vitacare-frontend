/**
 * Devuelve los requisitos que la contraseña NO cumple (lista vacía = válida).
 * Reglas: mínimo 8 caracteres, al menos una mayúscula, una minúscula, un
 * número y un carácter especial.
 */
export function getPasswordRequirementErrors(password: string): string[] {
  const errors: string[] = [];
  if (password.length < 8) errors.push("al menos 8 caracteres");
  if (!/[A-Z]/.test(password)) errors.push("una letra mayúscula");
  if (!/[a-z]/.test(password)) errors.push("una letra minúscula");
  if (!/[0-9]/.test(password)) errors.push("un número");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("un carácter especial");
  return errors;
}

export function isPasswordValid(password: string): boolean {
  return getPasswordRequirementErrors(password).length === 0;
}
