import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { signOut } from "firebase/auth";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image as ExpoImage } from "expo-image";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { auth } from "@/config/firebase";

import { AppButton } from "@/components/AppButton";
import { IconImage } from "@/components/IconImage";
import { InlineErrorNotice } from "@/components/InlineErrorNotice";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { FormSkeleton } from "@/components/Skeleton";
import { useAuth } from "@/context/AuthContext";
import { apiGet, nullOn404 } from "@/services/apiClient";
import { areNotificationsEnabled, notificationsAvailable, setNotificationsEnabled } from "@/services/notifications";
import { pickProfilePhoto, takeProfilePhoto, uploadProfilePhoto } from "@/services/profilePhoto";
import { queryKeys } from "@/services/queryKeys";
import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme, useThemeMode } from "@/theme/ThemeContext";
import { extractPhoneDigits, formatChileanPhone } from "@/utils/phoneFormat";

/**
 * El backend guarda solo los dígitos del abonado (sin el prefijo "+56 9"),
 * así que hay que reconstruirlo acá para mostrarlo como el usuario lo espera.
 */
function formatDisplayPhone(value: string | null | undefined): string | null {
  if (!value) return null;
  return formatChileanPhone(extractPhoneDigits(value));
}

/** Espejo de PatientDto del BFF. */
type PatientRecord = {
  idPaciente: number;
  rut: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  fechaNacimiento: string;
  telefonoPrincipal: string;
  telefonoSecundario: string | null;
  fotoPerfilUrl: string | null;
};

/** Espejo de AddressDto del BFF. */
type AddressRecord = {
  idDireccion: number;
  calle: string;
  numero: string;
  comuna: string;
  region: string;
};

/** Espejo de DiseaseDto del BFF. */
type DiseaseRecord = {
  idEnfermedad: number;
  nombreEnfermedad: string;
};

/**
 * El BFF firma una URL de foto de perfil distinta en cada `GET /api/patients/me`
 * (SAS de corta duración, ver ProfilePhotoService): la query string (`?sv=...&sig=...`)
 * cambia cada vez aunque la foto sea la misma, lo que rompía el caché de
 * imágenes basado en URL y hacía que se recargara visiblemente en cada visita
 * a esta pantalla. Se usa la URL sin query string como `cacheKey` estable
 * para expo-image, que sí soporta desacoplar la key de caché de la URI real.
 */
function baseBlobUrl(fotoPerfilUrl: string): string {
  return fotoPerfilUrl.split("?")[0];
}

