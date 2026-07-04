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
import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";

export default function TreatmentScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
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

  function handleRefresh() {
    medicationsQuery.refetch();
  }

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
    <ScreenContainer
      scrollable
      refreshing={medicationsQuery.isRefetching}
      onRefresh={handleRefresh}
    >
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
  testLink: {
    color: theme.colors.primary,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "700",
  },
  list: {
    gap: theme.spacing.md,
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
});
}
