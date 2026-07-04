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
import { cholesterolSchema, type CholesterolFormValues } from "@/utils/formSchemas";

type LipidsPayload = {
  colesterolTotal: number;
  colesterolLDL: number;
  colesterolHDL: number;
  trigliceridos: number;
  notas?: string;
};

export default function CholesterolScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { control, handleSubmit, reset } = useForm<CholesterolFormValues>({
    resolver: zodResolver(cholesterolSchema),
    defaultValues: { colesterolTotal: "", ldl: "", hdl: "", triglyceridos: "", notas: "" },
  });

  const saveMutation = useMutation({
    mutationFn: (payload: LipidsPayload) => apiPost("/api/measurements/lipids", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.measurementsHistory });
      queryClient.invalidateQueries({ queryKey: queryKeys.lipidsList });
      queryClient.invalidateQueries({ queryKey: queryKeys.latestLipids });
      reset();
      Alert.alert("Registro guardado", "Tu perfil lipídico se guardó correctamente.", [
        { text: "Aceptar", onPress: () => router.back() },
      ]);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "No se pudo registrar el colesterol.";
      Alert.alert("Error", message);
    },
  });

  function onSubmit(values: CholesterolFormValues) {
    saveMutation.mutate({
      colesterolTotal: Number(values.colesterolTotal),
      colesterolLDL: Number(values.ldl),
      colesterolHDL: Number(values.hdl),
      trigliceridos: Number(values.triglyceridos),
      notas: values.notas.trim() || undefined,
    });
  }

  return (
    <ScreenContainer scrollable>
      <ScreenHeader showBackButton title="Colesterol y lípidos" />
      <View style={styles.header}>
        <Text style={styles.title}>Nuevo registro</Text>
        <Text style={styles.subtitle}>
          Registra tu perfil lipídico completo.
        </Text>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionLabel}>Valores de sangre</Text>

        <Controller
          control={control}
          name="colesterolTotal"
          render={({ field, fieldState }) => (
            <AppInput
              label="Colesterol Total"
              placeholder="Ej: 200"
              icon="registros"
              value={field.value}
              onChangeText={field.onChange}
              keyboardType="numeric"
              errorMessage={fieldState.error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="ldl"
          render={({ field, fieldState }) => (
            <AppInput
              label="LDL (Colesterol malo)"
              placeholder="Ej: 130"
              icon="registros"
              value={field.value}
              onChangeText={field.onChange}
              keyboardType="numeric"
              errorMessage={fieldState.error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="hdl"
          render={({ field, fieldState }) => (
            <AppInput
              label="HDL (Colesterol bueno)"
              placeholder="Ej: 40"
              icon="registros"
              value={field.value}
              onChangeText={field.onChange}
              keyboardType="numeric"
              errorMessage={fieldState.error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="triglyceridos"
          render={({ field, fieldState }) => (
            <AppInput
              label="Triglicéridos"
              placeholder="Ej: 150"
              icon="registros"
              value={field.value}
              onChangeText={field.onChange}
              keyboardType="numeric"
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
              placeholder="Agrega observaciones relevantes"
              icon="nota"
              value={field.value}
              onChangeText={field.onChange}
              multiline
              numberOfLines={3}
            />
          )}
        />

        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Valores de referencia (mg/dL):</Text>
          <Text style={styles.infoText}>
            • Colesterol Total: &lt;200 (óptimo)
          </Text>
          <Text style={styles.infoText}>• LDL: &lt;100 (óptimo)</Text>
          <Text style={styles.infoText}>
            • HDL: &gt;40 (hombres), &gt;50 (mujeres)
          </Text>
          <Text style={styles.infoText}>• Triglicéridos: &lt;150 (normal)</Text>
        </View>
      </View>

      <AppButton
        title={saveMutation.isPending ? "Guardando..." : "Guardar registro"}
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
    marginBottom: theme.spacing.md,
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
  formCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadow.card,
  },
  sectionLabel: {
    color: theme.colors.secondary,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: theme.typography.fontFamily,
  },
  infoCard: {
    backgroundColor: "#f0f7ff",
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  infoLabel: {
    color: theme.colors.secondary,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: theme.typography.fontFamily,
    marginBottom: theme.spacing.xs,
  },
  infoText: {
    color: theme.colors.text,
    fontSize: 12,
    fontFamily: theme.typography.fontFamily,
    lineHeight: 18,
  },
});
}
