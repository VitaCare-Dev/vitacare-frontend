import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { IconImage } from "@/components/IconImage";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { glucosePeriods } from "@/data/mockData";
import { ApiError, apiPost } from "@/services/apiClient";
import { VitaCareTheme } from "@/theme/theme";
import type { GlucosePeriod } from "@/types";

/** Mapea el período en español de la UI al enum PeriodoGlucosa del backend. */
const PERIOD_TO_BACKEND: Record<GlucosePeriod, string> = {
  "En ayunas": "AYUNAS",
  "Después de comer": "POSTPRANDIAL",
  "Antes de dormir": "NOCTURNA",
};

export default function GlucoseScreen() {
  const router = useRouter();
  const [glucosa, setGlucosa] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState<GlucosePeriod | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const glucosaValue = Number(glucosa);
    if (!glucosa.trim() || Number.isNaN(glucosaValue)) {
      Alert.alert("Valor inválido", "Ingresa un valor numérico de glucosa.");
      return;
    }
    if (!selectedPeriod) {
      Alert.alert("Período requerido", "Selecciona el período de la medición.");
      return;
    }

    setSaving(true);
    try {
      await apiPost("/api/measurements/glucose", {
        glucosa: glucosaValue,
        periodo: PERIOD_TO_BACKEND[selectedPeriod],
      });
      router.back();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "No se pudo registrar la glucosa.";
      Alert.alert("Error", message, [
        { text: "Reintentar", onPress: handleSave },
        { text: "Cancelar", style: "cancel" },
      ]);
    } finally {
      setSaving(false);
    }
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
        <AppInput
          label="Valor glucosa"
          placeholder="98"
          keyboardType="numeric"
          icon="glucosa"
          value={glucosa}
          onChangeText={setGlucosa}
        />

        <View style={styles.periodSection}>
          {glucosePeriods.map((item, index) => {
            const selected = item.period === selectedPeriod;
            return (
              <Pressable
                key={item.period}
                onPress={() => setSelectedPeriod(item.period)}
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
        </View>
      </View>

      <AppButton
        title={saving ? "Guardando..." : "Guardar"}
        onPress={handleSave}
        disabled={saving}
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
  periodSection: {
    gap: VitaCareTheme.spacing.sm,
  },
  periodCard: {
    borderRadius: VitaCareTheme.radius.md,
    borderWidth: 1,
    borderColor: VitaCareTheme.colors.border,
    backgroundColor: VitaCareTheme.colors.background,
    padding: VitaCareTheme.spacing.md,
    gap: VitaCareTheme.spacing.xs,
  },
  periodActive: {
    backgroundColor: VitaCareTheme.colors.surfaceAlt,
    borderColor: VitaCareTheme.colors.primary,
  },
  periodHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: VitaCareTheme.spacing.sm,
  },
  periodTitle: {
    color: VitaCareTheme.colors.text,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
  periodDescription: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
});
