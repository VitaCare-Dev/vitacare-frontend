import { Pressable, StyleSheet } from "react-native";

import { IconImage } from "@/components/IconImage";
import { VitaCareTheme } from "@/theme/theme";

type PasswordVisibilityToggleProps = Readonly<{
  visible: boolean;
  onToggle: () => void;
}>;

export function PasswordVisibilityToggle({ visible, onToggle }: PasswordVisibilityToggleProps) {
  return (
    <Pressable onPress={onToggle} hitSlop={8} style={styles.badge}>
      <IconImage name={visible ? "cerrar-ojo" : "ojo"} size={16} style={styles.icon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "stretch",
    width: 44,
    marginRight: -VitaCareTheme.spacing.md,
    borderTopRightRadius: VitaCareTheme.radius.md,
    borderBottomRightRadius: VitaCareTheme.radius.md,
    backgroundColor: VitaCareTheme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    tintColor: "#FFFFFF",
  },
});
