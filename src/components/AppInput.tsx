import { forwardRef, type ReactNode } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    type TextInputProps,
    View,
} from "react-native";

import { IconImage, IconName } from "@/components/IconImage";
import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";

type AppInputProps = Readonly<
  TextInputProps & {
    label: string;
    icon?: IconName;
    /** Elemento pegado al borde derecho del input, dentro del mismo recuadro (ej. un botón "Mostrar contraseña"). */
    rightElement?: ReactNode;
    /** Mensaje de error (ej. de react-hook-form) mostrado bajo el input, con el borde en rojo. */
    errorMessage?: string;
  }
>;

export const AppInput = forwardRef<TextInput, AppInputProps>(function AppInput(
  { label, icon, rightElement, errorMessage, style, ...props },
  ref,
) {
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputContainer, errorMessage && styles.inputContainerError]}>
        {icon ? <IconImage name={icon} size={18} style={styles.icon} /> : null}
        <TextInput
          ref={ref}
          style={[styles.input, style]}
          placeholderTextColor="#A39F9A"
          {...props}
        />
        {rightElement}
      </View>
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
});

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
