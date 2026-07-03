import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { IconImage, IconName } from "@/components/IconImage";
import { VitaCareTheme } from "@/theme/theme";

type AppButtonProps = Readonly<{
  title: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  icon?: IconName;
  iconTone?: "green" | "white";
  trailing?: ReactNode;
  disabled?: boolean;
}>;

export function AppButton(props: AppButtonProps) {
  const {
    title,
    onPress,
    variant = "primary",
    icon,
    iconTone = "white",
    trailing,
    disabled = false,
  } = props;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.content}>
        {icon ? <IconImage name={icon} tone={iconTone} size={20} /> : null}
        <Text
          style={[
            styles.text,
            variant === "outline" && styles.outlineText,
            variant === "danger" && styles.dangerText,
          ]}
        >
          {title}
        </Text>
        {trailing}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: VitaCareTheme.radius.md,
    paddingVertical: VitaCareTheme.spacing.md,
    paddingHorizontal: VitaCareTheme.spacing.lg,
    minHeight: 52,
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: VitaCareTheme.spacing.sm,
  },
  text: {
    color: VitaCareTheme.colors.surface,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
  primary: {
    backgroundColor: VitaCareTheme.colors.primary,
    ...VitaCareTheme.shadow.button,
  },
  secondary: {
    backgroundColor: VitaCareTheme.colors.secondary,
    ...VitaCareTheme.shadow.button,
  },
  outline: {
    backgroundColor: VitaCareTheme.colors.surface,
    borderWidth: 1,
    borderColor: VitaCareTheme.colors.primary,
  },
  outlineText: {
    color: VitaCareTheme.colors.primary,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  danger: {
    backgroundColor: VitaCareTheme.colors.surface,
    borderWidth: 1,
    borderColor: "#B54444",
  },
  dangerText: {
    color: "#B54444",
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.5,
  },
});
