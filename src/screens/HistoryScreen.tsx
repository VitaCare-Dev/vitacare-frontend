import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { IconImage } from "@/components/IconImage";
import { ScreenContainer } from "@/components/ScreenContainer";
import { TrendBarChart, type TrendPoint } from "@/components/TrendBarChart";
import { useAuth } from "@/context/AuthContext";
import { apiGet } from "@/services/apiClient";
import { queryKeys } from "@/services/queryKeys";
import { VitaCareTheme } from "@/theme/theme";
import { MEASUREMENT_RANGES } from "@/utils/measurementRanges";

const TREND_WINDOW_DAYS = 30;

/** Fecha corta "dd/mm" para las etiquetas del gráfico de tendencia. */
function formatShortDate(fechaHora: string): string {
  const date = new Date(fechaHora);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

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

/** Un control de salud con todas las mediciones registradas en ese momento (glucosa/lípidos/vitales combinados por idControl). */
type HistoryEntry = MeasurementBase & {
  glucose?: GlucoseRecord;
  lipids?: LipidsRecord;
  vitals?: VitalsRecord;
};

function formatDate(fechaHora: string): string {
  return new Date(fechaHora).toLocaleDateString("es-CL");
}

function formatTime(fechaHora: string): string {
  return new Date(fechaHora).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
}

export default function HistoryScreen() {
  const router = useRouter();
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

  const entriesByControl = new Map<number, HistoryEntry>();
  function upsert(base: MeasurementBase, patch: Partial<HistoryEntry>) {
    const existing = entriesByControl.get(base.idControl);
    entriesByControl.set(base.idControl, {
      ...base,
      ...existing,
      ...patch,
    });
  }
  (glucoseQuery.data ?? []).forEach((item) => upsert(item, { glucose: item }));
  (lipidsQuery.data ?? []).forEach((item) => upsert(item, { lipids: item }));
  (vitalsQuery.data ?? []).forEach((item) => upsert(item, { vitals: item }));

  const entries = Array.from(entriesByControl.values()).sort(
    (a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime()
  );

  const trendCutoff = Date.now() - TREND_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  const glucoseTrendPoints: TrendPoint[] = (glucoseQuery.data ?? [])
    .filter((item) => new Date(item.fechaHora).getTime() >= trendCutoff)
    .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime())
    .map((item) => ({ label: formatShortDate(item.fechaHora), value: item.glucosa }));

  return (
    <ScreenContainer scrollable>
      <View style={styles.header}>
        <Text style={styles.title}>Historial</Text>
        <Text style={styles.subtitle}>Resumen de controles recientes.</Text>
      </View>

      {!loading && glucoseTrendPoints.length > 1 && (
        <View style={styles.trendCard}>
          <Text style={styles.trendTitle}>Tendencia de glucosa (mg/dL, últimos 30 días)</Text>
          <TrendBarChart points={glucoseTrendPoints} range={MEASUREMENT_RANGES.glucosa} />
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={VitaCareTheme.colors.primary} style={styles.loader} />
      ) : entries.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Aún no tienes controles registrados</Text>
          <Text style={styles.emptyText}>
            Registra una medición (glucosa, colesterol o signos vitales) para verla aquí.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {entries.map((entry) => (
            <Pressable
              key={entry.idControl}
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: "/measurement-detail",
                  params: { idControl: String(entry.idControl) },
                })
              }
            >
              <View style={styles.cardHeader}>
                <Text style={styles.date}>{formatDate(entry.fechaHora)}</Text>
                <Text style={styles.time}>{formatTime(entry.fechaHora)}</Text>
              </View>

              {entry.vitals?.presionSistolica != null && entry.vitals?.presionDiastolica != null && (
                <View style={styles.metricRow}>
                  <IconImage name="presion" size={20} />
                  <Text style={styles.metricLabel}>Presión arterial</Text>
                  <Text style={styles.metricValue}>
                    {entry.vitals.presionSistolica}/{entry.vitals.presionDiastolica} mmHg
                  </Text>
                </View>
              )}
              {entry.vitals && (
                <>
                  <View style={styles.metricRow}>
                    <IconImage name="temperatura" size={20} />
                    <Text style={styles.metricLabel}>Temperatura</Text>
                    <Text style={styles.metricValue}>{entry.vitals.temperatura} °C</Text>
                  </View>
                  <View style={styles.metricRow}>
                    <IconImage name="peso" size={20} />
                    <Text style={styles.metricLabel}>Peso</Text>
                    <Text style={styles.metricValue}>{entry.vitals.peso} kg</Text>
                  </View>
                </>
              )}
              {entry.glucose && (
                <View style={styles.metricRow}>
                  <IconImage name="glucosa" size={20} />
                  <Text style={styles.metricLabel}>Glucosa</Text>
                  <Text style={styles.metricValue}>{entry.glucose.glucosa} mg/dL</Text>
                </View>
              )}
              {entry.lipids && (
                <View style={styles.metricRow}>
                  <IconImage name="corazon" size={20} />
                  <Text style={styles.metricLabel}>Colesterol total</Text>
                  <Text style={styles.metricValue}>{entry.lipids.colesterolTotal} mg/dL</Text>
                </View>
              )}

              {entry.notas ? (
                <View style={styles.noteBlock}>
                  <IconImage name="nota" size={18} />
                  <Text style={styles.noteText}>{entry.notas}</Text>
                </View>
              ) : null}
            </Pressable>
          ))}
        </View>
      )}
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
  loader: {
    marginTop: VitaCareTheme.spacing.xl,
  },
  trendCard: {
    backgroundColor: VitaCareTheme.colors.surface,
    borderRadius: VitaCareTheme.radius.lg,
    borderWidth: 1,
    borderColor: VitaCareTheme.colors.border,
    padding: VitaCareTheme.spacing.md,
    gap: VitaCareTheme.spacing.sm,
    ...VitaCareTheme.shadow.card,
  },
  trendTitle: {
    color: VitaCareTheme.colors.secondary,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
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
