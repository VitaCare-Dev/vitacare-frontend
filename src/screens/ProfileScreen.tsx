import { useQuery } from "@tanstack/react-query";
import { signOut } from "firebase/auth";
import { useRouter } from "expo-router";
import { ActivityIndicator, Alert, StyleSheet, Switch, Text, View } from "react-native";

import { auth } from "@/config/firebase";

import { AppButton } from "@/components/AppButton";
import { IconImage } from "@/components/IconImage";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAuth } from "@/context/AuthContext";
import { apiGet } from "@/services/apiClient";
import { queryKeys } from "@/services/queryKeys";
import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme, useThemeMode } from "@/theme/ThemeContext";

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

export default function ProfileScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const { mode, toggleTheme } = useThemeMode();
  const router = useRouter();
  const authState = useAuth();
  const enabled = authState.status === "authenticated";

  const patientQuery = useQuery({
    queryKey: queryKeys.patientMe,
    queryFn: () => apiGet<PatientRecord>("/api/patients/me"),
    enabled,
  });
  const addressesQuery = useQuery({
    queryKey: queryKeys.patientAddresses,
    queryFn: () => apiGet<AddressRecord[]>("/api/patients/me/addresses").catch(() => []),
    enabled,
  });
  const diseasesQuery = useQuery({
    queryKey: queryKeys.patientDiseases,
    queryFn: () => apiGet<DiseaseRecord[]>("/api/patients/me/diseases").catch(() => []),
    enabled,
  });

  const loading =
    patientQuery.isLoading || addressesQuery.isLoading || diseasesQuery.isLoading;
  const patient = patientQuery.data ?? null;
  const address = addressesQuery.data?.[0] ?? null;
  const diseases = diseasesQuery.data ?? [];

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
        <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable>
      <ScreenHeader />
      <View style={styles.header}>
        <View style={styles.avatarWrap}>
          <IconImage name="usuario" size={64} />
        </View>
        <Text style={styles.name}>
          {patient ? `${patient.nombre} ${patient.apellidoPaterno}` : "Sin datos"}
        </Text>
        <Text style={styles.contact}>{patient?.rut ?? ""}</Text>
      </View>

      <View style={styles.card}>
        <DetailRow label="Fecha de nacimiento" value={patient?.fechaNacimiento ?? "-"} />
        <DetailRow label="Teléfono principal" value={patient?.telefonoPrincipal ?? "-"} />
        <DetailRow
          label="Teléfono secundario"
          value={patient?.telefonoSecundario ?? "Sin registrar"}
        />
        <DetailRow
          label="Dirección"
          value={
            address
              ? `${address.calle} ${address.numero}, ${address.comuna}, ${address.region}`
              : "Sin dirección registrada"
          }
        />
        <View style={styles.diseaseBlock}>
          <Text style={styles.blockTitle}>Enfermedades asociadas</Text>
          {diseases.length > 0 ? (
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
            trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            thumbColor={theme.colors.surface}
          />
        </View>
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
  loader: {
    marginTop: theme.spacing.xl,
  },
  header: {
    alignItems: "center",
    gap: theme.spacing.sm,
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
  preferenceTextBlock: {
    gap: theme.spacing.xs,
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
