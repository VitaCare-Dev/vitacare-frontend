import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import {
    getPatientMedicalProfile,
    useTreatmentMedicationRecords,
} from "@/store/medicalStore";
import { VitaCareTheme } from "@/theme/theme";

export default function MedicalInfoScreen() {
  const router = useRouter();
  const medicalProfile = getPatientMedicalProfile();
  const treatmentMedications = useTreatmentMedicationRecords();
  const activeTreatments = treatmentMedications.filter((item) => item.active);

  return (
    <ScreenContainer scrollable>
      <ScreenHeader showBackButton title="Información médica" />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Paciente</Text>
        <InfoCard>
          <InfoRow
            label="Paciente ID"
            value={String(medicalProfile.patientId)}
          />
          <InfoRow label="Usuario ID" value={String(medicalProfile.userId)} />
          <InfoRow label="RUT" value={medicalProfile.rut} />
          <InfoRow
            label="Nombre completo"
            value={`${medicalProfile.firstName} ${medicalProfile.lastNamePaternal} ${medicalProfile.lastNameMaternal}`}
          />
          <InfoRow
            label="Fecha de nacimiento"
            value={medicalProfile.birthDate}
          />
        </InfoCard>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contacto y dirección</Text>
        <InfoCard>
          <InfoRow
            label="Teléfono principal"
            value={medicalProfile.primaryPhone}
          />
          <InfoRow
            label="Teléfono secundario"
            value={medicalProfile.secondaryPhone}
          />
          <InfoRow label="Calle" value={medicalProfile.address.street} />
          <InfoRow label="Número" value={medicalProfile.address.number} />
          <InfoRow label="Comuna" value={medicalProfile.address.commune} />
          <InfoRow label="Región" value={medicalProfile.address.region} />
        </InfoCard>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Enfermedades asociadas</Text>
        <InfoCard>
          {medicalProfile.diseases.map((disease) => (
            <View key={disease.diseaseId} style={styles.diseaseItem}>
              <Text style={styles.diseaseName}>{disease.name}</Text>
              <Text style={styles.diseaseDescription}>
                {disease.description}
              </Text>
            </View>
          ))}
        </InfoCard>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Umbrales médicos</Text>
        <InfoCard>
          <InfoRow
            label="Glucosa mínima"
            value={`${medicalProfile.thresholds.glucoseMin} mg/dL`}
          />
          <InfoRow
            label="Glucosa máxima"
            value={`${medicalProfile.thresholds.glucoseMax} mg/dL`}
          />
          <InfoRow
            label="Sistólica máxima"
            value={`${medicalProfile.thresholds.systolicMax} mmHg`}
          />
          <InfoRow
            label="Diastólica máxima"
            value={`${medicalProfile.thresholds.diastolicMax} mmHg`}
          />
          <InfoRow
            label="Temperatura máxima"
            value={`${medicalProfile.thresholds.temperatureMax} °C`}
          />
        </InfoCard>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tratamiento actual</Text>
        <InfoCard>
          <InfoRow
            label="Medicamentos activos"
            value={String(activeTreatments.length)}
          />
          <InfoRow
            label="Total registrados"
            value={String(treatmentMedications.length)}
          />
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
