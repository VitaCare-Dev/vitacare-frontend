import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Skeleton } from "@/components/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { apiGet, apiPost } from "@/services/apiClient";
import { queryKeys } from "@/services/queryKeys";
import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";

/** Espejo de DiseaseDto del BFF. */
type DiseaseOption = {
  idEnfermedad: number;
  nombreEnfermedad: string;
  descripcion: string;
};

export default function AddDiseaseScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
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
    // El detalle técnico (404/500/etc.) solo queda en consola: al usuario se
    // le muestra un mensaje genérico, nunca el error crudo del backend.
    onError: (error) => {
      console.error("Error al agregar enfermedad:", error);
      Alert.alert("Error", "No se pudo agregar la enfermedad.");
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
        <View style={styles.list} testID="add-disease-skeleton">
          {[1, 2, 3].map((key) => (
            <View key={key} style={styles.card}>
              <Skeleton width="60%" height={18} />
              <Skeleton width="90%" height={14} />
            </View>
          ))}
        </View>
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

function createStyles(theme: VitaCareThemeType) {
  return StyleSheet.create({
  header: {
    gap: theme.spacing.xs,
  },
  title: {
    color: theme.colors.secondary,
    fontSize: 24,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "800",
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    fontFamily: theme.typography.fontFamily,
  },
  list: {
    gap: theme.spacing.md,
    paddingTop: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
    ...theme.shadow.card,
  },
  cardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceSoft,
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "700",
  },
  cardTitleSelected: {
    color: theme.colors.secondary,
  },
  cardDescription: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
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
