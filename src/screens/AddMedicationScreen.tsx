import { zodResolver } from "@hookform/resolvers/zod";
import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { type MedicationRecord } from "@/components/MedicationCard";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { apiPost } from "@/services/apiClient";
import {
  requestNotificationPermissions,
  scheduleMedicationReminder,
} from "@/services/notifications";
import { queryKeys } from "@/services/queryKeys";
import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";
import { addMedicationSchema, type AddMedicationFormValues } from "@/utils/formSchemas";

type MedicationPayload = {
  nombreMedicamento: string;
  dosis: string;
  frecuenciaHoras: number;
  fechaInicio: string;
  fechaTermino?: string;
};

/** Formatea un Date como "DD/MM/AAAA" para mostrarlo en el input. */
function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

/** Convierte un Date a "AAAA-MM-DD" (ISO) usando la fecha local, sin corrimiento por timezone. */
function toIsoDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export default function AddMedicationScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<AddMedicationFormValues>({
    resolver: zodResolver(addMedicationSchema),
    mode: "onBlur",
    defaultValues: {
      medicationName: "",
      dose: "",
      frequencyHours: "",
      startDate: undefined as unknown as Date,
      endDate: null,
    },
  });

  const startDate = watch("startDate");
  const endDate = watch("endDate");

  const saveMutation = useMutation({
    mutationFn: (payload: MedicationPayload) =>
      apiPost<MedicationRecord>("/api/medications", payload),
    onSuccess: async (createdMedication) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.medicationsAll });
      queryClient.invalidateQueries({ queryKey: queryKeys.medicationsActive });

      const granted = await requestNotificationPermissions();
      if (granted) {
        await scheduleMedicationReminder(createdMedication);
      }

      Alert.alert("Medicamento guardado", "El tratamiento se registró correctamente.", [
        { text: "Aceptar", onPress: () => router.back() },
      ]);
    },
    // El detalle técnico (404/500/etc.) solo queda en consola: al usuario se
    // le muestra un mensaje genérico, nunca el error crudo del backend.
    onError: (error) => {
      console.error("Error al guardar medicamento:", error);
      Alert.alert("Error", "No se pudo guardar el medicamento.");
    },
  });

  function onSubmit(values: AddMedicationFormValues) {
    saveMutation.mutate({
      nombreMedicamento: values.medicationName.trim(),
      dosis: values.dose.trim(),
      frecuenciaHoras: Number(values.frequencyHours),
      fechaInicio: toIsoDate(values.startDate),
      fechaTermino: values.endDate ? toIsoDate(values.endDate) : undefined,
    });
  }

  return (
    <ScreenContainer scrollable>
      <ScreenHeader showBackButton title="Agregar medicamento" />
      <View style={styles.header}>
        <Text style={styles.title}>Nuevo tratamiento</Text>
        <Text style={styles.subtitle}>
          Registra el medicamento usando la estructura del esquema clínico.
        </Text>
      </View>

      <View style={styles.card}>
        <Controller
          control={control}
          name="medicationName"
          render={({ field, fieldState }) => (
            <AppInput
              label="Nombre del medicamento"
              placeholder="Ej. Metformina"
              icon="medicamento"
              value={field.value}
              onChangeText={field.onChange}
              errorMessage={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="dose"
          render={({ field, fieldState }) => (
            <AppInput
              label="Dosis"
              placeholder="Ej. 850 mg"
              icon="capsulas"
              value={field.value}
              onChangeText={field.onChange}
              errorMessage={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="frequencyHours"
          render={({ field, fieldState }) => (
            <AppInput
              label="Frecuencia (horas)"
              placeholder="Ej. 12"
              icon="nota"
              keyboardType="numeric"
              value={field.value}
              onChangeText={field.onChange}
              errorMessage={fieldState.error?.message}
            />
          )}
        />

        <Pressable onPress={() => setShowStartPicker(true)}>
          <View pointerEvents="none">
            <AppInput
              label="Fecha de inicio"
              placeholder="dd/mm/aaaa"
              icon="nota"
              value={startDate ? formatDate(startDate) : ""}
              editable={false}
              errorMessage={errors.startDate?.message}
            />
          </View>
        </Pressable>
        {showStartPicker ? (
          <DateTimePicker
            value={startDate ?? new Date()}
            mode="date"
            onValueChange={(_event: DateTimePickerChangeEvent, selectedDate: Date) => {
              setShowStartPicker(false);
              setValue("startDate", selectedDate, { shouldValidate: true });
            }}
            onDismiss={() => setShowStartPicker(false)}
            accentColor={theme.colors.primary}
            themeVariant="light"
          />
        ) : null}

        <Pressable onPress={() => setShowEndPicker(true)}>
          <View pointerEvents="none">
            <AppInput
              label="Fecha de término"
              placeholder="Opcional (indefinido)"
              icon="nota"
              value={endDate ? formatDate(endDate) : ""}
              editable={false}
            />
          </View>
        </Pressable>
        {endDate ? (
          <Pressable onPress={() => setValue("endDate", null)}>
            <Text style={styles.link}>Quitar fecha de término</Text>
          </Pressable>
        ) : null}
        {showEndPicker ? (
          <DateTimePicker
            value={endDate ?? startDate ?? new Date()}
            mode="date"
            minimumDate={startDate ?? undefined}
            onValueChange={(_event: DateTimePickerChangeEvent, selectedDate: Date) => {
              setShowEndPicker(false);
              setValue("endDate", selectedDate);
            }}
            onDismiss={() => setShowEndPicker(false)}
            accentColor={theme.colors.primary}
            themeVariant="light"
          />
        ) : null}
      </View>

      <AppButton
        title={saveMutation.isPending ? "Guardando..." : "Guardar medicamento"}
        icon="agregar"
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
  link: {
    color: theme.colors.primary,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "600",
  },
});
}
