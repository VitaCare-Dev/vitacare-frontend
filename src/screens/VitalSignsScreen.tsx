import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Alert, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ApiError, apiPost } from "@/services/apiClient";
import { queryKeys } from "@/services/queryKeys";
import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";
import { vitalSignsSchema, type VitalSignsFormValues } from "@/utils/formSchemas";

type VitalsPayload = {
  presionSistolica?: number;
  presionDiastolica?: number;
  temperatura: number;
  peso: number;
  notas?: string;
};

export default function VitalSignsScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { control, handleSubmit, reset } = useForm<VitalSignsFormValues>({
    resolver: zodResolver(vitalSignsSchema),
    defaultValues: { sistolica: "", diastolica: "", temperatura: "", peso: "", notas: "" },
  });

  const saveMutation = useMutation({
    mutationFn: (payload: VitalsPayload) => apiPost("/api/measurements/vitals", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.measurementsHistory });
      queryClient.invalidateQueries({ queryKey: queryKeys.vitalsList });
      queryClient.invalidateQueries({ queryKey: queryKeys.latestVitals });
      reset();
      Alert.alert("Registro guardado", "Tus signos vitales se guardaron correctamente.", [
        { text: "Aceptar", onPress: () => router.back() },
      ]);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "No se pudo registrar los signos vitales.";
      Alert.alert("Error", message);
    },
  });

  function onSubmit(values: VitalSignsFormValues) {
    const hasPresion = values.sistolica.trim() !== "" && values.diastolica.trim() !== "";
    saveMutation.mutate({
      presionSistolica: hasPresion ? Number(values.sistolica) : undefined,
      presionDiastolica: hasPresion ? Number(values.diastolica) : undefined,
      temperatura: Number(values.temperatura),
      peso: Number(values.peso),
      notas: values.notas.trim() || undefined,
    });
  }

  return (
    <ScreenContainer scrollable>
      <ScreenHeader showBackButton title="Signos vitales" />
      <View style={styles.header}>
        <Text style={styles.title}>Signos vitales</Text>
        <Text style={styles.subtitle}>
          Ingresa los valores medidos en el control.
        </Text>
      </View>

      <View style={styles.card}>
        <Controller
          control={control}
          name="sistolica"
          render={({ field, fieldState }) => (
            <AppInput
              label="Presión sistólica (opcional)"
              placeholder="120"
              keyboardType="numeric"
              icon="presion"
              value={field.value}
              onChangeText={field.onChange}
              errorMessage={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="diastolica"
          render={({ field, fieldState }) => (
            <AppInput
              label="Presión diastólica (opcional)"
              placeholder="80"
              keyboardType="numeric"
              icon="presion"
              value={field.value}
              onChangeText={field.onChange}
              errorMessage={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="temperatura"
          render={({ field, fieldState }) => (
            <AppInput
              label="Temperatura"
              placeholder="36.6"
              keyboardType="decimal-pad"
              icon="corazon"
              value={field.value}
              onChangeText={field.onChange}
              errorMessage={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="peso"
          render={({ field, fieldState }) => (
            <AppInput
              label="Peso"
              placeholder="65.2"
              keyboardType="decimal-pad"
              icon="peso"
              value={field.value}
              onChangeText={field.onChange}
              errorMessage={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="notas"
          render={({ field }) => (
            <AppInput
              label="Notas (opcional)"
              placeholder="Agrega una observación breve"
              icon="nota"
              value={field.value}
              onChangeText={field.onChange}
              multiline
              numberOfLines={3}
            />
          )}
        />
      </View>

      <AppButton
        title={saveMutation.isPending ? "Guardando..." : "Guardar"}
        onPress={handleSubmit(onSubmit)}
        disabled={saveMutation.isPending}
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
    fontSize: 26,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "800",
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    fontFamily: theme.typography.fontFamily,
  },
  card: {
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    ...theme.shadow.card,
  },
});
}
