import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { IconImage } from "@/components/IconImage";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAuth } from "@/context/AuthContext";
import { apiGet } from "@/services/apiClient";
import { queryKeys } from "@/services/queryKeys";
import { VitaCareTheme } from "@/theme/theme";

/** Campos comunes a los 4 DTOs de medición del BFF. */
type MeasurementBase = {
  idControl: number;
  fechaHora: string;
  notas: string | null;
};

type GlucoseRecord = MeasurementBase & { glucosa: number };
type LipidsRecord = MeasurementBase & {
  colesterolTotal: number;
  colesterolLDL: number;
  colesterolHDL: number;
  trigliceridos: number;
};
type VitalsRecord = MeasurementBase & {
  presionSistolica: number | null;
  presionDiastolica: number | null;
  temperatura: number;
  peso: number;
};

function formatDateTime(fechaHora: string): string {
  const date = new Date(fechaHora);
  return `${date.toLocaleDateString("es-CL")} · ${date.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export default function MeasurementDetailScreen() {
  const { idControl } = useLocalSearchParams<{ idControl?: string }>();
  const targetId = idControl ? Number(idControl) : null;
  const authState = useAuth();
  const enabled = authState.status === "authenticated";

  const glucoseQuery = useQuery({
    queryKey: queryKeys.glucoseList,
    queryFn: () => apiGet<GlucoseRecord[]>("/api/measurements/glucose"),
    enabled,
  });
  const lipidsQuery = useQuery({
    queryKey: queryKeys.lipidsList,
    queryFn: () => apiGet<LipidsRecord[]>("/api/measurements/lipids"),
    enabled,
  });
  const vitalsQuery = useQuery({
    queryKey: queryKeys.vitalsList,
    queryFn: () => apiGet<VitalsRecord[]>("/api/measurements/vitals"),
    enabled,
  });

  const loading = glucoseQuery.isLoading || lipidsQuery.isLoading || vitalsQuery.isLoading;

  const glucose = (glucoseQuery.data ?? []).find((item) => item.idControl === targetId) ?? null;
  const lipids = (lipidsQuery.data ?? []).find((item) => item.idControl === targetId) ?? null;
  const vitals = (vitalsQuery.data ?? []).find((item) => item.idControl === targetId) ?? null;
  const base = glucose ?? lipids ?? vitals;

  if (loading) {
    return (
      <ScreenContainer scrollable>
        <ScreenHeader showBackButton title="Detalle del control" />
        <ActivityIndicator color={VitaCareTheme.colors.primary} style={styles.loader} />
      </ScreenContainer>
    );
  }

  if (!base) {
    return (
      <ScreenContainer scrollable>
        <ScreenHeader showBackButton title="Detalle del control" />
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No se encontró este control</Text>
          <Text style={styles.emptyText}>
            Puede que ya no exista o que aún no se haya cargado en el historial.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable>
      <ScreenHeader showBackButton title="Detalle del control" />
      <View style={styles.header}>
        <Text style={styles.date}>{formatDateTime(base.fechaHora)}</Text>
      </View>

      {vitals?.presionSistolica != null && vitals?.presionDiastolica != null && (
        <DetailCard icon="presion" title="Presión arterial">
          <DetailRow
            label="Valor"
            value={`${vitals.presionSistolica}/${vitals.presionDiastolica} mmHg`}
          />
        </DetailCard>
      )}

      {vitals && (
        <DetailCard icon="temperatura" title="Temperatura y peso">
          <DetailRow label="Temperatura" value={`${vitals.temperatura} °C`} />
          <DetailRow label="Peso" value={`${vitals.peso} kg`} />
        </DetailCard>
      )}

      {glucose && (
        <DetailCard icon="glucosa" title="Glucosa">
          <DetailRow label="Valor" value={`${glucose.glucosa} mg/dL`} />
        </DetailCard>
      )}

      {lipids && (
        <DetailCard icon="corazon" title="Perfil lipídico">
          <DetailRow label="Colesterol total" value={`${lipids.colesterolTotal} mg/dL`} />
          <DetailRow label="LDL" value={`${lipids.colesterolLDL} mg/dL`} />
          <DetailRow label="HDL" value={`${lipids.colesterolHDL} mg/dL`} />
          <DetailRow label="Triglicéridos" value={`${lipids.trigliceridos} mg/dL`} />
        </DetailCard>
      )}

      {base.notas ? (
        <DetailCard icon="nota" title="Notas">
          <Text style={styles.notesText}>{base.notas}</Text>
        </DetailCard>
      ) : null}
    </ScreenContainer>
  );
}

function DetailCard({
  icon,
  title,
  children,
}: Readonly<{ icon: "presion" | "temperatura" | "glucosa" | "corazon" | "nota"; title: string; children: React.ReactNode }>) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <IconImage name={icon} size={22} />
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function DetailRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: VitaCareTheme.spacing.xl,
  },
  header: {
    gap: VitaCareTheme.spacing.xs,
  },
  date: {
    color: VitaCareTheme.colors.primary,
    fontSize: VitaCareTheme.typography.subheading,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "800",
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
    alignItems: "center",
    gap: VitaCareTheme.spacing.sm,
  },
  cardTitle: {
    color: VitaCareTheme.colors.secondary,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "800",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailLabel: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
  detailValue: {
    color: VitaCareTheme.colors.text,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
  notesText: {
    color: VitaCareTheme.colors.text,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
  emptyCard: {
    backgroundColor: VitaCareTheme.colors.surface,
    borderRadius: VitaCareTheme.radius.lg,
    borderWidth: 1,
    borderColor: VitaCareTheme.colors.border,
    padding: VitaCareTheme.spacing.lg,
    gap: VitaCareTheme.spacing.xs,
    ...VitaCareTheme.shadow.card,
  },
  emptyTitle: {
    color: VitaCareTheme.colors.secondary,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "800",
  },
  emptyText: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
});
