import { StyleSheet, Text, View } from "react-native";

import { IconImage } from "@/components/IconImage";
import { ScreenContainer } from "@/components/ScreenContainer";
import { history } from "@/data/mockData";
import { VitaCareTheme } from "@/theme/theme";

const filters = ["Todos", "Presión", "Glucosa", "Peso"] as const;

export default function HistoryScreen() {
  return (
    <ScreenContainer scrollable>
      <View style={styles.header}>
        <Text style={styles.title}>Historial</Text>
        <Text style={styles.subtitle}>Resumen de controles recientes.</Text>
      </View>

      <View style={styles.filtersRow}>
        {filters.map((filter, index) => (
          <View
            key={filter}
            style={[styles.filterChip, index === 0 && styles.filterActive]}
          >
            <Text
              style={[
                styles.filterText,
                index === 0 && styles.filterTextActive,
              ]}
            >
              {filter}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.list}>
        {history.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.date}>{item.date}</Text>
              <Text style={styles.time}>{item.time}</Text>
            </View>
            <View style={styles.metricRow}>
              <IconImage name="presion" size={20} />
              <Text style={styles.metricLabel}>Presión arterial</Text>
              <Text style={styles.metricValue}>{item.bloodPressure}</Text>
            </View>
            <View style={styles.metricRow}>
              <IconImage name="corazon" size={20} />
              <Text style={styles.metricLabel}>Temperatura</Text>
              <Text style={styles.metricValue}>{item.temperature}</Text>
            </View>
            <View style={styles.metricRow}>
              <IconImage name="peso" size={20} />
              <Text style={styles.metricLabel}>Peso</Text>
              <Text style={styles.metricValue}>{item.weight}</Text>
            </View>
            <View style={styles.metricRow}>
              <IconImage name="glucosa" size={20} />
              <Text style={styles.metricLabel}>Glucosa</Text>
              <Text style={styles.metricValue}>{item.glucose}</Text>
            </View>
            <View style={styles.noteBlock}>
              <IconImage name="nota" size={18} />
              <Text style={styles.noteText}>{item.notes}</Text>
            </View>
          </View>
        ))}
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
  filtersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: VitaCareTheme.spacing.sm,
  },
  filterChip: {
    paddingHorizontal: VitaCareTheme.spacing.md,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: VitaCareTheme.colors.surface,
    borderWidth: 1,
    borderColor: VitaCareTheme.colors.border,
  },
  filterActive: {
    backgroundColor: VitaCareTheme.colors.primary,
    borderColor: VitaCareTheme.colors.primary,
  },
  filterText: {
    color: VitaCareTheme.colors.text,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
  filterTextActive: {
    color: VitaCareTheme.colors.surface,
  },
  list: {
    gap: VitaCareTheme.spacing.md,
  },
  card: {
    backgroundColor: VitaCareTheme.colors.surface,
    borderRadius: VitaCareTheme.radius.lg,
    borderWidth: 1,
    borderColor: VitaCareTheme.colors.border,
    padding: VitaCareTheme.spacing.md,
    gap: VitaCareTheme.spacing.sm,
    ...VitaCareTheme.shadow.card,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  date: {
    color: VitaCareTheme.colors.primary,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "800",
  },
  time: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: VitaCareTheme.spacing.sm,
  },
  metricLabel: {
    flex: 1,
    color: VitaCareTheme.colors.text,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
  metricValue: {
    color: VitaCareTheme.colors.secondary,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
  noteBlock: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: VitaCareTheme.spacing.sm,
    paddingTop: VitaCareTheme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: VitaCareTheme.colors.border,
  },
  noteText: {
    flex: 1,
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
});
