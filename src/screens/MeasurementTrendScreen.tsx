import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Skeleton } from "@/components/Skeleton";
import { TrendBarChart, type TrendPoint } from "@/components/TrendBarChart";
import { useAuth } from "@/context/AuthContext";
import { apiGet } from "@/services/apiClient";
import { queryKeys } from "@/services/queryKeys";
import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";
import { MEASUREMENT_RANGES } from "@/utils/measurementRanges";

export type MeasurementMetric = "glucosa" | "temperatura" | "peso" | "presion" | "colesterolTotal";

type GlucoseRecord = { fechaHora: string; glucosa: number };
type VitalsRecord = {
  fechaHora: string;
  temperatura: number;
  peso: number;
  presionSistolica: number | null;
  presionDiastolica: number | null;
};
type LipidsRecord = { fechaHora: string; colesterolTotal: number };

/** Espejo de PageResponseDto del BFF. */
type PageResponse<T> = { content: T[] };

/** El gráfico de tendencia quiere el historial completo, no una sola página. */
const TREND_FETCH_SIZE = 1000;

const METRIC_CONFIG: Record<MeasurementMetric, { title: string; unit: string }> = {
  glucosa: { title: "Glucosa", unit: "mg/dL" },
  temperatura: { title: "Temperatura", unit: "°C" },
  peso: { title: "Peso", unit: "kg" },
  presion: { title: "Presión arterial", unit: "mmHg" },
  colesterolTotal: { title: "Colesterol total", unit: "mg/dL" },
};

/** Rangos fijos por métrica, para que el gráfico no exagere diferencias pequeñas. */
const METRIC_RANGE: Record<Exclude<MeasurementMetric, "presion">, { min: number; max: number }> = {
  glucosa: MEASUREMENT_RANGES.glucosa,
  temperatura: MEASUREMENT_RANGES.temperatura,
  peso: MEASUREMENT_RANGES.peso,
  colesterolTotal: MEASUREMENT_RANGES.colesterolTotal,
};

function formatShortDate(fechaHora: string): string {
  const date = new Date(fechaHora);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}`;
}

function toPoints<T extends { fechaHora: string }>(
  data: T[] | undefined,
  pick: (item: T) => number | null
): TrendPoint[] {
  return (data ?? [])
    .slice()
    .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime())
    .map((item) => ({ label: formatShortDate(item.fechaHora), value: pick(item) }))
    .filter((point): point is TrendPoint => point.value != null);
}

export default function MeasurementTrendScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { metric: metricParam } = useLocalSearchParams<{ metric: string }>();
  const metric: MeasurementMetric =
    metricParam && metricParam in METRIC_CONFIG ? (metricParam as MeasurementMetric) : "glucosa";
  const config = METRIC_CONFIG[metric];

  const authState = useAuth();
  const enabled = authState.status === "authenticated";

  const glucoseQuery = useQuery({
    queryKey: [...queryKeys.glucoseList, TREND_FETCH_SIZE],
    queryFn: () =>
      apiGet<PageResponse<GlucoseRecord>>(`/api/measurements/glucose?page=0&size=${TREND_FETCH_SIZE}`),
    enabled: enabled && metric === "glucosa",
  });
  const vitalsQuery = useQuery({
    queryKey: [...queryKeys.vitalsList, TREND_FETCH_SIZE],
    queryFn: () =>
      apiGet<PageResponse<VitalsRecord>>(`/api/measurements/vitals?page=0&size=${TREND_FETCH_SIZE}`),
    enabled: enabled && (metric === "temperatura" || metric === "peso" || metric === "presion"),
  });
  const lipidsQuery = useQuery({
    queryKey: [...queryKeys.lipidsList, TREND_FETCH_SIZE],
    queryFn: () =>
      apiGet<PageResponse<LipidsRecord>>(`/api/measurements/lipids?page=0&size=${TREND_FETCH_SIZE}`),
    enabled: enabled && metric === "colesterolTotal",
  });

  const loading = glucoseQuery.isLoading || vitalsQuery.isLoading || lipidsQuery.isLoading;

  let points: TrendPoint[] = [];
  let diastolicPoints: TrendPoint[] | null = null;

  if (metric === "glucosa") {
    points = toPoints(glucoseQuery.data?.content, (item) => item.glucosa);
  } else if (metric === "temperatura") {
    points = toPoints(vitalsQuery.data?.content, (item) => item.temperatura);
  } else if (metric === "peso") {
    points = toPoints(vitalsQuery.data?.content, (item) => item.peso);
  } else if (metric === "colesterolTotal") {
    points = toPoints(lipidsQuery.data?.content, (item) => item.colesterolTotal);
  } else if (metric === "presion") {
    points = toPoints(vitalsQuery.data?.content, (item) => item.presionSistolica);
    diastolicPoints = toPoints(vitalsQuery.data?.content, (item) => item.presionDiastolica);
  }

  return (
    <ScreenContainer scrollable>
      <ScreenHeader showBackButton title={config.title} />
      <View style={styles.header}>
        <Text style={styles.title}>{config.title}</Text>
        <Text style={styles.subtitle}>Evolución histórica ({config.unit}).</Text>
      </View>

      {loading ? (
        <View testID="trend-skeleton" style={{ gap: theme.spacing.md, marginTop: theme.spacing.md }}>
          <Skeleton width="100%" height={180} borderRadius={16} />
          <Skeleton width="40%" height={13} />
        </View>
      ) : points.length < 2 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Aún no hay suficientes datos</Text>
          <Text style={styles.emptyText}>
            Registra al menos 2 mediciones de {config.title.toLowerCase()} para ver la tendencia.
          </Text>
        </View>
      ) : (
        <View style={styles.chartCard}>
          {diastolicPoints && diastolicPoints.length > 1 ? (
            <>
              <Text style={styles.seriesLabel}>Sistólica</Text>
              <TrendBarChart points={points} range={MEASUREMENT_RANGES.presionSistolica} />
              <Text style={styles.seriesLabel}>Diastólica</Text>
              <TrendBarChart
                points={diastolicPoints}
                color={theme.colors.secondary}
                range={MEASUREMENT_RANGES.presionDiastolica}
              />
            </>
          ) : (
            <TrendBarChart
              points={points}
              range={metric === "presion" ? MEASUREMENT_RANGES.presionSistolica : METRIC_RANGE[metric]}
            />
          )}
        </View>
      )}
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
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
    ...theme.shadow.card,
  },
  emptyTitle: {
    color: theme.colors.secondary,
    fontSize: theme.typography.body,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "800",
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
  },
  chartCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    ...theme.shadow.card,
  },
  seriesLabel: {
    color: theme.colors.secondary,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "700",
  },
});
}
