import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { IconImage } from "@/components/IconImage";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { healthControlOptions } from "@/data/mockData";
import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";
import type { HealthControlOption } from "@/types";

export default function HealthControlScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();

  const resolveRoute = (key: HealthControlOption["key"]) => {
    switch (key) {
      case "vitales":
        return "/vital-signs";
      case "glucosa":
        return "/glucose";
      case "tratamiento":
        return "/treatment";
      case "lipidos":
        return "/cholesterol";
      default:
        return "/alerts-recommendations";
    }
  };

  return (
    <ScreenContainer scrollable>
      <ScreenHeader />
      <View style={styles.header}>
        <Text style={styles.title}>Nuevo control</Text>
        <Text style={styles.subtitle}>
          Registra la información clínica de hoy.
        </Text>
      </View>

      <View style={styles.formCard}>
        <View style={styles.optionsSection}>
          {healthControlOptions.map((option) => (
            <Pressable
              key={option.key}
              style={styles.optionCard}
              onPress={() => router.push(resolveRoute(option.key))}
            >
              <View style={styles.optionIcon}>
                <IconImage name={option.icon} size={24} />
              </View>
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionTitle}>{option.label}</Text>
                <Text style={styles.optionDesc}>{option.description}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    </ScreenContainer>
  );
}

function createStyles(theme: VitaCareThemeType) {
  return StyleSheet.create({
  header: {
    gap: theme.spacing.xs,
  },
  title: {
    color: theme.colors.secondary,
    fontSize: 26,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "800",
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    fontFamily: theme.typography.fontFamily,
  },
  formCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    ...theme.shadow.card,
  },
  optionsSection: {
    gap: theme.spacing.sm,
  },
  optionCard: {
    flexDirection: "row",
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  optionIcon: {
    width: 28,
    alignItems: "center",
    paddingTop: 2,
  },
  optionTextWrap: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "700",
  },
  optionDesc: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
  },
});
}
