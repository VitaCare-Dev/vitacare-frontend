import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { AppPickerField } from "@/components/AppPickerField";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAuth } from "@/context/AuthContext";
import { chileRegions, getComunasByRegion } from "@/data/chileRegions";
import { ApiError, apiGet, apiPost, apiPut } from "@/services/apiClient";
import { queryKeys } from "@/services/queryKeys";
import { VitaCareTheme } from "@/theme/theme";

/** Espejo de AddressDto del BFF. */
type AddressRecord = {
  idDireccion: number;
  calle: string;
  numero: string;
  comuna: string;
  region: string;
};

export default function EditAddressScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const authState = useAuth();
  const enabled = authState.status === "authenticated";

  const addressesQuery = useQuery({
    queryKey: queryKeys.patientAddresses,
    queryFn: () => apiGet<AddressRecord[]>("/api/patients/me/addresses").catch(() => []),
    enabled,
  });
  const address = addressesQuery.data?.[0] ?? null;

  const [regionId, setRegionId] = useState("");
  const [comunaId, setComunaId] = useState("");
  const [calle, setCalle] = useState("");
  const [numero, setNumero] = useState("");
  const [initialized, setInitialized] = useState(false);

  // Precarga el formulario con la dirección actual apenas llega (los datos guardados
  // son nombres, no códigos, así que se buscan los ids correspondientes por nombre).
  useEffect(() => {
    if (initialized || !address) return;

    const matchedRegion = chileRegions.find((item) => item.name === address.region);
    if (matchedRegion) {
      setRegionId(matchedRegion.id);
      const matchedComuna = getComunasByRegion(matchedRegion.id).find(
        (item) => item.name === address.comuna
      );
      if (matchedComuna) setComunaId(matchedComuna.id);
    }
    setCalle(address.calle);
    setNumero(address.numero);
    setInitialized(true);
  }, [address, initialized]);

  const comunaOptions = regionId ? getComunasByRegion(regionId) : [];

  function handleChangeRegion(value: string) {
    setRegionId(value);
    setComunaId("");
  }

  const saveMutation = useMutation({
    mutationFn: (payload: { calle: string; numero: string; comuna: string; region: string }) =>
      address
        ? apiPut(`/api/patients/me/addresses/${address.idDireccion}`, payload)
        : apiPost("/api/patients/me/addresses", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patientAddresses });
      Alert.alert("Dirección guardada", "Tu dirección se actualizó correctamente.", [
        { text: "Aceptar", onPress: () => router.back() },
      ]);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "No se pudo guardar la dirección.";
      Alert.alert("Error", message);
    },
  });

  function handleSave() {
    if (!regionId || !comunaId || !calle.trim() || !numero.trim()) {
      Alert.alert("Campos requeridos", "Región, comuna, calle y número son obligatorios.");
      return;
    }

    const regionName = chileRegions.find((item) => item.id === regionId)?.name ?? "";
    const comunaName = comunaOptions.find((item) => item.id === comunaId)?.name ?? "";

    saveMutation.mutate({
      calle: calle.trim(),
      numero: numero.trim(),
      comuna: comunaName,
      region: regionName,
    });
  }

  if (addressesQuery.isLoading) {
    return (
      <ScreenContainer scrollable>
        <ScreenHeader showBackButton title="Editar dirección" />
        <ActivityIndicator color={VitaCareTheme.colors.primary} style={styles.loader} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable>
      <ScreenHeader showBackButton title={address ? "Editar dirección" : "Agregar dirección"} />
      <View style={styles.header}>
        <Text style={styles.title}>{address ? "Editar dirección" : "Agregar dirección"}</Text>
        <Text style={styles.subtitle}>Actualiza los datos de tu domicilio.</Text>
      </View>

      <View style={styles.card}>
        <AppPickerField
          label="Región"
          placeholder="Selecciona una región"
          value={regionId}
          onValueChange={handleChangeRegion}
          options={chileRegions.map((item) => ({ label: item.name, value: item.id }))}
        />
        <AppPickerField
          label="Comuna"
          placeholder={regionId ? "Selecciona una comuna" : "Primero selecciona una región"}
          value={comunaId}
          onValueChange={setComunaId}
          options={comunaOptions.map((item) => ({ label: item.name, value: item.id }))}
          enabled={Boolean(regionId)}
        />
        <AppInput label="Calle" placeholder="Av. Los Carrera" icon="nota" value={calle} onChangeText={setCalle} />
        <AppInput label="Número" placeholder="1234, Depto. 56" icon="nota" value={numero} onChangeText={setNumero} />
      </View>

      <AppButton
        title={saveMutation.isPending ? "Guardando..." : "Guardar dirección"}
        onPress={handleSave}
        disabled={saveMutation.isPending}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: VitaCareTheme.spacing.xl,
  },
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
});
