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
import { MEASUREMENT_RANGES, validateRange } from "@/utils/measurementRanges";

type LipidsPayload = {
  colesterolTotal: number;
  colesterolLDL: number;
  colesterolHDL: number;
  trigliceridos: number;
  notas?: string;
};

export default function CholesterolScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [cholesterolTotal, setCholesterolTotal] = useState("");
  const [ldl, setLdl] = useState("");
  const [hdl, setHdl] = useState("");
  const [triglycerides, setTriglycerides] = useState("");
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const saveMutation = useMutation({
    mutationFn: (payload: LipidsPayload) => apiPost("/api/measurements/lipids", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.measurementsHistory });
      queryClient.invalidateQueries({ queryKey: queryKeys.lipidsList });
      queryClient.invalidateQueries({ queryKey: queryKeys.latestLipids });
      setCholesterolTotal("");
      setLdl("");
      setHdl("");
      setTriglycerides("");
      setNotes("");
      setErrorMessage("");
      Alert.alert("Registro guardado", "Tu perfil lipídico se guardó correctamente.", [
        { text: "Aceptar", onPress: () => router.back() },
      ]);
    },
    onError: (error) => {
      setErrorMessage(
        error instanceof ApiError ? error.message : "No se pudo registrar el colesterol."
      );
    },
  });

  const handleSave = () => {
    const colesterolTotalValue = Number(cholesterolTotal);
    const ldlValue = Number(ldl);
    const hdlValue = Number(hdl);
    const trigliceridosValue = Number(triglycerides);

    if (
      !cholesterolTotal ||
      !ldl ||
      !hdl ||
      !triglycerides ||
      [colesterolTotalValue, ldlValue, hdlValue, trigliceridosValue].some(Number.isNaN)
    ) {
      setErrorMessage("Por favor completa todos los campos requeridos con valores numéricos.");
      return;
    }

    const rangeError =
      validateRange(colesterolTotalValue, MEASUREMENT_RANGES.colesterolTotal) ??
      validateRange(ldlValue, MEASUREMENT_RANGES.colesterolLDL) ??
      validateRange(hdlValue, MEASUREMENT_RANGES.colesterolHDL) ??
      validateRange(trigliceridosValue, MEASUREMENT_RANGES.trigliceridos);
    if (rangeError) {
      setErrorMessage(rangeError);
      return;
    }
    setErrorMessage("");

    saveMutation.mutate({
      colesterolTotal: colesterolTotalValue,
      colesterolLDL: ldlValue,
      colesterolHDL: hdlValue,
      trigliceridos: trigliceridosValue,
      notas: notes.trim() || undefined,
    });
  };

  return (
    <ScreenContainer scrollable>
      <ScreenHeader showBackButton title="Colesterol y lípidos" />
      <View style={styles.header}>
        <Text style={styles.title}>Nuevo registro</Text>
        <Text style={styles.subtitle}>
          Registra tu perfil lipídico completo.
        </Text>
      </View>

      {!!errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      <View style={styles.formCard}>
        <Text style={styles.sectionLabel}>Valores de sangre</Text>

        <AppInput
          label="Colesterol Total"
          placeholder="Ej: 200"
          icon="registros"
          value={cholesterolTotal}
          onChangeText={setCholesterolTotal}
          keyboardType="numeric"
        />

        <AppInput
          label="LDL (Colesterol malo)"
          placeholder="Ej: 130"
          icon="registros"
          value={ldl}
          onChangeText={setLdl}
          keyboardType="numeric"
        />

        <AppInput
          label="HDL (Colesterol bueno)"
          placeholder="Ej: 40"
          icon="registros"
          value={hdl}
          onChangeText={setHdl}
          keyboardType="numeric"
        />

        <AppInput
          label="Triglicéridos"
          placeholder="Ej: 150"
          icon="registros"
          value={triglycerides}
          onChangeText={setTriglycerides}
          keyboardType="numeric"
        />

        <AppInput
          label="Notas (opcional)"
          placeholder="Agrega observaciones relevantes"
          icon="nota"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
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
        onPress={handleSave}
        disabled={saveMutation.isPending}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: VitaCareTheme.spacing.xs,
    marginBottom: VitaCareTheme.spacing.md,
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
  formCard: {
    backgroundColor: VitaCareTheme.colors.surface,
    borderRadius: VitaCareTheme.radius.lg,
    borderWidth: 1,
    borderColor: VitaCareTheme.colors.border,
    padding: VitaCareTheme.spacing.md,
    gap: VitaCareTheme.spacing.md,
    marginBottom: VitaCareTheme.spacing.md,
    ...VitaCareTheme.shadow.card,
  },
  sectionLabel: {
    color: VitaCareTheme.colors.secondary,
    fontSize: 14,
    fontWeight: "600",
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
  infoCard: {
    backgroundColor: "#f0f7ff",
    borderRadius: VitaCareTheme.radius.md,
    padding: VitaCareTheme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: VitaCareTheme.colors.primary,
  },
  infoLabel: {
    color: VitaCareTheme.colors.secondary,
    fontSize: 13,
    fontWeight: "600",
    fontFamily: VitaCareTheme.typography.fontFamily,
    marginBottom: VitaCareTheme.spacing.xs,
  },
  infoText: {
    color: VitaCareTheme.colors.text,
    fontSize: 12,
    fontFamily: VitaCareTheme.typography.fontFamily,
    lineHeight: 18,
  },
});
