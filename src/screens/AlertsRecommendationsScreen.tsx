import { StyleSheet, Text, View } from "react-native";

import { AlertCard } from "@/components/AlertCard";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { alerts } from "@/data/mockData";
import { VitaCareTheme } from "@/theme/theme";

export default function AlertsRecommendationsScreen() {
  return (
    <ScreenContainer scrollable>
      <ScreenHeader showBackButton title="Alertas" />
      <View style={styles.header}>
        <Text style={styles.title}>Alertas IA</Text>
        <Text style={styles.subtitle}>
          Seguimiento automático de eventos relevantes.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alertas IA</Text>
        <View style={styles.list}>
          {alerts
            .filter((item) => item.type === "alert")
            .map((item) => (
              <AlertCard key={item.id} item={item} />
            ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recomendaciones alimentarias</Text>
        <View style={styles.list}>
          {alerts
            .filter((item) => item.type === "recommendation")
            .map((item) => (
              <AlertCard key={item.id} item={item} />
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
  section: {
    gap: VitaCareTheme.spacing.sm,
  },
  sectionTitle: {
    color: VitaCareTheme.colors.primary,
    fontSize: VitaCareTheme.typography.subheading,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "800",
  },
  list: {
    gap: VitaCareTheme.spacing.md,
  },
});
