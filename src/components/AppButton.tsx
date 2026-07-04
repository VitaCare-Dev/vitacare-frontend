import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { IconImage, IconName } from "@/components/IconImage";
import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";

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
  const theme = useTheme();
  const styles = createStyles(theme);
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

function createStyles(theme: VitaCareThemeType) {
  return StyleSheet.create({
  button: {
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    minHeight: 52,
    justifyContent: "center",
  },
  content: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  text: {
    color: theme.colors.surface,
    fontSize: theme.typography.body,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "700",
  },
  primary: {
    backgroundColor: theme.colors.primary,
    ...theme.shadow.button,
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
    ...theme.shadow.button,
  },
  outline: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  outlineText: {
    color: theme.colors.primary,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  danger: {
    backgroundColor: theme.colors.surface,
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
}
