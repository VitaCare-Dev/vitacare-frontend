import { forwardRef, type ReactNode } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    type TextInputProps,
    View,
} from "react-native";

import { IconImage, IconName } from "@/components/IconImage";
import { VitaCareTheme } from "@/theme/theme";

type AppInputProps = Readonly<
  TextInputProps & {
    label: string;
    icon?: IconName;
    /** Elemento pegado al borde derecho del input, dentro del mismo recuadro (ej. un botón "Mostrar contraseña"). */
    rightElement?: ReactNode;
  }
>;

export const AppInput = forwardRef<TextInput, AppInputProps>(function AppInput(
  { label, icon, rightElement, style, ...props },
  ref,
) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        {icon ? <IconImage name={icon} size={18} style={styles.icon} /> : null}
        <TextInput
          ref={ref}
          style={[styles.input, style]}
          placeholderTextColor="#A39F9A"
          {...props}
        />
        {rightElement}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    gap: VitaCareTheme.spacing.xs,
  },
  label: {
    fontSize: VitaCareTheme.typography.small,
    color: VitaCareTheme.colors.textMuted,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: VitaCareTheme.colors.border,
    borderRadius: VitaCareTheme.radius.md,
    backgroundColor: VitaCareTheme.colors.surface,
    paddingHorizontal: VitaCareTheme.spacing.md,
    minHeight: 54,
  },
  icon: {
    marginRight: VitaCareTheme.spacing.sm,
  },
  input: {
    flex: 1,
    color: VitaCareTheme.colors.text,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
    paddingVertical: VitaCareTheme.spacing.sm,
  },
});
