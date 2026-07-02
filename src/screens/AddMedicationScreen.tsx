import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ApiError, apiPost } from "@/services/apiClient";
import { queryKeys } from "@/services/queryKeys";
import { VitaCareTheme } from "@/theme/theme";

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
    mutationFn: (payload: MedicationPayload) => apiPost("/api/medications", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.medicationsAll });
      queryClient.invalidateQueries({ queryKey: queryKeys.medicationsActive });
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
            accentColor={VitaCareTheme.colors.primary}
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
            accentColor={VitaCareTheme.colors.primary}
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
  link: {
    color: VitaCareTheme.colors.primary,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "600",
  },
  error: {
    color: "#B54444",
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
});
