import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ApiError, apiGet } from "@/services/apiClient";
import { VitaCareTheme } from "@/theme/theme";

/** Espejo de PatientDto del BFF. */
type PatientRecord = {
  idPaciente: number;
  idUsuario: number;
  rut: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  fechaNacimiento: string;
  telefonoPrincipal: string;
  telefonoSecundario: string | null;
};

/** Espejo de AddressDto del BFF. */
type AddressRecord = {
  calle: string;
  numero: string;
  comuna: string;
  region: string;
};

/** Espejo de DiseaseDto del BFF. */
type DiseaseRecord = {
  idEnfermedad: number;
  nombreEnfermedad: string;
  descripcion: string;
};

/** Espejo de MedicalThresholdDto del BFF. */
type ThresholdRecord = {
  glucosaMin: number;
  glucosaMax: number;
  sistolicaMax: number;
  diastolicaMax: number;
  temperaturaMax: number;
};

/** Espejo de MedicationDto del BFF. */
type MedicationRecord = {
  idMedicamento: number;
  activo: number;
};

export default function MedicalInfoScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<PatientRecord | null>(null);
  const [address, setAddress] = useState<AddressRecord | null>(null);
  const [diseases, setDiseases] = useState<DiseaseRecord[]>([]);
  const [thresholds, setThresholds] = useState<ThresholdRecord | null>(null);
  const [medications, setMedications] = useState<MedicationRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([
        apiGet<PatientRecord>("/api/patients/me"),
        apiGet<AddressRecord[]>("/api/patients/me/addresses").catch(() => []),
        apiGet<DiseaseRecord[]>("/api/patients/me/diseases").catch(() => []),
        apiGet<ThresholdRecord>("/api/patients/me/thresholds").catch((error) =>
          error instanceof ApiError && error.status === 404 ? null : Promise.reject(error)
        ),
        apiGet<MedicationRecord[]>("/api/medications").catch(() => []),
      ])
        .then(([patientData, addresses, diseaseList, thresholdData, medicationList]) => {
          setPatient(patientData);
          setAddress(addresses[0] ?? null);
          setDiseases(diseaseList);
          setThresholds(thresholdData);
          setMedications(medicationList);
        })
        .catch(() => setPatient(null))
        .finally(() => setLoading(false));
    }, [])
  );

  const activeMedications = medications.filter((item) => item.activo === 1);

  if (loading) {
    return (
      <ScreenContainer scrollable>
        <ScreenHeader showBackButton title="Información médica" />
        <ActivityIndicator color={VitaCareTheme.colors.primary} style={styles.loader} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable>
      <ScreenHeader showBackButton title="Información médica" />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Paciente</Text>
        <InfoCard>
          <InfoRow label="Paciente ID" value={String(patient?.idPaciente ?? "-")} />
          <InfoRow label="Usuario ID" value={String(patient?.idUsuario ?? "-")} />
          <InfoRow label="RUT" value={patient?.rut ?? "-"} />
          <InfoRow
            label="Nombre completo"
            value={
              patient
                ? `${patient.nombre} ${patient.apellidoPaterno} ${patient.apellidoMaterno ?? ""}`.trim()
                : "-"
            }
          />
          <InfoRow label="Fecha de nacimiento" value={patient?.fechaNacimiento ?? "-"} />
        </InfoCard>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contacto y dirección</Text>
        <InfoCard>
          <InfoRow label="Teléfono principal" value={patient?.telefonoPrincipal ?? "-"} />
          <InfoRow
            label="Teléfono secundario"
            value={patient?.telefonoSecundario ?? "Sin registrar"}
          />
          <InfoRow label="Calle" value={address?.calle ?? "Sin dirección registrada"} />
          <InfoRow label="Número" value={address?.numero ?? "-"} />
          <InfoRow label="Comuna" value={address?.comuna ?? "-"} />
          <InfoRow label="Región" value={address?.region ?? "-"} />
        </InfoCard>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Enfermedades asociadas</Text>
        <InfoCard>
          {diseases.length > 0 ? (
            diseases.map((disease) => (
              <View key={disease.idEnfermedad} style={styles.diseaseItem}>
                <Text style={styles.diseaseName}>{disease.nombreEnfermedad}</Text>
                <Text style={styles.diseaseDescription}>{disease.descripcion}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.diseaseDescription}>Sin enfermedades registradas</Text>
          )}
        </InfoCard>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Umbrales médicos</Text>
        <InfoCard>
          {thresholds ? (
            <>
              <InfoRow label="Glucosa mínima" value={`${thresholds.glucosaMin} mg/dL`} />
              <InfoRow label="Glucosa máxima" value={`${thresholds.glucosaMax} mg/dL`} />
              <InfoRow label="Sistólica máxima" value={`${thresholds.sistolicaMax} mmHg`} />
              <InfoRow label="Diastólica máxima" value={`${thresholds.diastolicaMax} mmHg`} />
              <InfoRow label="Temperatura máxima" value={`${thresholds.temperaturaMax} °C`} />
            </>
          ) : (
            <Text style={styles.diseaseDescription}>Aún no tienes umbrales calculados</Text>
          )}
        </InfoCard>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tratamiento actual</Text>
        <InfoCard>
          <InfoRow label="Medicamentos activos" value={String(activeMedications.length)} />
          <InfoRow label="Total registrados" value={String(medications.length)} />
        </InfoCard>
      </View>

      <AppButton
        title="Ir a tratamiento"
        icon="medicamento"
        onPress={() => router.push("/treatment")}
      />
    </ScreenContainer>
  );
}

function InfoCard({ children }: Readonly<{ children: React.ReactNode }>) {
  return <View style={styles.card}>{children}</View>;
}

function InfoRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: VitaCareTheme.spacing.xl,
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
  card: {
    backgroundColor: VitaCareTheme.colors.surface,
    borderRadius: VitaCareTheme.radius.lg,
    borderWidth: 1,
    borderColor: VitaCareTheme.colors.border,
    padding: VitaCareTheme.spacing.md,
    gap: VitaCareTheme.spacing.md,
    ...VitaCareTheme.shadow.card,
  },
  infoRow: {
    gap: VitaCareTheme.spacing.xs,
  },
  infoLabel: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
  infoValue: {
    color: VitaCareTheme.colors.text,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
  diseaseItem: {
    gap: 2,
  },
  diseaseName: {
    color: VitaCareTheme.colors.text,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
  diseaseDescription: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
});
