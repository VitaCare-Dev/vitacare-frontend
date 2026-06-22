import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { addTreatmentMedication } from "@/store/medicalStore";
import { VitaCareTheme } from "@/theme/theme";

export default function AddMedicationScreen() {
  const router = useRouter();
  const [medicationName, setMedicationName] = useState("");
  const [dose, setDose] = useState("");
  const [frequencyHours, setFrequencyHours] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [active, setActive] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = () => {
    if (
      !medicationName.trim() ||
      !dose.trim() ||
      !frequencyHours.trim() ||
      !startDate.trim()
    ) {
      setErrorMessage("Completa nombre, dosis, frecuencia y fecha de inicio.");
      return;
    }

    const parsedFrequency = Number(frequencyHours);
    if (!Number.isFinite(parsedFrequency) || parsedFrequency <= 0) {
      setErrorMessage("La frecuencia debe ser un número válido de horas.");
      return;
    }

    addTreatmentMedication({
      medicationName,
      dose,
      frequencyHours: parsedFrequency,
      startDate,
      endDate,
      active,
    });

    router.back();
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
        <AppInput
          label="Fecha de inicio"
          placeholder="dd/mm/aaaa"
          icon="nota"
          value={startDate}
          onChangeText={(value) => {
            setStartDate(value);
            setErrorMessage("");
          }}
        />
        <AppInput
          label="Fecha de término"
          placeholder="Opcional"
          icon="nota"
          value={endDate}
          onChangeText={(value) => setEndDate(value)}
        />

        <View style={styles.activeSection}>
          <Text style={styles.activeLabel}>Estado del tratamiento</Text>
          <View style={styles.toggleRow}>
            <Pressable
              onPress={() => setActive(true)}
              style={[styles.toggleChip, active && styles.toggleChipActive]}
            >
              <Text
                style={[styles.toggleText, active && styles.toggleTextActive]}
              >
                Activo
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActive(false)}
              style={[styles.toggleChip, !active && styles.toggleChipActive]}
            >
              <Text
                style={[styles.toggleText, !active && styles.toggleTextActive]}
              >
                Inactivo
              </Text>
            </Pressable>
          </View>
        </View>

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      </View>

      <AppButton
        title="Guardar medicamento"
        icon="agregar"
        onPress={handleSubmit}
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
  activeSection: {
    gap: VitaCareTheme.spacing.sm,
  },
  activeLabel: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
  toggleRow: {
    flexDirection: "row",
    gap: VitaCareTheme.spacing.sm,
  },
  toggleChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: VitaCareTheme.colors.border,
    backgroundColor: VitaCareTheme.colors.surface,
    alignItems: "center",
  },
  toggleChipActive: {
    backgroundColor: VitaCareTheme.colors.primary,
    borderColor: VitaCareTheme.colors.primary,
  },
  toggleText: {
    color: VitaCareTheme.colors.text,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
  toggleTextActive: {
    color: VitaCareTheme.colors.surface,
  },
  error: {
    color: "#B54444",
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
});
