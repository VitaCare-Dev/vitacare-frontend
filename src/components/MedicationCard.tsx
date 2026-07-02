import { Pressable, StyleSheet, Text, View } from "react-native";

import { IconImage } from "@/components/IconImage";
import { VitaCareTheme } from "@/theme/theme";

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
  actions: {
    flexDirection: "row",
    gap: VitaCareTheme.spacing.md,
    paddingTop: VitaCareTheme.spacing.xs,
  },
  actionText: {
    color: VitaCareTheme.colors.primary,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
  actionTextDanger: {
    color: "#B54444",
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
});
