import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { type MedicationRecord } from "@/components/MedicationCard";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ApiError, apiPost } from "@/services/apiClient";
import {
  requestNotificationPermissions,
  scheduleMedicationReminder,
} from "@/services/notifications";
import { queryKeys } from "@/services/queryKeys";
import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";

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
  const [medicationName, setMedicationName] = useState("");
  const [dose, setDose] = useState("");
  const [frequencyHours, setFrequencyHours] = useState("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
    onError: (error) => {
      setErrorMessage(
        error instanceof ApiError ? error.message : "No se pudo guardar el medicamento."
      );
    },
  });

  const handleSubmit = () => {
    if (!medicationName.trim() || !dose.trim() || !frequencyHours.trim() || !startDate) {
      setErrorMessage("Completa nombre, dosis, frecuencia y fecha de inicio.");
      return;
    }

    const parsedFrequency = Number(frequencyHours);
    if (!Number.isFinite(parsedFrequency) || parsedFrequency <= 0) {
      setErrorMessage("La frecuencia debe ser un número válido de horas.");
      return;
    }

    setErrorMessage("");
    saveMutation.mutate({
      nombreMedicamento: medicationName.trim(),
      dosis: dose.trim(),
      frecuenciaHoras: parsedFrequency,
      fechaInicio: toIsoDate(startDate),
      fechaTermino: endDate ? toIsoDate(endDate) : undefined,
    });
  };

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
        <AppInput
          label="Nombre del medicamento"
          placeholder="Ej. Metformina"
          icon="medicamento"
          value={medicationName}
          onChangeText={(value) => {
            setMedicationName(value);
            setErrorMessage("");
          }}
        />
        <AppInput
          label="Dosis"
          placeholder="Ej. 850 mg"
          icon="capsulas"
          value={dose}
          onChangeText={(value) => {
            setDose(value);
            setErrorMessage("");
          }}
        />
        <AppInput
          label="Frecuencia (horas)"
          placeholder="Ej. 12"
          icon="nota"
          keyboardType="numeric"
          value={frequencyHours}
          onChangeText={(value) => {
            setFrequencyHours(value);
            setErrorMessage("");
          }}
        />

        <Pressable onPress={() => setShowStartPicker(true)}>
          <View pointerEvents="none">
            <AppInput
              label="Fecha de inicio"
              placeholder="dd/mm/aaaa"
              icon="nota"
              value={startDate ? formatDate(startDate) : ""}
              editable={false}
            />
          </View>
        </Pressable>
        {showStartPicker ? (
          <DateTimePicker
            value={startDate ?? new Date()}
            mode="date"
            onValueChange={(_event: DateTimePickerChangeEvent, selectedDate: Date) => {
              setShowStartPicker(false);
              setStartDate(selectedDate);
              setErrorMessage("");
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
          <Pressable onPress={() => setEndDate(null)}>
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
              setEndDate(selectedDate);
            }}
            onDismiss={() => setShowEndPicker(false)}
            accentColor={theme.colors.primary}
            themeVariant="light"
          />
        ) : null}

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      </View>

      <AppButton
        title={saveMutation.isPending ? "Guardando..." : "Guardar medicamento"}
        icon="agregar"
        onPress={handleSubmit}
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
  error: {
    color: "#B54444",
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "700",
  },
});
}
