import { Pressable, StyleSheet } from "react-native";

import { IconImage } from "@/components/IconImage";
import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";

type PasswordVisibilityToggleProps = Readonly<{
  visible: boolean;
  onToggle: () => void;
}>;

export function PasswordVisibilityToggle({ visible, onToggle }: PasswordVisibilityToggleProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <Pressable onPress={onToggle} hitSlop={8} style={styles.badge}>
      <IconImage name={visible ? "cerrar-ojo" : "ojo"} size={16} style={styles.icon} />
    </Pressable>
  );
}

function createStyles(theme: VitaCareThemeType) {
  return StyleSheet.create({
  badge: {
    alignSelf: "stretch",
    width: 44,
    marginRight: -theme.spacing.md,
    borderTopRightRadius: theme.radius.md,
    borderBottomRightRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    tintColor: "#FFFFFF",
  },
});
}
