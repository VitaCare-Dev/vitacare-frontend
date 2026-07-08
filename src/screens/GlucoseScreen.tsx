import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { IconImage } from "@/components/IconImage";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { glucosePeriods } from "@/data/mockData";
import { apiPost } from "@/services/apiClient";
import { queryKeys } from "@/services/queryKeys";
import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";
import type { GlucosePeriod } from "@/types";
import { glucoseSchema, type GlucoseFormValues } from "@/utils/formSchemas";

/** Mapea el período en español de la UI al enum PeriodoGlucosa del backend. */
const PERIOD_TO_BACKEND: Record<GlucosePeriod, string> = {
  "En ayunas": "AYUNAS",
  "Después de comer": "POSTPRANDIAL",
  "Antes de dormir": "NOCTURNA",
};

export default function GlucoseScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<GlucoseFormValues>({
    resolver: zodResolver(glucoseSchema),
    mode: "onBlur",
    defaultValues: { glucosa: "", periodo: "", notas: "" },
  });

  const selectedPeriod = watch("periodo") as GlucosePeriod | "";

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
    // El detalle técnico (404/500/etc.) solo queda en consola: al usuario se
    // le muestra un mensaje genérico, nunca el error crudo del backend.
    onError: (error, variables) => {
      console.error("Error al registrar glucosa:", error);
      Alert.alert("Error", "No se pudo registrar la glucosa.", [
        { text: "Reintentar", onPress: () => saveMutation.mutate(variables) },
        { text: "Cancelar", style: "cancel" },
      ]);
    },
  });

  function onSubmit(values: GlucoseFormValues) {
    saveMutation.mutate({
      glucosa: Number(values.glucosa),
      periodo: PERIOD_TO_BACKEND[values.periodo as GlucosePeriod],
      notas: values.notas.trim() || undefined,
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
        <Controller
          control={control}
          name="glucosa"
          render={({ field, fieldState }) => (
            <AppInput
              label="Valor glucosa"
              placeholder="98"
              keyboardType="numeric"
              icon="glucosa"
              value={field.value}
              onChangeText={field.onChange}
              errorMessage={fieldState.error?.message}
            />
          )}
        />

        <View style={styles.periodSection}>
          {glucosePeriods.map((item, index) => {
            const selected = item.period === selectedPeriod;
            return (
              <Pressable
                key={item.period}
                onPress={() => setValue("periodo", item.period, { shouldValidate: true })}
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
          {errors.periodo ? <Text style={styles.errorText}>{errors.periodo.message}</Text> : null}
        </View>

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
  periodSection: {
    gap: theme.spacing.sm,
  },
  periodCard: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  periodActive: {
    backgroundColor: theme.colors.surfaceAlt,
    borderColor: theme.colors.primary,
  },
  periodHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  periodTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "700",
  },
  periodDescription: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
  },
  errorText: {
    color: "#B54444",
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
  },
});
}
