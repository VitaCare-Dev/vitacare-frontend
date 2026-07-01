import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { BrandHeader } from "@/components/BrandHeader";
import { ScreenContainer } from "@/components/ScreenContainer";
import { refreshAuthProfile } from "@/context/AuthContext";
import { ApiError, apiGet, apiPost } from "@/services/apiClient";
import { VitaCareTheme } from "@/theme/theme";

/** Espejo de DiseaseDto del BFF. */
type DiseaseOption = {
  idEnfermedad: number;
  nombreEnfermedad: string;
  descripcion: string;
};

export default function SelectDiseaseScreen() {
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
        <ActivityIndicator color={VitaCareTheme.colors.primary} style={styles.loader} />
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

const styles = StyleSheet.create({
  header: {
    gap: VitaCareTheme.spacing.xs,
  },
  title: {
    color: VitaCareTheme.colors.secondary,
    fontSize: 24,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "800",
  },
  subtitle: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
  loader: {
    marginTop: VitaCareTheme.spacing.xl,
  },
  list: {
    gap: VitaCareTheme.spacing.md,
    paddingTop: VitaCareTheme.spacing.lg,
  },
  card: {
    backgroundColor: VitaCareTheme.colors.surface,
    borderRadius: VitaCareTheme.radius.lg,
    borderWidth: 2,
    borderColor: VitaCareTheme.colors.border,
    padding: VitaCareTheme.spacing.md,
    gap: VitaCareTheme.spacing.xs,
    ...VitaCareTheme.shadow.card,
  },
  cardSelected: {
    borderColor: VitaCareTheme.colors.primary,
    backgroundColor: VitaCareTheme.colors.surfaceSoft,
  },
  cardTitle: {
    color: VitaCareTheme.colors.text,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
  cardTitleSelected: {
    color: VitaCareTheme.colors.secondary,
  },
  cardDescription: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
});
