import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { MedicationCard } from "@/components/MedicationCard";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useTreatmentMedications } from "@/store/medicalStore";
import { VitaCareTheme } from "@/theme/theme";

export default function TreatmentScreen() {
  const router = useRouter();
  const medications = useTreatmentMedications();

  return (
    <ScreenContainer scrollable>
      <ScreenHeader showBackButton title="Tratamiento" />
      <View style={styles.header}>
        <Text style={styles.title}>Tratamiento</Text>
        <Text style={styles.subtitle}>
          Listado de medicamentos activos y su seguimiento.
        </Text>
      </View>

      <AppButton
        title="Agregar medicamento"
        icon="agregar"
        onPress={() => router.push("/add-medication")}
      />

      <View style={styles.list}>
        {medications.length ? (
          medications.map((item) => (
            <MedicationCard key={item.id} medication={item} />
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>
              No hay medicamentos registrados
            </Text>
            <Text style={styles.emptyText}>
              Agrega un tratamiento para comenzar el seguimiento.
            </Text>
          </View>
        )}
      </View>
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
  list: {
    gap: VitaCareTheme.spacing.md,
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
