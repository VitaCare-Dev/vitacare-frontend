import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { IconImage } from "@/components/IconImage";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useAuth } from "@/context/AuthContext";
import { apiGet } from "@/services/apiClient";
import { queryKeys } from "@/services/queryKeys";
import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";

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
  const theme = useTheme();
  const styles = createStyles(theme);
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
  const refreshing =
    glucoseQuery.isRefetching || lipidsQuery.isRefetching || vitalsQuery.isRefetching;

  function handleRefresh() {
    glucoseQuery.refetch();
    lipidsQuery.refetch();
    vitalsQuery.refetch();
  }

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

  return (
    <ScreenContainer scrollable refreshing={refreshing} onRefresh={handleRefresh}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial</Text>
        <Text style={styles.subtitle}>Resumen de controles recientes.</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
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
  loader: {
    marginTop: theme.spacing.xl,
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
  list: {
    gap: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
    ...theme.shadow.card,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  date: {
    color: theme.colors.primary,
    fontSize: theme.typography.body,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "800",
  },
  time: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  metricLabel: {
    flex: 1,
    color: theme.colors.text,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
  },
  metricValue: {
    color: theme.colors.secondary,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "700",
  },
  noteBlock: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.spacing.sm,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  noteText: {
    flex: 1,
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
  },
});
}
