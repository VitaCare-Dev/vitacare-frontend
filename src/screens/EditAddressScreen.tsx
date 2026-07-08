import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { AppPickerField } from "@/components/AppPickerField";
import { FormSkeleton } from "@/components/Skeleton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAuth } from "@/context/AuthContext";
import { chileRegions, getComunasByRegion } from "@/data/chileRegions";
import { apiGet, apiPost, apiPut } from "@/services/apiClient";
import { queryKeys } from "@/services/queryKeys";
import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";
import { addressSchema, type AddressFormValues } from "@/utils/formSchemas";

/** Espejo de AddressDto del BFF. */
type AddressRecord = {
  idDireccion: number;
  calle: string;
  numero: string;
  comuna: string;
  region: string;
};

export default function EditAddressScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
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

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    mode: "onBlur",
    defaultValues: { regionId: "", comunaId: "", calle: "", numero: "" },
  });

  const regionId = watch("regionId");
  const comunaOptions = regionId ? getComunasByRegion(regionId) : [];

  // Precarga el formulario con la dirección actual apenas llega (los datos guardados
  // son nombres, no códigos, así que se buscan los ids correspondientes por nombre).
  useEffect(() => {
    if (!address) return;

    const matchedRegion = chileRegions.find((item) => item.name === address.region);
    const matchedComuna = matchedRegion
      ? getComunasByRegion(matchedRegion.id).find((item) => item.name === address.comuna)
      : undefined;

    reset({
      regionId: matchedRegion?.id ?? "",
      comunaId: matchedComuna?.id ?? "",
      calle: address.calle,
      numero: address.numero,
    });
  }, [address, reset]);

  function handleChangeRegion(value: string) {
    setValue("regionId", value, { shouldValidate: true });
    setValue("comunaId", "");
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
    // El detalle técnico (404/500/etc.) solo queda en consola: al usuario se
    // le muestra un mensaje genérico, nunca el error crudo del backend.
    onError: (error) => {
      console.error("Error al guardar dirección:", error);
      Alert.alert("Error", "No se pudo guardar la dirección.");
    },
  });

  function onSubmit(values: AddressFormValues) {
    const regionName = chileRegions.find((item) => item.id === values.regionId)?.name ?? "";
    const comunaName =
      getComunasByRegion(values.regionId).find((item) => item.id === values.comunaId)?.name ?? "";

    saveMutation.mutate({
      calle: values.calle.trim(),
      numero: values.numero.trim(),
      comuna: comunaName,
      region: regionName,
    });
  }

  if (addressesQuery.isLoading) {
    return (
      <ScreenContainer scrollable>
        <ScreenHeader showBackButton title="Editar dirección" />
        <FormSkeleton rows={4} />
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
        <Controller
          control={control}
          name="regionId"
          render={({ fieldState }) => (
            <AppPickerField
              label="Región"
              placeholder="Selecciona una región"
              value={regionId}
              onValueChange={handleChangeRegion}
              options={chileRegions.map((item) => ({ label: item.name, value: item.id }))}
              errorMessage={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="comunaId"
          render={({ field, fieldState }) => (
            <AppPickerField
              label="Comuna"
              placeholder={regionId ? "Selecciona una comuna" : "Primero selecciona una región"}
              value={field.value}
              onValueChange={field.onChange}
              options={comunaOptions.map((item) => ({ label: item.name, value: item.id }))}
              enabled={Boolean(regionId)}
              errorMessage={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="calle"
          render={({ field, fieldState }) => (
            <AppInput
              label="Calle"
              placeholder="Av. Los Carrera"
              icon="nota"
              value={field.value}
              onChangeText={field.onChange}
              errorMessage={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="numero"
          render={({ field, fieldState }) => (
            <AppInput
              label="Número"
              placeholder="1234, Depto. 56"
              icon="nota"
              value={field.value}
              onChangeText={field.onChange}
              errorMessage={fieldState.error?.message}
            />
          )}
        />
      </View>

      <AppButton
        title={saveMutation.isPending ? "Guardando..." : "Guardar dirección"}
        onPress={handleSubmit(onSubmit)}
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
});
}
