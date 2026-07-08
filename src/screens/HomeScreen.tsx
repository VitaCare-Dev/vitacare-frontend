import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { AppButton } from "@/components/AppButton";
import { HealthCard } from "@/components/HealthCard";
import { IconImage, IconName } from "@/components/IconImage";
import { ScreenContainer } from "@/components/ScreenContainer";
import { Skeleton } from "@/components/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { ApiError, apiGet, nullOn404 } from "@/services/apiClient";
import { queryKeys } from "@/services/queryKeys";
import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";
import type { MeasurementMetric } from "@/screens/MeasurementTrendScreen";

/** Espejo de PatientDto del BFF. */
type PatientRecord = {
  idPaciente: number;
  nombre: string;
};

/** Espejo de HealthControlDto del BFF. */
type HealthControlRecord = {
  idControl: number;
  idPaciente: number;
  fechaHora: string;
  notas: string | null;
};

/** Espejo de GlucoseDto del BFF. */
type GlucoseRecord = {
  glucosa: number;
};

/** Espejo de LipidsDto del BFF. */
type LipidsRecord = {
  colesterolTotal: number;
};

/** Espejo de VitalsDto del BFF. */
type VitalsRecord = {
  presionSistolica: number | null;
  presionDiastolica: number | null;
  temperatura: number;
  peso: number;
};

/** Espejo de MedicationDto del BFF. */
type MedicationRecord = {
  idMedicamento: number;
  nombreMedicamento: string;
  dosis: string;
  frecuenciaHoras: number;
  activo: number;
};

/** Espejo de AlertaDto del BFF. */
type AlertRecord = {
  idAlertaIa: number;
  motivoAlerta: string;
  recomendacionIa: string;
};

type SummaryCard = {
  label: string;
  value: string;
  unit: string;
  icon: IconName;
  metric: MeasurementMetric;
};

function formatFrequency(frequencyHours: number): string {
  if (frequencyHours === 24) return "Una vez al día";
  if (frequencyHours === 12) return "Cada 12 horas";
  if (frequencyHours === 8) return "Cada 8 horas";
  return `Cada ${frequencyHours} horas`;
}

