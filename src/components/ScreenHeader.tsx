import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { IconImage, type IconName } from "@/components/IconImage";
import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";

type ScreenHeaderProps = Readonly<{
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightIcon?: IconName;
  onRightPress?: () => void;
}>;

export function ScreenHeader({
  title,
  showBackButton = false,
  onBackPress,
  rightIcon,
  onRightPress,
}: ScreenHeaderProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  if (!showBackButton && !title && !rightIcon) {
    return null;
  }

  return (
    <View style={styles.header}>
      {showBackButton ? (
        <Pressable onPress={handleBackPress} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
      ) : (
        <View style={styles.spacer} />
      )}

      {title && <Text style={styles.title}>{title}</Text>}

      {rightIcon ? (
        <Pressable onPress={onRightPress} style={styles.rightButton}>
          <IconImage name={rightIcon} size={24} />
        </Pressable>
      ) : (
        <View style={styles.spacer} />
      )}
    </View>
  );
}

function createStyles(theme: VitaCareThemeType) {
  return StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  backText: {
    fontSize: 24,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  rightButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    color: theme.colors.secondary,
    fontSize: 18,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "700",
  },
  spacer: {
    width: 44,
  },
});
}
