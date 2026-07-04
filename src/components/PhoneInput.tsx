import { StyleSheet, Text, TextInput, View } from "react-native";

import { IconImage, IconName } from "@/components/IconImage";
import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";
import {
  extractPhoneDigits,
  formatChileanPhone,
  formatPhoneDigitsForDisplay,
} from "@/utils/phoneFormat";

type PhoneInputProps = Readonly<{
  label: string;
  /** Valor completo, ej. "+56 9 8765 4321" (o "" si está vacío). */
  value: string;
  onChangeText: (value: string) => void;
  icon?: IconName;
  errorMessage?: string;
}>;

/**
 * Input de teléfono chileno con el prefijo "+56 9" fijo (no editable): el
 * usuario solo puede escribir/borrar los 8 dígitos del celular.
 */
export function PhoneInput({
  label,
  value,
  onChangeText,
  icon,
  errorMessage,
}: PhoneInputProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const displayDigits = formatPhoneDigitsForDisplay(extractPhoneDigits(value));

  function handleChange(text: string) {
    onChangeText(formatChileanPhone(text));
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, errorMessage && styles.inputContainerError]}>
        {icon ? <IconImage name={icon} size={18} style={styles.icon} /> : null}
        <Text style={styles.prefix}>+56 9</Text>
        <TextInput
          style={styles.input}
          value={displayDigits}
          onChangeText={handleChange}
          keyboardType="phone-pad"
          placeholder="8765 4321"
          placeholderTextColor={theme.colors.textMuted}
          maxLength={9}
        />
      </View>
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
}

function createStyles(theme: VitaCareThemeType) {
  return StyleSheet.create({
    wrapper: {
      gap: theme.spacing.xs,
    },
    label: {
      fontSize: theme.typography.small,
      color: theme.colors.textMuted,
      fontFamily: theme.typography.fontFamily,
      fontWeight: "600",
    },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.md,
      minHeight: 54,
    },
    inputContainerError: {
      borderColor: "#B54444",
    },
    icon: {
      marginRight: theme.spacing.sm,
    },
    prefix: {
      color: theme.colors.text,
      fontSize: theme.typography.body,
      fontFamily: theme.typography.fontFamily,
      fontWeight: "700",
      marginRight: theme.spacing.sm,
    },
    input: {
      flex: 1,
      color: theme.colors.text,
      fontSize: theme.typography.body,
      fontFamily: theme.typography.fontFamily,
      paddingVertical: theme.spacing.sm,
    },
    errorText: {
      color: "#B54444",
      fontSize: theme.typography.small,
      fontFamily: theme.typography.fontFamily,
    },
  });
}
