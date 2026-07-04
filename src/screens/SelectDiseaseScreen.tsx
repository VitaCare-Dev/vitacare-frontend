import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { BrandHeader } from "@/components/BrandHeader";
import { ScreenContainer } from "@/components/ScreenContainer";
import { refreshAuthProfile } from "@/context/AuthContext";
import { ApiError, apiGet, apiPost } from "@/services/apiClient";
import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";

/** Espejo de DiseaseDto del BFF. */
type DiseaseOption = {
  idEnfermedad: number;
  nombreEnfermedad: string;
  descripcion: string;
};

export default function SelectDiseaseScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [diseases, setDiseases] = useState<DiseaseOption[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDiseases();
  }, []);

  async function loadDiseases() {
    setLoadingCatalog(true);
    try {
      const catalog = await apiGet<DiseaseOption[]>("/api/diseases");
      setDiseases(catalog);
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "No se pudo cargar el catálogo de enfermedades.";
      Alert.alert("Error", message, [{ text: "Reintentar", onPress: loadDiseases }]);
    } finally {
      setLoadingCatalog(false);
    }
  }

  async function handleContinue() {
    if (selectedId === null) return;
    setSubmitting(true);
    try {
      await apiPost("/api/patients/me/diseases", { idEnfermedad: selectedId });
      await refreshAuthProfile();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "No se pudo guardar tu enfermedad.";
      Alert.alert("Error", message, [
        { text: "Reintentar", onPress: handleContinue },
        { text: "Cancelar", style: "cancel" },
      ]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenContainer scrollable>
      <BrandHeader logoStyle="horizontal" />
      <View style={styles.header}>
        <Text style={styles.title}>¿Qué enfermedad crónica quieres seguir?</Text>
        <Text style={styles.subtitle}>
          Con esto ajustamos tus umbrales médicos y las alertas de la app.
        </Text>
      </View>

      {loadingCatalog ? (
        <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
      ) : (
        <View style={styles.list}>
          {diseases.map((disease) => {
            const selected = disease.idEnfermedad === selectedId;
            return (
              <Pressable
                key={disease.idEnfermedad}
                onPress={() => setSelectedId(disease.idEnfermedad)}
                style={[styles.card, selected && styles.cardSelected]}
              >
                <Text style={[styles.cardTitle, selected && styles.cardTitleSelected]}>
                  {disease.nombreEnfermedad}
                </Text>
                <Text style={styles.cardDescription}>{disease.descripcion}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <AppButton
        title={submitting ? "Guardando..." : "Continuar"}
        onPress={handleContinue}
        disabled={selectedId === null || submitting}
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
    fontSize: 24,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "800",
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    fontFamily: theme.typography.fontFamily,
  },
  loader: {
    marginTop: theme.spacing.xl,
  },
  list: {
    gap: theme.spacing.md,
    paddingTop: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
    ...theme.shadow.card,
  },
  cardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceSoft,
  },
  cardTitle: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "700",
  },
  cardTitleSelected: {
    color: theme.colors.secondary,
  },
  cardDescription: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
  },
});
}
