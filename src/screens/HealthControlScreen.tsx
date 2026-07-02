import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { IconImage } from "@/components/IconImage";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { healthControlOptions } from "@/data/mockData";
import { VitaCareTheme } from "@/theme/theme";
import type { HealthControlOption } from "@/types";

export default function HealthControlScreen() {
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

const styles = StyleSheet.create({
  header: {
    gap: VitaCareTheme.spacing.xs,
  },
  title: {
    color: VitaCareTheme.colors.secondary,
    fontSize: 26,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "800",
  },
  subtitle: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
  formCard: {
    backgroundColor: VitaCareTheme.colors.surface,
    borderRadius: VitaCareTheme.radius.lg,
    borderWidth: 1,
    borderColor: VitaCareTheme.colors.border,
    padding: VitaCareTheme.spacing.md,
    gap: VitaCareTheme.spacing.md,
    ...VitaCareTheme.shadow.card,
  },
  optionsSection: {
    gap: VitaCareTheme.spacing.sm,
  },
  optionCard: {
    flexDirection: "row",
    gap: VitaCareTheme.spacing.md,
    padding: VitaCareTheme.spacing.md,
    borderRadius: VitaCareTheme.radius.md,
    borderWidth: 1,
    borderColor: VitaCareTheme.colors.border,
    backgroundColor: VitaCareTheme.colors.background,
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
    color: VitaCareTheme.colors.text,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
  optionDesc: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
});
