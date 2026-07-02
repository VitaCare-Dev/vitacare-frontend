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
import { VitaCareTheme } from "@/theme/theme";

type VitalsPayload = {
  presionSistolica?: number;
  presionDiastolica?: number;
  temperatura: number;
  peso: number;
  notas?: string;
};

export default function VitalSignsScreen() {
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

    if (sistolica.trim() || diastolica.trim()) {
      const sistolicaValue = Number(sistolica);
      const diastolicaValue = Number(diastolica);
      if (!sistolica.trim() || !diastolica.trim() || Number.isNaN(sistolicaValue) || Number.isNaN(diastolicaValue)) {
        setErrorMessage("Si registras presión arterial, completa tanto la sistólica como la diastólica.");
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
  errorContainer: {
    backgroundColor: "#fee",
    borderRadius: VitaCareTheme.radius.md,
    padding: VitaCareTheme.spacing.md,
    marginBottom: VitaCareTheme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: "#f44336",
  },
  errorText: {
    color: "#c62828",
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
});
