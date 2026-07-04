import { StyleSheet, Text, View } from "react-native";

import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";

type Requirement = { label: string; test: (password: string) => boolean };

const REQUIREMENTS: Requirement[] = [
  { label: "Mínimo 8 caracteres", test: (password) => password.length >= 8 },
  { label: "Una letra mayúscula", test: (password) => /[A-Z]/.test(password) },
  { label: "Una letra minúscula", test: (password) => /[a-z]/.test(password) },
  { label: "Un número", test: (password) => /[0-9]/.test(password) },
  { label: "Un carácter especial", test: (password) => /[^A-Za-z0-9]/.test(password) },
];

type PasswordRequirementsChecklistProps = Readonly<{
  password: string;
}>;

/**
 * Lista de requisitos de la contraseña, como una casilla de progreso: gris
 * mientras no se cumple, verde al cumplirse. Evita el rojo (reservado para
 * errores reales) para no dar una sensación de alarma apenas se empieza a
 * escribir.
 */
export function PasswordRequirementsChecklist({ password }: PasswordRequirementsChecklistProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      {REQUIREMENTS.map((requirement) => {
        const met = requirement.test(password);
        return (
          <View key={requirement.label} style={styles.row}>
            <View style={[styles.bulletCircle, met && styles.bulletCircleMet]}>
              {met ? <Text style={styles.bulletCheck}>✓</Text> : null}
            </View>
            <Text style={met ? styles.metText : styles.pendingText}>{requirement.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

function createStyles(theme: VitaCareThemeType) {
  return StyleSheet.create({
    container: {
      gap: theme.spacing.xs,
      marginTop: -theme.spacing.sm,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: theme.spacing.sm,
    },
    bulletCircle: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      justifyContent: "center",
      alignItems: "center",
    },
    bulletCircleMet: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    bulletCheck: {
      color: theme.colors.surface,
      fontSize: 10,
      fontWeight: "700",
      lineHeight: 11,
    },
    metText: {
      color: theme.colors.primary,
      fontSize: theme.typography.small,
      fontFamily: theme.typography.fontFamily,
      fontWeight: "600",
    },
    pendingText: {
      color: theme.colors.textMuted,
      fontSize: theme.typography.small,
      fontFamily: theme.typography.fontFamily,
    },
  });
}
