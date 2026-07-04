import { z } from "zod";

import { MEASUREMENT_RANGES } from "@/utils/measurementRanges";
import { getPasswordRequirementErrors } from "@/utils/passwordValidation";
import { extractPhoneDigits } from "@/utils/phoneFormat";

const requiredText = (fieldLabel: string) => z.string().trim().min(1, `${fieldLabel} es obligatorio.`);

const phoneField = z
  .string()
  .refine((value) => extractPhoneDigits(value).length === 8, {
    message: "Ingresa los 8 dígitos del celular.",
  });

const optionalPhoneField = z
  .string()
  .refine((value) => value === "" || extractPhoneDigits(value).length === 8, {
    message: "Ingresa los 8 dígitos del celular, o deja el campo vacío.",
  });

const passwordField = z.string().superRefine((value, ctx) => {
  const errors = getPasswordRequirementErrors(value);
  if (errors.length > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `La contraseña debe tener ${errors.join(", ")}.`,
    });
  }
});

/** Valida un campo numérico de texto (viene de un AppInput) contra un rango físico plausible. */
function numericRangeField(fieldLabel: string, range: { min: number; max: number }) {
  return z
    .string()
    .min(1, `${fieldLabel} es obligatorio.`)
    .refine((value) => !Number.isNaN(Number(value)), `${fieldLabel} debe ser un valor numérico.`)
    .refine(
      (value) => Number(value) >= range.min && Number(value) <= range.max,
      `${fieldLabel} debe estar entre ${range.min} y ${range.max}.`
    );
}

export const loginSchema = z.object({
  email: requiredText("El correo").pipe(z.string().email("Ingresa un correo válido.")),
  password: requiredText("La contraseña"),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: requiredText("El correo").pipe(z.string().email("Ingresa un correo válido.")),
});
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export const registerCredentialsSchema = z
  .object({
    email: requiredText("El correo").pipe(z.string().email("Ingresa un correo válido.")),
    password: passwordField,
    confirmPassword: requiredText("Repetir la contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });
export type RegisterCredentialsValues = z.infer<typeof registerCredentialsSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: requiredText("La contraseña actual"),
    newPassword: passwordField,
    confirmNewPassword: requiredText("Repetir la nueva contraseña"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmNewPassword"],
  });
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export const registerPersonalSchema = z.object({
  rut: requiredText("El RUT"),
  nombre: requiredText("El nombre"),
  apellidoPaterno: requiredText("El apellido paterno"),
  apellidoMaterno: z.string(),
  telefono: phoneField,
  birthDate: z.date({ message: "Selecciona tu fecha de nacimiento." }),
});
export type RegisterPersonalValues = z.infer<typeof registerPersonalSchema>;

export const addressSchema = z.object({
  regionId: requiredText("La región"),
  comunaId: requiredText("La comuna"),
  calle: requiredText("La calle"),
  numero: requiredText("El número"),
});
export type AddressFormValues = z.infer<typeof addressSchema>;

export const editProfileSchema = z.object({
  nombre: requiredText("El nombre"),
  apellidoPaterno: requiredText("El apellido paterno"),
  apellidoMaterno: z.string(),
  telefonoPrincipal: phoneField,
  telefonoSecundario: optionalPhoneField,
  birthDate: z.date({ message: "Selecciona tu fecha de nacimiento." }),
});
export type EditProfileFormValues = z.infer<typeof editProfileSchema>;

export const glucoseSchema = z.object({
  glucosa: numericRangeField("La glucosa", MEASUREMENT_RANGES.glucosa),
  periodo: requiredText("El período"),
  notas: z.string(),
});
export type GlucoseFormValues = z.infer<typeof glucoseSchema>;

export const vitalSignsSchema = z
  .object({
    sistolica: z.string(),
    diastolica: z.string(),
    temperatura: numericRangeField("La temperatura", MEASUREMENT_RANGES.temperatura),
    peso: numericRangeField("El peso", MEASUREMENT_RANGES.peso),
    notas: z.string(),
  })
  .superRefine((data, ctx) => {
    const hasSistolica = data.sistolica.trim() !== "";
    const hasDiastolica = data.diastolica.trim() !== "";
    if (!hasSistolica && !hasDiastolica) return;

    if (!hasSistolica || !hasDiastolica) {
      const missingField = hasSistolica ? "diastolica" : "sistolica";
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Si registras presión arterial, completa tanto la sistólica como la diastólica.",
        path: [missingField],
      });
      return;
    }

    const range = MEASUREMENT_RANGES.presionSistolica;
    if (Number.isNaN(Number(data.sistolica)) || Number(data.sistolica) < range.min || Number(data.sistolica) > range.max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `La presión sistólica debe estar entre ${range.min} y ${range.max}.`,
        path: ["sistolica"],
      });
    }
    const diastolicRange = MEASUREMENT_RANGES.presionDiastolica;
    if (
      Number.isNaN(Number(data.diastolica)) ||
      Number(data.diastolica) < diastolicRange.min ||
      Number(data.diastolica) > diastolicRange.max
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `La presión diastólica debe estar entre ${diastolicRange.min} y ${diastolicRange.max}.`,
        path: ["diastolica"],
      });
    }
  });
export type VitalSignsFormValues = z.infer<typeof vitalSignsSchema>;

export const cholesterolSchema = z.object({
  colesterolTotal: numericRangeField("El colesterol total", MEASUREMENT_RANGES.colesterolTotal),
  ldl: numericRangeField("El LDL", MEASUREMENT_RANGES.colesterolLDL),
  hdl: numericRangeField("El HDL", MEASUREMENT_RANGES.colesterolHDL),
  triglyceridos: numericRangeField("Los triglicéridos", MEASUREMENT_RANGES.trigliceridos),
  notas: z.string(),
});
export type CholesterolFormValues = z.infer<typeof cholesterolSchema>;

export const addMedicationSchema = z.object({
  medicationName: requiredText("El nombre del medicamento"),
  dose: requiredText("La dosis"),
  frequencyHours: z
    .string()
    .min(1, "La frecuencia es obligatoria.")
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, {
      message: "La frecuencia debe ser un número válido de horas.",
    }),
  startDate: z.date({ message: "Selecciona la fecha de inicio." }),
  endDate: z.date().nullable(),
});
export type AddMedicationFormValues = z.infer<typeof addMedicationSchema>;
