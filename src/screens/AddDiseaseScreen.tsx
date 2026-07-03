import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAuth } from "@/context/AuthContext";
import { ApiError, apiGet, apiPost } from "@/services/apiClient";
import { queryKeys } from "@/services/queryKeys";
import { VitaCareTheme } from "@/theme/theme";

/** Espejo de DiseaseDto del BFF. */
type DiseaseOption = {
  idEnfermedad: number;
  nombreEnfermedad: string;
  descripcion: string;
};

export default function AddDiseaseScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const authState = useAuth();
  const enabled = authState.status === "authenticated";
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const catalogQuery = useQuery({
    queryKey: ["diseases", "catalog"],
    queryFn: () => apiGet<DiseaseOption[]>("/api/diseases"),
    enabled,
  });
  const registeredQuery = useQuery({
    queryKey: queryKeys.patientDiseases,
    queryFn: () => apiGet<DiseaseOption[]>("/api/patients/me/diseases").catch(() => []),
    enabled,
  });

  const registeredIds = new Set((registeredQuery.data ?? []).map((item) => item.idEnfermedad));
  const availableDiseases = (catalogQuery.data ?? []).filter(
    (disease) => !registeredIds.has(disease.idEnfermedad)
  );

  const loading = catalogQuery.isLoading || registeredQuery.isLoading;

  const addMutation = useMutation({
    mutationFn: (idEnfermedad: number) =>
      apiPost("/api/patients/me/diseases", { idEnfermedad }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patientDiseases });
      queryClient.invalidateQueries({ queryKey: queryKeys.patientThresholds });
      Alert.alert("Enfermedad agregada", "Se agregó correctamente a tu perfil.", [
        { text: "Aceptar", onPress: () => router.back() },
      ]);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "No se pudo agregar la enfermedad.";
      Alert.alert("Error", message);
    },
  });

  return (
    <ScreenContainer scrollable>
      <ScreenHeader showBackButton title="Agregar enfermedad" />
      <View style={styles.header}>
        <Text style={styles.title}>Agregar enfermedad crónica</Text>
        <Text style={styles.subtitle}>
          Puedes seguir más de una enfermedad; esto ajusta tus umbrales médicos y alertas.
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={VitaCareTheme.colors.primary} style={styles.loader} />
      ) : availableDiseases.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Ya tienes todas las enfermedades del catálogo</Text>
          <Text style={styles.emptyText}>No hay más opciones disponibles para agregar.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {availableDiseases.map((disease) => {
            const selected = disease.idEnfermedad === selectedId;
            return (
              <Pressable
                key={disease.idEnfermedad}
                onPress={() => setSelectedId(disease.idEnfermedad)}
                style={[styles.card, selected && styles.cardSelected]}
              >
                <Text style={[styles.cardTitle, selected && styles.cardTitleSelected]}>
                  {disease.nombreEnfermedad}
                </Text>
                <Text style={styles.cardDescription}>{disease.descripcion}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <AppButton
        title={addMutation.isPending ? "Guardando..." : "Agregar"}
        onPress={() => selectedId !== null && addMutation.mutate(selectedId)}
        disabled={selectedId === null || addMutation.isPending || availableDiseases.length === 0}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: VitaCareTheme.spacing.xs,
  },
  title: {
    color: VitaCareTheme.colors.secondary,
    fontSize: 24,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "800",
  },
  subtitle: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
  loader: {
    marginTop: VitaCareTheme.spacing.xl,
  },
  list: {
    gap: VitaCareTheme.spacing.md,
    paddingTop: VitaCareTheme.spacing.lg,
  },
  card: {
    backgroundColor: VitaCareTheme.colors.surface,
    borderRadius: VitaCareTheme.radius.lg,
    borderWidth: 2,
    borderColor: VitaCareTheme.colors.border,
    padding: VitaCareTheme.spacing.md,
    gap: VitaCareTheme.spacing.xs,
    ...VitaCareTheme.shadow.card,
  },
  cardSelected: {
    borderColor: VitaCareTheme.colors.primary,
    backgroundColor: VitaCareTheme.colors.surfaceSoft,
  },
  cardTitle: {
    color: VitaCareTheme.colors.text,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
  cardTitleSelected: {
    color: VitaCareTheme.colors.secondary,
  },
  cardDescription: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
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
