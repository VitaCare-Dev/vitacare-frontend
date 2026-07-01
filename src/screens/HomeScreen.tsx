import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { HealthCard } from "@/components/HealthCard";
import { IconImage, IconName } from "@/components/IconImage";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ApiError, apiGet } from "@/services/apiClient";
import { VitaCareTheme } from "@/theme/theme";

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

type SummaryCard = {
  label: string;
  value: string;
  unit: string;
  icon: IconName;
};

function formatFrequency(frequencyHours: number): string {
  if (frequencyHours === 24) return "Una vez al día";
  if (frequencyHours === 12) return "Cada 12 horas";
  if (frequencyHours === 8) return "Cada 8 horas";
  return `Cada ${frequencyHours} horas`;
}

export default function HomeScreen() {
  const router = useRouter();
  const [patientName, setPatientName] = useState<string | null>(null);
  const [hasMeasurements, setHasMeasurements] = useState<boolean | null>(null);
  const [latestGlucose, setLatestGlucose] = useState<GlucoseRecord | null>(null);
  const [latestVitals, setLatestVitals] = useState<VitalsRecord | null>(null);
  const [activeMedication, setActiveMedication] = useState<MedicationRecord | null>(null);

  useFocusEffect(
    useCallback(() => {
      apiGet<PatientRecord>("/api/patients/me")
        .then((patient) => setPatientName(patient.nombre))
        .catch(() => setPatientName(null));

      apiGet<HealthControlRecord[]>("/api/measurements/history")
        .then((history) => setHasMeasurements(history.length > 0))
        .catch(() => setHasMeasurements(true));

      apiGet<GlucoseRecord>("/api/measurements/glucose/latest")
        .then(setLatestGlucose)
        .catch(() => setLatestGlucose(null));

      apiGet<VitalsRecord>("/api/measurements/vitals/latest")
        .then(setLatestVitals)
        .catch(() => setLatestVitals(null));

      apiGet<MedicationRecord[]>("/api/medications?active=true")
        .then((medications) => setActiveMedication(medications[0] ?? null))
        .catch(() => setActiveMedication(null));
    }, [])
  );

  const summaryCards: SummaryCard[] = [];
  if (latestVitals) {
    if (latestVitals.presionSistolica != null && latestVitals.presionDiastolica != null) {
      summaryCards.push({
        label: "Presión arterial",
        value: `${latestVitals.presionSistolica}/${latestVitals.presionDiastolica}`,
        unit: "mmHg",
        icon: "presion",
      });
    }
    summaryCards.push({
      label: "Temperatura",
      value: String(latestVitals.temperatura),
      unit: "°C",
      icon: "temperatura",
    });
    summaryCards.push({ label: "Peso", value: String(latestVitals.peso), unit: "kg", icon: "peso" });
  }
  if (latestGlucose) {
    summaryCards.push({
      label: "Glucosa",
      value: String(latestGlucose.glucosa),
      unit: "mg/dL",
      icon: "glucosa",
    });
  }

  return (
    <ScreenContainer scrollable>
      <View style={styles.headerRow}>
        <View style={styles.spacer} />
        <Pressable
          onPress={() => router.push("/alerts-recommendations")}
          style={styles.notificationButton}
        >
          <IconImage name="campana" size={28} />
          <View style={styles.notificationBadge} />
        </Pressable>
      </View>

      <View style={styles.greetingBlock}>
        <Text style={styles.greeting}>¡Hola{patientName ? `, ${patientName}` : ""}!</Text>
        <Text style={styles.message}>Hoy es un buen día para cuidarte.</Text>
      </View>

      {hasMeasurements === false ? (
        <View style={styles.ctaCard}>
          <IconImage name="glucosa" size={32} />
          <Text style={styles.ctaTitle}>Aún no tienes mediciones registradas</Text>
          <Text style={styles.ctaText}>
            Registra tu primera medición para empezar a ver tu resumen aquí.
          </Text>
          <AppButton
            title="Registrar mi primera medición"
            onPress={() => router.push("/glucose")}
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
        <View style={styles.nextMedicationCard}>
          <View style={styles.nextMedicationHeader}>
            <IconImage name="medicamento" size={24} />
            <Text style={styles.nextMedicationTime}>
              {activeMedication ? "Medicamento activo" : "Sin pendiente"}
            </Text>
          </View>
          <Text style={styles.nextMedicationTitle}>
            {activeMedication ? activeMedication.nombreMedicamento : "No hay medicamentos activos"}
          </Text>
          <Text style={styles.nextMedicationDetail}>
            {activeMedication
              ? `${activeMedication.dosis} · ${formatFrequency(activeMedication.frecuenciaHoras)}`
              : "Agrega un tratamiento para verlo aquí."}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alerta IA destacada</Text>
        <View style={styles.alertCard}>
          <View style={styles.alertIconWrap}>
            <IconImage name="campana" size={28} />
          </View>
          <View style={styles.alertTextWrap}>
            <Text style={styles.alertTitle}>Presión diastólica elevada</Text>
            <Text style={styles.alertText}>
              Se sugiere repetir el control en reposo y mantener hidratación.
            </Text>
          </View>
        </View>
      </View>

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

const styles = StyleSheet.create({
  ctaCard: {
    alignItems: "center",
    gap: VitaCareTheme.spacing.sm,
    backgroundColor: VitaCareTheme.colors.surfaceSoft,
    borderRadius: VitaCareTheme.radius.lg,
    borderWidth: 1,
    borderColor: VitaCareTheme.colors.border,
    padding: VitaCareTheme.spacing.lg,
    ...VitaCareTheme.shadow.card,
  },
  ctaTitle: {
    color: VitaCareTheme.colors.secondary,
    fontSize: VitaCareTheme.typography.subheading,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "800",
    textAlign: "center",
  },
  ctaText: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
    textAlign: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: VitaCareTheme.spacing.md,
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
    backgroundColor: VitaCareTheme.colors.primary,
  },
  greetingBlock: {
    gap: VitaCareTheme.spacing.xs,
  },
  greeting: {
    color: VitaCareTheme.colors.text,
    fontSize: 26,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "800",
  },
  message: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
  section: {
    gap: VitaCareTheme.spacing.sm,
  },
  sectionTitle: {
    color: VitaCareTheme.colors.secondary,
    fontSize: VitaCareTheme.typography.subheading,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "800",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: VitaCareTheme.spacing.sm,
  },
  nextMedicationCard: {
    backgroundColor: VitaCareTheme.colors.surface,
    borderRadius: VitaCareTheme.radius.lg,
    borderWidth: 1,
    borderColor: VitaCareTheme.colors.border,
    padding: VitaCareTheme.spacing.md,
    gap: VitaCareTheme.spacing.xs,
    ...VitaCareTheme.shadow.card,
  },
  nextMedicationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nextMedicationTime: {
    color: VitaCareTheme.colors.primary,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
  nextMedicationTitle: {
    color: VitaCareTheme.colors.text,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
  nextMedicationDetail: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
  alertCard: {
    flexDirection: "row",
    gap: VitaCareTheme.spacing.md,
    padding: VitaCareTheme.spacing.md,
    borderRadius: VitaCareTheme.radius.lg,
    backgroundColor: "#FFF1D9",
    borderWidth: 1,
    borderColor: "#E9C57B",
  },
  alertIconWrap: {
    width: 32,
  },
  alertTextWrap: {
    flex: 1,
    gap: VitaCareTheme.spacing.xs,
  },
  alertTitle: {
    color: VitaCareTheme.colors.secondary,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "800",
  },
  alertText: {
    color: VitaCareTheme.colors.text,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
});
