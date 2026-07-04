import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { MedicationCard, type MedicationRecord } from "@/components/MedicationCard";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAuth } from "@/context/AuthContext";
import { apiDelete, apiPatch, ApiError, apiGet } from "@/services/apiClient";
import {
  cancelMedicationReminder,
  notificationsAvailable,
  requestNotificationPermissions,
  scheduleTestNotification,
  syncMedicationReminders,
} from "@/services/notifications";
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

  // Reconcilia los recordatorios locales con los medicamentos activos cada
  // vez que se abre esta pantalla (cubre el caso de que el dispositivo haya
  // perdido los recordatorios, ej. tras reinstalar la app).
  useEffect(() => {
    if (!medicationsQuery.data) return;
    const activeMedications = medicationsQuery.data.filter((item) => item.activo === 1);
    requestNotificationPermissions().then((granted) => {
      if (granted) syncMedicationReminders(activeMedications);
    });
  }, [medicationsQuery.data]);

  function invalidateMedications() {
    queryClient.invalidateQueries({ queryKey: queryKeys.medicationsAll });
    queryClient.invalidateQueries({ queryKey: queryKeys.medicationsActive });
  }

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => apiPatch(`/api/medications/${id}/deactivate`),
    onSuccess: (_data, id) => {
      invalidateMedications();
      cancelMedicationReminder(id);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "No se pudo desactivar el medicamento.";
      Alert.alert("Error", message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiDelete(`/api/medications/${id}`),
    onSuccess: (_data, id) => {
      invalidateMedications();
      cancelMedicationReminder(id);
    },
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

  // TEMPORAL: solo para probar el flujo de notificaciones sin esperar horas.
  // Quitar este botón antes de la entrega final.
  async function handleTestNotification() {
    if (!notificationsAvailable) {
      Alert.alert(
        "No disponible en Expo Go",
        "Android quitó el soporte de notificaciones en Expo Go. Prueba con un development build (expo-dev-client)."
      );
      return;
    }
    const granted = await requestNotificationPermissions();
    if (!granted) {
      Alert.alert("Permiso denegado", "Activa las notificaciones para esta app en el sistema.");
      return;
    }
    await scheduleTestNotification();
    Alert.alert("Programada", "Debería llegar en unos 10 segundos.");
  }

  return (
    <ScreenContainer scrollable>
      <ScreenHeader
        showBackButton
        title="Tratamiento"
        rightIcon="agregar"
        onRightPress={() => router.push("/add-medication")}
      />
      <View style={styles.header}>
        <Text style={styles.title}>Tratamiento</Text>
        <Text style={styles.subtitle}>
          Listado de medicamentos activos y su seguimiento.
        </Text>
        <Pressable onPress={handleTestNotification}>
          <Text style={styles.testLink}>Enviar notificación de prueba (10s)</Text>
        </Pressable>
      </View>

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
  testLink: {
    color: VitaCareTheme.colors.primary,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
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
