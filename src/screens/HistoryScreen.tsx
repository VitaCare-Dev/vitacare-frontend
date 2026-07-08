import { useQuery } from "@tanstack/react-query";
import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { IconImage } from "@/components/IconImage";
import { InlineErrorNotice } from "@/components/InlineErrorNotice";
import { ScreenContainer } from "@/components/ScreenContainer";
import { Skeleton } from "@/components/Skeleton";
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

/** Espejo de PageResponseDto del BFF. */
type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

type TypeFilter = "todos" | "glucosa" | "lipidos" | "vitales";

const PAGE_SIZE = 10;
/** Tamaño usado por cada endpoint cuando se combinan los 3 tipos ("todos"): acota por fecha, se pagina en el cliente. */
const COMBINED_FETCH_SIZE = 50;

function formatDate(fechaHora: string): string {
  return new Date(fechaHora).toLocaleDateString("es-CL");
}

function formatTime(fechaHora: string): string {
  return new Date(fechaHora).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
}

/** Convierte un Date a "AAAA-MM-DD" (ISO) usando la fecha local, sin corrimiento por timezone. */
function toIsoDate(date: Date): string {
  // No usar toISOString(): convierte a UTC, y en Chile (UTC-3/-4) una fecha
  // elegida en la tarde/noche se corría al día siguiente en el filtro.
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function buildHistoryUrl(
  path: string,
  params: { page: number; size: number; desde: Date | null; hasta: Date | null },
): string {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("size", String(params.size));
  if (params.desde) query.set("desde", toIsoDate(params.desde));
  if (params.hasta) query.set("hasta", toIsoDate(params.hasta));
  return `${path}?${query.toString()}`;
}

function mergeIntoEntries(
  glucose: GlucoseRecord[],
  lipids: LipidsRecord[],
  vitals: VitalsRecord[],
): HistoryEntry[] {
  const entriesByControl = new Map<number, HistoryEntry>();
  function upsert(base: MeasurementBase, patch: Partial<HistoryEntry>) {
    const existing = entriesByControl.get(base.idControl);
    entriesByControl.set(base.idControl, { ...base, ...existing, ...patch });
  }
  glucose.forEach((item) => upsert(item, { glucose: item }));
  lipids.forEach((item) => upsert(item, { lipids: item }));
  vitals.forEach((item) => upsert(item, { vitals: item }));

  return Array.from(entriesByControl.values()).sort(
    (a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime(),
  );
}

export default function HistoryScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const authState = useAuth();
  const enabled = authState.status === "authenticated";

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("todos");
  const [desde, setDesde] = useState<Date | null>(null);
  const [hasta, setHasta] = useState<Date | null>(null);
  const [page, setPage] = useState(0);
  const [showDesdePicker, setShowDesdePicker] = useState(false);
  const [showHastaPicker, setShowHastaPicker] = useState(false);

  const isCombined = typeFilter === "todos";
  const combinedParams = { page: 0, size: COMBINED_FETCH_SIZE, desde, hasta };
  const singleParams = { page, size: PAGE_SIZE, desde, hasta };

  const glucoseQuery = useQuery({
    queryKey: [...queryKeys.glucoseList, isCombined ? combinedParams : singleParams],
    queryFn: () =>
      apiGet<PageResponse<GlucoseRecord>>(
        buildHistoryUrl("/api/measurements/glucose", isCombined ? combinedParams : singleParams),
      ),
    enabled: enabled && (isCombined || typeFilter === "glucosa"),
  });
  const lipidsQuery = useQuery({
    queryKey: [...queryKeys.lipidsList, isCombined ? combinedParams : singleParams],
    queryFn: () =>
      apiGet<PageResponse<LipidsRecord>>(
        buildHistoryUrl("/api/measurements/lipids", isCombined ? combinedParams : singleParams),
      ),
    enabled: enabled && (isCombined || typeFilter === "lipidos"),
  });
  const vitalsQuery = useQuery({
    queryKey: [...queryKeys.vitalsList, isCombined ? combinedParams : singleParams],
    queryFn: () =>
      apiGet<PageResponse<VitalsRecord>>(
        buildHistoryUrl("/api/measurements/vitals", isCombined ? combinedParams : singleParams),
      ),
    enabled: enabled && (isCombined || typeFilter === "vitales"),
  });

  const activeQueries = isCombined
    ? [glucoseQuery, lipidsQuery, vitalsQuery]
    : typeFilter === "glucosa"
      ? [glucoseQuery]
      : typeFilter === "lipidos"
        ? [lipidsQuery]
        : [vitalsQuery];

  const loading = activeQueries.some((query) => query.isLoading);
  const hasError = activeQueries.some((query) => query.isError);
  const refreshing = activeQueries.some((query) => query.isRefetching);

  function handleRefresh() {
    activeQueries.forEach((query) => query.refetch());
  }

  function handleRetry() {
    handleRefresh();
  }

  function changeTypeFilter(next: TypeFilter) {
    setTypeFilter(next);
    setPage(0);
  }

  function onChangeDesde(_event: DateTimePickerChangeEvent, selectedDate?: Date) {
    setShowDesdePicker(false);
    if (selectedDate) {
      setDesde(selectedDate);
      setPage(0);
    }
  }

  function onChangeHasta(_event: DateTimePickerChangeEvent, selectedDate?: Date) {
    setShowHastaPicker(false);
    if (selectedDate) {
      setHasta(selectedDate);
      setPage(0);
    }
  }

  function clearDateRange() {
    setDesde(null);
    setHasta(null);
    setPage(0);
  }

  let entries: HistoryEntry[] = [];
  let totalPages = 0;

  if (!loading && !hasError) {
    if (isCombined) {
      const merged = mergeIntoEntries(
        glucoseQuery.data?.content ?? [],
        lipidsQuery.data?.content ?? [],
        vitalsQuery.data?.content ?? [],
      );
      totalPages = Math.max(1, Math.ceil(merged.length / PAGE_SIZE));
      entries = merged.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
    } else if (typeFilter === "glucosa") {
      entries = mergeIntoEntries(glucoseQuery.data?.content ?? [], [], []);
      totalPages = glucoseQuery.data?.totalPages ?? 0;
    } else if (typeFilter === "lipidos") {
      entries = mergeIntoEntries([], lipidsQuery.data?.content ?? [], []);
      totalPages = lipidsQuery.data?.totalPages ?? 0;
    } else {
      entries = mergeIntoEntries([], [], vitalsQuery.data?.content ?? []);
      totalPages = vitalsQuery.data?.totalPages ?? 0;
    }
  }

  const typeOptions: { value: TypeFilter; label: string }[] = [
    { value: "todos", label: "Todos" },
    { value: "glucosa", label: "Glucosa" },
    { value: "lipidos", label: "Colesterol/lípidos" },
    { value: "vitales", label: "Signos vitales" },
  ];

  return (
    <ScreenContainer scrollable refreshing={refreshing} onRefresh={handleRefresh}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial</Text>
        <Text style={styles.subtitle}>Resumen de controles recientes.</Text>
      </View>

      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Tipo de medición</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterChipRow}>
            {typeOptions.map((option) => (
              <Pressable
                key={option.value}
                style={[styles.filterChip, typeFilter === option.value && styles.filterChipActive]}
                onPress={() => changeTypeFilter(option.value)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    typeFilter === option.value && styles.filterChipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      <View style={styles.dateRangeRow}>
        <Pressable style={styles.dateField} onPress={() => setShowDesdePicker(true)}>
          <View pointerEvents="none">
            <AppInput
              label="Desde"
              placeholder="Sin definir"
              icon="nota"
              value={desde ? formatDate(desde.toISOString()) : ""}
              editable={false}
            />
          </View>
        </Pressable>
        <Pressable style={styles.dateField} onPress={() => setShowHastaPicker(true)}>
          <View pointerEvents="none">
            <AppInput
              label="Hasta"
              placeholder="Sin definir"
              icon="nota"
              value={hasta ? formatDate(hasta.toISOString()) : ""}
              editable={false}
            />
          </View>
        </Pressable>
      </View>
      {desde || hasta ? (
        <Pressable onPress={clearDateRange}>
          <Text style={styles.clearFilters}>Limpiar rango de fechas</Text>
        </Pressable>
      ) : null}

      {showDesdePicker ? (
        <DateTimePicker
          value={desde ?? new Date()}
          mode="date"
          maximumDate={hasta ?? new Date()}
          onValueChange={onChangeDesde}
          onDismiss={() => setShowDesdePicker(false)}
          accentColor={theme.colors.primary}
        />
      ) : null}
      {showHastaPicker ? (
        <DateTimePicker
          value={hasta ?? new Date()}
          mode="date"
          minimumDate={desde ?? undefined}
          maximumDate={new Date()}
          onValueChange={onChangeHasta}
          onDismiss={() => setShowHastaPicker(false)}
          accentColor={theme.colors.primary}
        />
      ) : null}

      {loading ? (
        <View style={styles.list} testID="history-skeleton">
          {[1, 2, 3].map((key) => (
            <View key={key} style={styles.card}>
              <Skeleton width="40%" height={16} />
              <Skeleton width="70%" height={13} />
              <Skeleton width="55%" height={13} />
            </View>
          ))}
        </View>
      ) : hasError ? (
        <InlineErrorNotice
          message="No se pudo cargar el historial. Intenta de nuevo más tarde."
          onRetry={handleRetry}
          retrying={refreshing}
        />
      ) : entries.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Aún no tienes controles registrados</Text>
          <Text style={styles.emptyText}>
            Registra una medición (glucosa, colesterol o signos vitales) para verla aquí.
          </Text>
        </View>
      ) : (
        <>
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

          {totalPages > 1 ? (
            <View style={styles.paginationRow}>
              <AppButton
                title="Anterior"
                variant="outline"
                disabled={page === 0}
                onPress={() => setPage((current) => Math.max(0, current - 1))}
              />
              <Text style={styles.pageIndicator}>
                Página {page + 1} de {totalPages}
              </Text>
              <AppButton
                title="Siguiente"
                variant="outline"
                disabled={page + 1 >= totalPages}
                onPress={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
              />
            </View>
          ) : null}
        </>
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
  filterSection: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  filterLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "700",
  },
  filterChipRow: {
    flexDirection: "row",
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.md,
  },
  filterChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterChipText: {
    color: theme.colors.text,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "700",
  },
  filterChipTextActive: {
    color: theme.colors.surface,
  },
  dateRangeRow: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  dateField: {
    flex: 1,
  },
  clearFilters: {
    color: theme.colors.primary,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "700",
    marginTop: theme.spacing.xs,
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
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
    marginTop: theme.spacing.md,
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
  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  pageIndicator: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "700",
  },
});
}
