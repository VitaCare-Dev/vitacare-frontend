import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ApiError, apiPost } from "@/services/apiClient";
import { queryKeys } from "@/services/queryKeys";
import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";
import { MEASUREMENT_RANGES, validateRange } from "@/utils/measurementRanges";

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
  const [sistolica, setSistolica] = useState("");
  const [diastolica, setDiastolica] = useState("");
  const [temperatura, setTemperatura] = useState("");
  const [peso, setPeso] = useState("");
  const [notas, setNotas] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const saveMutation = useMutation({
    mutationFn: (payload: VitalsPayload) => apiPost("/api/measurements/vitals", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.measurementsHistory });
      queryClient.invalidateQueries({ queryKey: queryKeys.vitalsList });
      queryClient.invalidateQueries({ queryKey: queryKeys.latestVitals });
      setSistolica("");
      setDiastolica("");
      setTemperatura("");
      setPeso("");
      setNotas("");
      setErrorMessage("");
      Alert.alert("Registro guardado", "Tus signos vitales se guardaron correctamente.", [
        { text: "Aceptar", onPress: () => router.back() },
      ]);
    },
    onError: (error) => {
      setErrorMessage(
        error instanceof ApiError ? error.message : "No se pudo registrar los signos vitales."
      );
    },
  });

  const handleSave = () => {
    const temperaturaValue = Number(temperatura);
    const pesoValue = Number(peso);

    if (!temperatura || !peso || Number.isNaN(temperaturaValue) || Number.isNaN(pesoValue)) {
      setErrorMessage("Temperatura y peso son obligatorios y deben ser valores numéricos.");
      return;
    }

    const vitalsRangeError =
      validateRange(temperaturaValue, MEASUREMENT_RANGES.temperatura) ??
      validateRange(pesoValue, MEASUREMENT_RANGES.peso);
    if (vitalsRangeError) {
      setErrorMessage(vitalsRangeError);
      return;
    }

    if (sistolica.trim() || diastolica.trim()) {
      const sistolicaValue = Number(sistolica);
      const diastolicaValue = Number(diastolica);
      if (!sistolica.trim() || !diastolica.trim() || Number.isNaN(sistolicaValue) || Number.isNaN(diastolicaValue)) {
        setErrorMessage("Si registras presión arterial, completa tanto la sistólica como la diastólica.");
        return;
      }
      const presionRangeError =
        validateRange(sistolicaValue, MEASUREMENT_RANGES.presionSistolica) ??
        validateRange(diastolicaValue, MEASUREMENT_RANGES.presionDiastolica);
      if (presionRangeError) {
        setErrorMessage(presionRangeError);
        return;
      }
      setErrorMessage("");
      saveMutation.mutate({
        presionSistolica: sistolicaValue,
        presionDiastolica: diastolicaValue,
        temperatura: temperaturaValue,
        peso: pesoValue,
        notas: notas.trim() || undefined,
      });
      return;
    }

    setErrorMessage("");
    saveMutation.mutate({
      temperatura: temperaturaValue,
      peso: pesoValue,
      notas: notas.trim() || undefined,
    });
  };

  return (
    <ScreenContainer scrollable>
      <ScreenHeader showBackButton title="Signos vitales" />
      <View style={styles.header}>
        <Text style={styles.title}>Signos vitales</Text>
        <Text style={styles.subtitle}>
          Ingresa los valores medidos en el control.
        </Text>
      </View>

      {!!errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      <View style={styles.card}>
        <AppInput
          label="Presión sistólica (opcional)"
          placeholder="120"
          keyboardType="numeric"
          icon="presion"
          value={sistolica}
          onChangeText={setSistolica}
        />
        <AppInput
          label="Presión diastólica (opcional)"
          placeholder="80"
          keyboardType="numeric"
          icon="presion"
          value={diastolica}
          onChangeText={setDiastolica}
        />
        <AppInput
          label="Temperatura"
          placeholder="36.6"
          keyboardType="decimal-pad"
          icon="corazon"
          value={temperatura}
          onChangeText={setTemperatura}
        />
        <AppInput
          label="Peso"
          placeholder="65.2"
          keyboardType="decimal-pad"
          icon="peso"
          value={peso}
          onChangeText={setPeso}
        />
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
  errorContainer: {
    backgroundColor: "#fee",
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: "#f44336",
  },
  errorText: {
    color: "#c62828",
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
