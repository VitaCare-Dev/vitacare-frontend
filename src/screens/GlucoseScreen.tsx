import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { IconImage } from "@/components/IconImage";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { glucosePeriods } from "@/data/mockData";
import { ApiError, apiPost } from "@/services/apiClient";
import { queryKeys } from "@/services/queryKeys";
import { VitaCareTheme } from "@/theme/theme";
import type { GlucosePeriod } from "@/types";

/** Mapea el período en español de la UI al enum PeriodoGlucosa del backend. */
const PERIOD_TO_BACKEND: Record<GlucosePeriod, string> = {
  "En ayunas": "AYUNAS",
  "Después de comer": "POSTPRANDIAL",
  "Antes de dormir": "NOCTURNA",
};

export default function GlucoseScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [glucosa, setGlucosa] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState<GlucosePeriod | null>(null);
  const [notas, setNotas] = useState("");

  const saveMutation = useMutation({
    mutationFn: (payload: { glucosa: number; periodo: string; notas?: string }) =>
      apiPost("/api/measurements/glucose", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.measurementsHistory });
      queryClient.invalidateQueries({ queryKey: queryKeys.glucoseList });
      queryClient.invalidateQueries({ queryKey: queryKeys.latestGlucose });
      Alert.alert("Registro guardado", "Tu medición de glucosa se guardó correctamente.", [
        { text: "Aceptar", onPress: () => router.back() },
      ]);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "No se pudo registrar la glucosa.";
      Alert.alert("Error", message, [
        { text: "Reintentar", onPress: handleSave },
        { text: "Cancelar", style: "cancel" },
      ]);
    },
  });

  function handleSave() {
    const glucosaValue = Number(glucosa);
    if (!glucosa.trim() || Number.isNaN(glucosaValue)) {
      Alert.alert("Valor inválido", "Ingresa un valor numérico de glucosa.");
      return;
    }
    if (!selectedPeriod) {
      Alert.alert("Período requerido", "Selecciona el período de la medición.");
      return;
    }

    saveMutation.mutate({
      glucosa: glucosaValue,
      periodo: PERIOD_TO_BACKEND[selectedPeriod],
      notas: notas.trim() || undefined,
    });
  }

  return (
    <ScreenContainer scrollable>
      <ScreenHeader showBackButton title="Glucosa" />
      <View style={styles.header}>
        <Text style={styles.title}>Glucosa</Text>
        <Text style={styles.subtitle}>
          Registra la glicemia y el período correspondiente.
        </Text>
      </View>

      <View style={styles.card}>
        <AppInput
          label="Valor glucosa"
          placeholder="98"
          keyboardType="numeric"
          icon="glucosa"
          value={glucosa}
          onChangeText={setGlucosa}
        />

        <View style={styles.periodSection}>
          {glucosePeriods.map((item, index) => {
            const selected = item.period === selectedPeriod;
            return (
              <Pressable
                key={item.period}
                onPress={() => setSelectedPeriod(item.period)}
                style={[styles.periodCard, selected && styles.periodActive]}
              >
                <View style={styles.periodHeader}>
                  <IconImage
                    name={index === 1 ? "insulina" : "glucosa"}
                    size={22}
                  />
                  <Text style={styles.periodTitle}>{item.period}</Text>
                </View>
                <Text style={styles.periodDescription}>{item.description}</Text>
              </Pressable>
            );
          })}
        </View>

        <AppInput
          label="Notas (opcional)"
          placeholder="Agrega una observación breve"
          icon="nota"
          value={notas}
          onChangeText={setNotas}
          multiline
          numberOfLines={3}
        />
      </View>

      <AppButton
        title={saveMutation.isPending ? "Guardando..." : "Guardar"}
        onPress={handleSave}
        disabled={saveMutation.isPending}
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
    fontSize: 26,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "800",
  },
  subtitle: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
  card: {
    gap: VitaCareTheme.spacing.md,
    backgroundColor: VitaCareTheme.colors.surface,
    borderRadius: VitaCareTheme.radius.lg,
    borderWidth: 1,
    borderColor: VitaCareTheme.colors.border,
    padding: VitaCareTheme.spacing.md,
    ...VitaCareTheme.shadow.card,
  },
  periodSection: {
    gap: VitaCareTheme.spacing.sm,
  },
  periodCard: {
    borderRadius: VitaCareTheme.radius.md,
    borderWidth: 1,
    borderColor: VitaCareTheme.colors.border,
    backgroundColor: VitaCareTheme.colors.background,
    padding: VitaCareTheme.spacing.md,
    gap: VitaCareTheme.spacing.xs,
  },
  periodActive: {
    backgroundColor: VitaCareTheme.colors.surfaceAlt,
    borderColor: VitaCareTheme.colors.primary,
  },
  periodHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: VitaCareTheme.spacing.sm,
  },
  periodTitle: {
    color: VitaCareTheme.colors.text,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
  periodDescription: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
});