export default function ProfileScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { mode, toggleTheme } = useThemeMode();
  const router = useRouter();
  const authState = useAuth();
  const enabled = authState.status === "authenticated";
  const queryClient = useQueryClient();
  const [pickingPhoto, setPickingPhoto] = useState(false);

  const patientQuery = useQuery({
    queryKey: queryKeys.patientMe,
    queryFn: () => apiGet<PatientRecord>("/api/patients/me"),
    enabled,
  });
  // Solo el 404 ("aún no hay dato") se trata como lista vacía. Un error de
  // red/5xx queda como isError y su sección muestra "no se pudo cargar" con
  // reintento, en vez de afirmar falsamente "sin dirección/enfermedades".
  const addressesQuery = useQuery({
    queryKey: queryKeys.patientAddresses,
    queryFn: () => nullOn404(apiGet<AddressRecord[]>("/api/patients/me/addresses")),
    enabled,
  });
  const diseasesQuery = useQuery({
    queryKey: queryKeys.patientDiseases,
    queryFn: () => nullOn404(apiGet<DiseaseRecord[]>("/api/patients/me/diseases")),
    enabled,
  });
  const notificationsEnabledQuery = useQuery({
    queryKey: queryKeys.notificationsEnabled,
    queryFn: areNotificationsEnabled,
  });
  const notificationsEnabled = notificationsEnabledQuery.data ?? true;

  const toggleNotificationsMutation = useMutation({
    mutationFn: setNotificationsEnabled,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notificationsEnabled });
    },
  });

  const loading =
    patientQuery.isLoading || addressesQuery.isLoading || diseasesQuery.isLoading;
  const refreshing =
    patientQuery.isRefetching || addressesQuery.isRefetching || diseasesQuery.isRefetching;
  const patient = patientQuery.data ?? null;
  const address = addressesQuery.data?.[0] ?? null;
  const diseases = diseasesQuery.data ?? [];

  function handleRefresh() {
    patientQuery.refetch();
    addressesQuery.refetch();
    diseasesQuery.refetch();
  }

  const uploadPhotoMutation = useMutation({
    mutationFn: uploadProfilePhoto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patientMe });
    },
    // El detalle técnico (404/500/etc.) solo queda en consola: al usuario se
    // le muestra un mensaje genérico, nunca el error crudo del backend.
    onError: (error) => {
      console.error("Error al subir la foto de perfil:", error);
      Alert.alert("Error", "No se pudo subir la foto de perfil.");
    },
  });

  function handleChangePhoto() {
    Alert.alert("Foto de perfil", "¿Cómo quieres elegir tu foto?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Tomar foto", onPress: () => runPicker(takeProfilePhoto) },
      { text: "Elegir de galería", onPress: () => runPicker(pickProfilePhoto) },
    ]);
  }

  async function runPicker(picker: () => Promise<string | null>) {
    setPickingPhoto(true);
    try {
      const localUri = await picker();
      if (localUri) {
        uploadPhotoMutation.mutate(localUri);
      }
    } catch (error) {
      console.error("Error al elegir la foto de perfil:", error);
      Alert.alert("Error", "No se pudo abrir la cámara ni la galería.");
    } finally {
      setPickingPhoto(false);
    }
  }

  function handleLogout() {
    Alert.alert("Cerrar sesión", "¿Estás seguro que quieres salir?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Cerrar sesión", style: "destructive", onPress: () => signOut(auth) },
    ]);
  }

  if (loading) {
    return (
      <ScreenContainer scrollable>
        <ScreenHeader />
        <FormSkeleton rows={3} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable refreshing={refreshing} onRefresh={handleRefresh}>
      <ScreenHeader />
      <View style={styles.header}>
        <Pressable
          style={styles.avatarOuter}
          onPress={handleChangePhoto}
          disabled={pickingPhoto || uploadPhotoMutation.isPending}
          accessibilityLabel="Cambiar foto de perfil"
        >
          <View style={styles.avatarWrap}>
            {pickingPhoto || uploadPhotoMutation.isPending ? (
              <ActivityIndicator color={theme.colors.primary} />
            ) : patient?.fotoPerfilUrl ? (
              <ExpoImage
                source={{ uri: patient.fotoPerfilUrl, cacheKey: baseBlobUrl(patient.fotoPerfilUrl) }}
                style={styles.avatarImage}
                cachePolicy="disk"
              />
            ) : (
              <IconImage name="usuario" size={64} />
            )}
          </View>
          <View style={styles.avatarBadge}>
            <IconImage name="editar" size={14} tone="white" />
          </View>
        </Pressable>
        <Text style={styles.name}>
          {patient ? `${patient.nombre} ${patient.apellidoPaterno}` : "Sin datos"}
        </Text>
        <Text style={styles.contact}>{patient?.rut ?? ""}</Text>
      </View>

      <View style={styles.card}>
        <DetailRow label="Fecha de nacimiento" value={patient?.fechaNacimiento ?? "-"} />
        <DetailRow label="Teléfono principal" value={formatDisplayPhone(patient?.telefonoPrincipal) ?? "-"} />
        <DetailRow
          label="Teléfono secundario"
          value={formatDisplayPhone(patient?.telefonoSecundario) ?? "Sin registrar"}
        />
        {addressesQuery.isError ? (
          <InlineErrorNotice
            message="No pudimos cargar tu dirección."
            onRetry={() => addressesQuery.refetch()}
            retrying={addressesQuery.isRefetching}
          />
        ) : (
          <DetailRow
            label="Dirección"
            value={
              address
                ? `${address.calle} ${address.numero}, ${address.comuna}, ${address.region}`
                : "Sin dirección registrada"
            }
          />
        )}
        <View style={styles.diseaseBlock}>
          <Text style={styles.blockTitle}>Enfermedades asociadas</Text>
          {diseasesQuery.isError ? (
            <InlineErrorNotice
              message="No pudimos cargar tus enfermedades."
              onRetry={() => diseasesQuery.refetch()}
              retrying={diseasesQuery.isRefetching}
            />
          ) : diseases.length > 0 ? (
            diseases.map((item) => (
              <Text key={item.idEnfermedad} style={styles.diseaseItem}>
                • {item.nombreEnfermedad}
              </Text>
            ))
          ) : (
            <Text style={styles.diseaseItem}>Sin enfermedades registradas</Text>
          )}
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.preferenceRow}>
          <View style={styles.preferenceTextBlock}>
            <Text style={styles.blockTitle}>Tema oscuro</Text>
            <Text style={styles.diseaseItem}>
              {mode === "dark" ? "Activado" : "Desactivado"}
            </Text>
          </View>
          <Switch
            value={mode === "dark"}
            onValueChange={toggleTheme}
            accessibilityLabel="Tema oscuro"
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={theme.colors.surface}
          />
        </View>

        {notificationsAvailable ? (
          <View style={[styles.preferenceRow, styles.preferenceRowSpaced]}>
            <View style={styles.preferenceTextBlock}>
              <Text style={styles.blockTitle}>Notificaciones</Text>
              <Text style={styles.diseaseItem}>
                {notificationsEnabled
                  ? "Activadas: te avisamos cuando toca un medicamento"
                  : "Desactivadas: no recibirás recordatorios de medicamentos"}
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={(value) => toggleNotificationsMutation.mutate(value)}
              disabled={toggleNotificationsMutation.isPending}
              accessibilityLabel="Notificaciones"
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
              thumbColor={theme.colors.surface}
            />
          </View>
        ) : null}
      </View>

      <AppButton
        title="Ver información médica completa"
        icon="md-del-usuario"
        onPress={() => router.push("/medical-info")}
      />

      <AppButton
        title="Consultar prestadores"
        icon="md-del-usuario"
        variant="outline"
        iconTone="green"
        onPress={() => router.push("/providers")}
      />

      <AppButton
        title="Cerrar sesión"
        variant="outline"
        onPress={handleLogout}
      />
    </ScreenContainer>
  );
}

