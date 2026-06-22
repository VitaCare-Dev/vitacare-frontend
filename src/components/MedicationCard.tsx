import { StyleSheet, Text, View } from "react-native";

import { IconImage } from "@/components/IconImage";
import { VitaCareTheme } from "@/theme/theme";
import type { Medication } from "@/types";

type MedicationCardProps = Readonly<{
  medication: Medication;
}>;

export function MedicationCard({ medication }: MedicationCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <IconImage name="capsulas" size={28} />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{medication.name}</Text>
          <View
            style={[
              styles.badge,
              medication.active ? styles.activeBadge : styles.inactiveBadge,
            ]}
          >
            <Text style={styles.badgeText}>
              {medication.active ? "Activo" : "Inactivo"}
            </Text>
          </View>
        </View>
        <Text style={styles.detail}>{medication.dose}</Text>
        <Text style={styles.detail}>{medication.frequency}</Text>
        <Text style={styles.small}>Inicio: {medication.startDate}</Text>
        <Text style={styles.small}>Término: {medication.endDate}</Text>
        {medication.takenToday ? (
          <Text style={styles.small}>Tomas hoy: {medication.takenToday}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: VitaCareTheme.colors.surface,
    borderRadius: VitaCareTheme.radius.lg,
    borderWidth: 1,
    borderColor: VitaCareTheme.colors.border,
    padding: VitaCareTheme.spacing.md,
    flexDirection: "row",
    gap: VitaCareTheme.spacing.md,
    ...VitaCareTheme.shadow.card,
  },
  iconWrap: {
    width: 40,
    paddingTop: 2,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: VitaCareTheme.spacing.sm,
    alignItems: "flex-start",
  },
  name: {
    flex: 1,
    color: VitaCareTheme.colors.text,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
  detail: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
  small: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: 12,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: VitaCareTheme.spacing.sm,
    paddingVertical: 4,
  },
  activeBadge: {
    backgroundColor: VitaCareTheme.colors.surfaceAlt,
  },
  inactiveBadge: {
    backgroundColor: VitaCareTheme.colors.warning,
  },
  badgeText: {
    color: VitaCareTheme.colors.secondary,
    fontSize: 11,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
});