/** Imita la forma real de Home (saludo, resumen, tratamiento, alerta) mientras cargan los datos. */
function HomeSkeleton() {
  const theme = useTheme();

  return (
    <View style={{ gap: theme.spacing.xl }} testID="home-skeleton">
      <View style={{ gap: theme.spacing.xs }}>
        <Skeleton width="55%" height={26} />
        <Skeleton width="70%" height={16} />
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <Skeleton width="40%" height={18} />
        <View style={{ flexDirection: "row", gap: theme.spacing.sm }}>
          <Skeleton width="48%" height={90} borderRadius={theme.radius.lg} />
          <Skeleton width="48%" height={90} borderRadius={theme.radius.lg} />
        </View>
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <Skeleton width="40%" height={18} />
        <Skeleton width="100%" height={90} borderRadius={theme.radius.lg} />
      </View>

      <View style={{ gap: theme.spacing.sm }}>
        <Skeleton width="45%" height={18} />
        <Skeleton width="100%" height={80} borderRadius={theme.radius.lg} />
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const authState = useAuth();
  const enabled = authState.status === "authenticated";
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = windowWidth - theme.spacing.lg * 2;
  const [activeMedicationPage, setActiveMedicationPage] = useState(0);

  const patientQuery = useQuery({
    queryKey: queryKeys.patientMe,
    queryFn: () => apiGet<PatientRecord>("/api/patients/me"),
    enabled,
  });

  const historyQuery = useQuery({
    queryKey: queryKeys.measurementsHistory,
    queryFn: () => apiGet<HealthControlRecord[]>("/api/measurements/history"),
    enabled,
  });

  // Para los "latest" de mediciones, un 404 significa "todavía no hay dato", no un error real.
  const glucoseQuery = useQuery({
    queryKey: queryKeys.latestGlucose,
    queryFn: () => nullOn404(apiGet<GlucoseRecord>("/api/measurements/glucose/latest")),
    enabled,
  });

  const vitalsQuery = useQuery({
    queryKey: queryKeys.latestVitals,
    queryFn: () => nullOn404(apiGet<VitalsRecord>("/api/measurements/vitals/latest")),
    enabled,
  });

  const lipidsQuery = useQuery({
    queryKey: queryKeys.latestLipids,
    queryFn: () => nullOn404(apiGet<LipidsRecord>("/api/measurements/lipids/latest")),
    enabled,
  });

  const activeMedicationQuery = useQuery({
    queryKey: queryKeys.medicationsActive,
    queryFn: () => apiGet<MedicationRecord[]>("/api/medications?active=true"),
    enabled,
  });

  const unreadAlertsQuery = useQuery({
    queryKey: queryKeys.alertsUnread,
    queryFn: () => apiGet<AlertRecord[]>("/api/alerts/unread"),
    enabled,
  });

  const initialLoading =
    patientQuery.isLoading ||
    historyQuery.isLoading ||
    glucoseQuery.isLoading ||
    vitalsQuery.isLoading ||
    lipidsQuery.isLoading ||
    activeMedicationQuery.isLoading ||
    unreadAlertsQuery.isLoading;

  const refreshing =
    patientQuery.isRefetching ||
    historyQuery.isRefetching ||
    glucoseQuery.isRefetching ||
    vitalsQuery.isRefetching ||
    lipidsQuery.isRefetching ||
    activeMedicationQuery.isRefetching ||
    unreadAlertsQuery.isRefetching;

  // status 0 = falló la conexión (sin internet o el backend no responde), a
  // diferencia de un error normal del servidor (4xx/5xx). Ver apiClient.ts.
  const isOffline = [
    patientQuery,
    historyQuery,
    glucoseQuery,
    vitalsQuery,
    lipidsQuery,
    activeMedicationQuery,
    unreadAlertsQuery,
  ].some((query) => query.error instanceof ApiError && query.error.status === 0);

  function handleRefresh() {
    patientQuery.refetch();
    historyQuery.refetch();
    glucoseQuery.refetch();
    vitalsQuery.refetch();
    lipidsQuery.refetch();
    activeMedicationQuery.refetch();
    unreadAlertsQuery.refetch();
  }

  const hasUnreadAlerts = (unreadAlertsQuery.data?.length ?? 0) > 0;
  const patientName = patientQuery.data?.nombre ?? null;
  const hasMeasurements = historyQuery.data ? historyQuery.data.length > 0 : null;
  const latestGlucose = glucoseQuery.data ?? null;
  const latestVitals = vitalsQuery.data ?? null;
  const latestLipids = lipidsQuery.data ?? null;
  const activeMedications = activeMedicationQuery.data ?? [];

  function handleActiveMedicationScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const page = Math.round(event.nativeEvent.contentOffset.x / cardWidth);
    setActiveMedicationPage(page);
  }

  const summaryCards: SummaryCard[] = [];
  if (latestVitals) {
    if (latestVitals.presionSistolica != null && latestVitals.presionDiastolica != null) {
      summaryCards.push({
        label: "Presión arterial",
        value: `${latestVitals.presionSistolica}/${latestVitals.presionDiastolica}`,
        unit: "mmHg",
        icon: "presion",
        metric: "presion",
      });
    }
    summaryCards.push({
      label: "Temperatura",
      value: String(latestVitals.temperatura),
      unit: "°C",
      icon: "temperatura",
      metric: "temperatura",
    });
    summaryCards.push({
      label: "Peso",
      value: String(latestVitals.peso),
      unit: "kg",
      icon: "peso",
      metric: "peso",
    });
  }
  if (latestGlucose) {
    summaryCards.push({
      label: "Glucosa",
      value: String(latestGlucose.glucosa),
      unit: "mg/dL",
      icon: "glucosa",
      metric: "glucosa",
    });
  }
  if (latestLipids) {
    summaryCards.push({
      label: "Colesterol total",
      value: String(latestLipids.colesterolTotal),
      unit: "mg/dL",
      icon: "corazon",
      metric: "colesterolTotal",
    });
  }

  return (
    <ScreenContainer
      scrollable
      refreshing={refreshing}
      onRefresh={handleRefresh}
      offline={isOffline}
      onRetryOffline={handleRefresh}
    >
      <View style={styles.headerRow}>
        <View style={styles.spacer} />
        <Pressable
          onPress={() => router.push("/alerts-recommendations")}
          style={styles.notificationButton}
          accessibilityLabel={hasUnreadAlerts ? "Tienes alertas sin leer" : "No tienes alertas nuevas"}
        >
          <IconImage
            name={hasUnreadAlerts ? "notificacion-de-campana-en-redes-sociales" : "campana"}
            size={28}
          />
          {hasUnreadAlerts ? <View style={styles.notificationBadge} /> : null}
        </Pressable>
      </View>

      {initialLoading ? (
        <HomeSkeleton />
      ) : (
        <>
      <View style={styles.greetingBlock}>
        <Text style={styles.greeting}>¡Hola{patientName ? `, ${patientName}` : ""}!</Text>
        <Text style={styles.message}>Hoy es un buen día para cuidarte.</Text>
      </View>

      {hasMeasurements === false ? (
        <View style={styles.ctaCard}>
          <IconImage name="agregar" size={32} />
          <Text style={styles.ctaTitle}>Aún no tienes mediciones registradas</Text>
          <Text style={styles.ctaText}>
            Registra tu primera medición para empezar a ver tu resumen aquí.
          </Text>
          <AppButton
            title="Registrar una medición"
            onPress={() => router.push("/health-control")}
          />
        </View>
      ) : (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen de hoy</Text>
          {summaryCards.length > 0 ? (
            <View style={styles.grid}>
              {summaryCards.map((item) => (
                <HealthCard
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  unit={item.unit}
                  icon={item.icon}
                  onPress={() =>
                    router.push({
                      pathname: "/measurement-trend",
                      params: { metric: item.metric },
                    })
                  }
                />
              ))}
            </View>
          ) : (
            <Text style={styles.message}>Aún no hay datos de este tipo registrados.</Text>
          )}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tratamiento activo</Text>
        {activeMedications.length > 1 ? (
          <>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleActiveMedicationScroll}
              style={[{ width: cardWidth }, styles.carouselScroll]}
              contentContainerStyle={styles.carouselContent}
            >
              {activeMedications.map((medication) => (
                <Pressable
                  key={medication.idMedicamento}
                  style={[styles.nextMedicationCard, { width: cardWidth }]}
                  onPress={() => router.push("/treatment")}
                >
                  <View style={styles.nextMedicationHeader}>
                    <IconImage name="medicamento" size={24} />
                    <Text style={styles.nextMedicationTime}>Medicamento activo</Text>
                  </View>
                  <Text style={styles.nextMedicationTitle}>{medication.nombreMedicamento}</Text>
                  <Text style={styles.nextMedicationDetail}>
                    {medication.dosis} · {formatFrequency(medication.frecuenciaHoras)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.dotsRow}>
              {activeMedications.map((medication, index) => (
                <View
                  key={medication.idMedicamento}
                  style={[styles.dot, index === activeMedicationPage && styles.dotActive]}
                />
              ))}
            </View>
          </>
        ) : (
          <Pressable style={styles.nextMedicationCard} onPress={() => router.push("/treatment")}>
            <View style={styles.nextMedicationHeader}>
              <IconImage name="medicamento" size={24} />
              <Text style={styles.nextMedicationTime}>
                {activeMedications[0] ? "Medicamento activo" : "Sin pendiente"}
              </Text>
            </View>
            <Text style={styles.nextMedicationTitle}>
              {activeMedications[0]?.nombreMedicamento ?? "No hay medicamentos activos"}
            </Text>
            <Text style={styles.nextMedicationDetail}>
              {activeMedications[0]
                ? `${activeMedications[0].dosis} · ${formatFrequency(activeMedications[0].frecuenciaHoras)}`
                : "Toca para agregar un tratamiento."}
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alerta IA destacada</Text>
        <Pressable
          style={styles.alertCard}
          onPress={() => router.push("/alerts-recommendations")}
        >
          <View style={styles.alertIconWrap}>
            <IconImage name="campana" size={28} />
          </View>
          <View style={styles.alertTextWrap}>
            <Text style={styles.alertTitle}>
              {unreadAlertsQuery.data?.[0]?.motivoAlerta ?? "Sin alertas nuevas"}
            </Text>
            <Text style={styles.alertText}>
              {unreadAlertsQuery.data?.[0]?.recomendacionIa ??
                "No se han detectado eventos que requieran atención."}
            </Text>
          </View>
        </Pressable>
      </View>
        </>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acceso rápido al asistente IA</Text>
        <AppButton
          title="Abrir VitaCare IA"
          icon="chatbot"
          onPress={() => router.push("/assistant")}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Prestadores de salud</Text>
        <AppButton
          title="Consultar prestadores"
          icon="md-del-usuario"
          onPress={() => router.push("/providers")}
        />
      </View>
    </ScreenContainer>
  );
}

function createStyles(theme: VitaCareThemeType) {
  return StyleSheet.create({
  ctaCard: {
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceSoft,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.lg,
    ...theme.shadow.card,
  },
  ctaTitle: {
    color: theme.colors.secondary,
    fontSize: theme.typography.subheading,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "800",
    textAlign: "center",
  },
  ctaText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    fontFamily: theme.typography.fontFamily,
    textAlign: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: theme.spacing.md,
  },
  spacer: {
    flex: 1,
  },
  notificationButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  greetingBlock: {
    gap: theme.spacing.xs,
  },
  greeting: {
    color: theme.colors.text,
    fontSize: 26,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "800",
  },
  message: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    fontFamily: theme.typography.fontFamily,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.secondary,
    fontSize: theme.typography.subheading,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "800",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.sm,
  },
  nextMedicationCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
    ...theme.shadow.card,
  },
  nextMedicationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  carouselScroll: {
    marginVertical: -theme.spacing.lg,
  },
  carouselContent: {
    paddingVertical: theme.spacing.lg,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.border,
  },
  dotActive: {
    backgroundColor: theme.colors.primary,
  },
  nextMedicationTime: {
    color: theme.colors.primary,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "700",
  },
  nextMedicationTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "700",
  },
  nextMedicationDetail: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
  },
  alertCard: {
    flexDirection: "row",
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    backgroundColor: "#FFF1D9",
    borderWidth: 1,
    borderColor: "#E9C57B",
  },
  alertIconWrap: {
    width: 32,
  },
  alertTextWrap: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  alertTitle: {
    // Color fijo (no sigue el tema): el fondo de esta card es siempre claro
    // (ámbar), así que el texto debe quedarse oscuro también en modo oscuro.
    color: "#3A2E14",
    fontSize: theme.typography.body,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "800",
  },
  alertText: {
    color: "#4A3F2A",
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
  },
});
}