function DetailRow({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function createStyles(theme: VitaCareThemeType) {
  return StyleSheet.create({
  header: {
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  // El círculo recorta la imagen (overflow: hidden); el badge vive un nivel
  // afuera (en avatarOuter) para no quedar cortado por ese mismo recorte al
  // posicionarse justo en el borde del círculo.
  avatarOuter: {
    width: 110,
    height: 110,
  },
  avatarWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    ...theme.shadow.card,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    borderWidth: 2,
    borderColor: theme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadow.card,
  },
  name: {
    color: theme.colors.secondary,
    fontSize: 24,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "800",
  },
  contact: {
    color: theme.colors.primary,
    fontSize: theme.typography.body,
    fontFamily: theme.typography.fontFamily,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
    ...theme.shadow.card,
  },
  detailRow: {
    gap: theme.spacing.xs,
  },
  detailLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "700",
  },
  detailValue: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontFamily: theme.typography.fontFamily,
  },
  diseaseBlock: {
    gap: theme.spacing.xs,
    paddingTop: theme.spacing.sm,
  },
  preferenceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  preferenceRowSpaced: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  preferenceTextBlock: {
    gap: theme.spacing.xs,
    flexShrink: 1,
    paddingRight: theme.spacing.sm,
  },
  blockTitle: {
    color: theme.colors.secondary,
    fontSize: theme.typography.body,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "800",
  },
  diseaseItem: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontFamily: theme.typography.fontFamily,
  },
});
}
