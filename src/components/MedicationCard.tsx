import { Pressable, StyleSheet, Text, View } from "react-native";

import { IconImage } from "@/components/IconImage";
import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";

/** Espejo de MedicationDto del BFF. */
export type MedicationRecord = {
  idMedicamento: number;
  nombreMedicamento: string;
  dosis: string;
  frecuenciaHoras: number;
  fechaInicio: string;
  fechaTermino: string | null;
  activo: number;
};

type MedicationCardProps = Readonly<{
  medication: MedicationRecord;
  onDeactivate?: () => void;
  onDelete?: () => void;
}>;

function formatFrequency(frequencyHours: number): string {
  if (frequencyHours === 24) return "Una vez al día";
  if (frequencyHours === 12) return "Cada 12 horas";
  if (frequencyHours === 8) return "Cada 8 horas";
  return `Cada ${frequencyHours} horas`;
}

export function MedicationCard({ medication, onDeactivate, onDelete }: MedicationCardProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const active = medication.activo === 1;

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <IconImage name="capsulas" size={28} />
      </View>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{medication.nombreMedicamento}</Text>
          <View style={[styles.badge, active ? styles.activeBadge : styles.inactiveBadge]}>
            <Text style={styles.badgeText}>{active ? "Activo" : "Inactivo"}</Text>
          </View>
        </View>
        <Text style={styles.detail}>{medication.dosis}</Text>
        <Text style={styles.detail}>{formatFrequency(medication.frecuenciaHoras)}</Text>
        <Text style={styles.small}>Inicio: {medication.fechaInicio}</Text>
        <Text style={styles.small}>Término: {medication.fechaTermino ?? "Indefinido"}</Text>

        {(onDeactivate || onDelete) && (
          <View style={styles.actions}>
            {active && onDeactivate ? (
              <Pressable onPress={onDeactivate}>
                <Text style={styles.actionText}>Desactivar</Text>
              </Pressable>
            ) : null}
            {onDelete ? (
              <Pressable onPress={onDelete}>
                <Text style={styles.actionTextDanger}>Eliminar</Text>
              </Pressable>
            ) : null}
          </View>
        )}
      </View>
    </View>
  );
}

function createStyles(theme: VitaCareThemeType) {
  return StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    flexDirection: "row",
    gap: theme.spacing.md,
    ...theme.shadow.card,
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
    gap: theme.spacing.sm,
    alignItems: "flex-start",
  },
  name: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "700",
  },
  detail: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
  },
  small: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontFamily: theme.typography.fontFamily,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  activeBadge: {
    backgroundColor: theme.colors.surfaceAlt,
  },
  inactiveBadge: {
    backgroundColor: theme.colors.warning,
  },
  badgeText: {
    color: theme.colors.secondary,
    fontSize: 11,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "700",
  },
  actions: {
    flexDirection: "row",
    gap: theme.spacing.md,
    paddingTop: theme.spacing.xs,
  },
  actionText: {
    color: theme.colors.primary,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "700",
  },
  actionTextDanger: {
    color: "#B54444",
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "700",
  },
});
}
