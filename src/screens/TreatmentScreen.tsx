import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Alert, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { MedicationCard, type MedicationRecord } from "@/components/MedicationCard";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAuth } from "@/context/AuthContext";
import { apiDelete, apiPatch, ApiError, apiGet } from "@/services/apiClient";
import { queryKeys } from "@/services/queryKeys";
import { VitaCareTheme } from "@/theme/theme";

export default function TreatmentScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const authState = useAuth();
  const enabled = authState.status === "authenticated";

  const medicationsQuery = useQuery({
    queryKey: queryKeys.medicationsAll,
    queryFn: () => apiGet<MedicationRecord[]>("/api/medications"),
    enabled,
  });
  const medications = medicationsQuery.data ?? [];

  function invalidateMedications() {
    queryClient.invalidateQueries({ queryKey: queryKeys.medicationsAll });
    queryClient.invalidateQueries({ queryKey: queryKeys.medicationsActive });
  }

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => apiPatch(`/api/medications/${id}/deactivate`),
    onSuccess: invalidateMedications,
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "No se pudo desactivar el medicamento.";
      Alert.alert("Error", message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/medications/${id}`),
    onSuccess: invalidateMedications,
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "No se pudo eliminar el medicamento.";
      Alert.alert("Error", message);
    },
  });

  function confirmDelete(id: number) {
    Alert.alert("Eliminar medicamento", "Esta acción no se puede deshacer. ¿Continuar?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => deleteMutation.mutate(id) },
    ]);
  }

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
            <MedicationCard
              key={item.idMedicamento}
              medication={item}
              onDeactivate={() => deactivateMutation.mutate(item.idMedicamento)}
              onDelete={() => confirmDelete(item.idMedicamento)}
            />
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
