import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { VitaCareTheme } from "@/theme/theme";

type ScreenHeaderProps = Readonly<{
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
}>;

export function ScreenHeader({
  title,
  showBackButton = false,
  onBackPress,
}: ScreenHeaderProps) {
  const router = useRouter();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  if (!showBackButton && !title) {
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

      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: VitaCareTheme.spacing.md,
    paddingVertical: VitaCareTheme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: VitaCareTheme.colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  backText: {
    fontSize: 24,
    color: VitaCareTheme.colors.primary,
    fontWeight: "600",
  },
  title: {
    color: VitaCareTheme.colors.secondary,
    fontSize: 18,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
  spacer: {
    width: 44,
  },
});
