import { useMutation, useQuery } from "@tanstack/react-query";
import { EmailAuthProvider, deleteUser, reauthenticateWithCredential } from "firebase/auth";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { IconImage } from "@/components/IconImage";
import { ReauthPasswordModal } from "@/components/ReauthPasswordModal";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { auth } from "@/config/firebase";
import { useAuth } from "@/context/AuthContext";
import { ApiError, apiDelete, apiGet } from "@/services/apiClient";
import { queryKeys } from "@/services/queryKeys";
import { VitaCareTheme } from "@/theme/theme";

/** Espejo de PatientDto del BFF. */
type PatientRecord = {
  idPaciente: number;
  idUsuario: number;
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
  calle: string;
  numero: string;
  comuna: string;
  region: string;
};

/** Espejo de DiseaseDto del BFF. */
type DiseaseRecord = {
  idEnfermedad: number;
  nombreEnfermedad: string;
  descripcion: string;
};

/** Espejo de MedicalThresholdDto del BFF. */
type ThresholdRecord = {
  glucosaMin: number;
  glucosaMax: number;
  sistolicaMax: number;
  diastolicaMax: number;
  temperaturaMax: number;
};

/** Espejo de MedicationDto del BFF. */
type MedicationRecord = {
  idMedicamento: number;
  activo: number;
};

export default function MedicalInfoScreen() {
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
  const thresholdsQuery = useQuery({
    queryKey: queryKeys.patientThresholds,
    queryFn: () =>
      apiGet<ThresholdRecord>("/api/patients/me/thresholds").catch((error) =>
        error instanceof ApiError && error.status === 404 ? null : Promise.reject(error)
      ),
    enabled,
  });
  const medicationsQuery = useQuery({
    queryKey: queryKeys.medicationsAll,
    queryFn: () => apiGet<MedicationRecord[]>("/api/medications").catch(() => []),
    enabled,
  });

  const loading =
    patientQuery.isLoading ||
    addressesQuery.isLoading ||
    diseasesQuery.isLoading ||
    thresholdsQuery.isLoading ||
    medicationsQuery.isLoading;
  const patient = patientQuery.data ?? null;
  const address = addressesQuery.data?.[0] ?? null;
  const diseases = diseasesQuery.data ?? [];
  const thresholds = thresholdsQuery.data ?? null;
  const medications = medicationsQuery.data ?? [];

  const activeMedications = medications.filter((item) => item.activo === 1);

  const [reauthVisible, setReauthVisible] = useState(false);
  const [reauthError, setReauthError] = useState("");

  // Orden importa: se borra primero la cuenta de Firebase (la operación
  // sensible que puede fallar por "requires-recent-login") y solo si eso
  // funciona se borran los datos en el backend. Al revés, si el paso de
  // Firebase fallaba, los datos ya habían sido eliminados sin forma de
  // recuperarlos, dejando la cuenta en un estado a medio borrar.
  async function performAccountDeletion() {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("No hay una sesión activa.");
    }
    // Se captura el token antes de borrar el usuario: una vez borrado,
    // auth.currentUser queda en null y ya no se podría obtener uno nuevo.
    const idToken = await user.getIdToken();
    await deleteUser(user);
    await apiDelete("/api/patients/me", idToken);
  }

  function handleDeleteError(error: any) {
    // Nunca se muestra error.message tal cual: puede traer detalles
    // técnicos (ej. "Error 500 al llamar /api/patients/me") que no le
    // sirven al usuario. El detalle real queda solo en consola.
    console.error("Error al eliminar la cuenta:", error);
    Alert.alert(
      "No se pudo eliminar la cuenta",
      "Ocurrió un problema inesperado. Intenta de nuevo más tarde."
    );
  }

  const deleteAccountMutation = useMutation({
    mutationFn: performAccountDeletion,
    onError: (error: any) => {
      if (error?.code === "auth/requires-recent-login") {
        // En vez de forzar cerrar sesión, se pide la contraseña ahí mismo
        // (Firebase exige reautenticación reciente para borrar la cuenta).
        setReauthError("");
        setReauthVisible(true);
        return;
      }
      handleDeleteError(error);
    },
  });

  const reauthMutation = useMutation({
    mutationFn: async (password: string) => {
      const user = auth.currentUser;
      if (!user?.email) {
        throw new Error("No hay una sesión activa.");
      }
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      await performAccountDeletion();
    },
    onSuccess: () => {
      setReauthVisible(false);
    },
    onError: (error: any) => {
      if (error?.code === "auth/invalid-credential" || error?.code === "auth/wrong-password") {
        setReauthError("Contraseña incorrecta. Intenta de nuevo.");
        return;
      }
      setReauthVisible(false);
      handleDeleteError(error);
    },
  });

  function handleDeleteAccount() {
    Alert.alert(
      "Eliminar cuenta",
      "Esta acción es irreversible: se borrarán todos tus datos (mediciones, medicamentos, dirección, enfermedades) y tu cuenta. ¿Continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar cuenta",
          style: "destructive",
          onPress: () => deleteAccountMutation.mutate(),
        },
      ]
    );
  }

  if (loading) {
    return (
      <ScreenContainer scrollable>
        <ScreenHeader showBackButton title="Información médica" />
        <ActivityIndicator color={VitaCareTheme.colors.primary} style={styles.loader} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable>
      <ScreenHeader showBackButton title="Información médica" />

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Paciente</Text>
          <Pressable
            style={styles.editButton}
            onPress={() => router.push("/edit-profile")}
            hitSlop={8}
          >
            <IconImage name="editar" size={18} />
            <Text style={styles.editButtonText}>Editar</Text>
          </Pressable>
        </View>
        <InfoCard>
          <InfoRow label="Paciente ID" value={String(patient?.idPaciente ?? "-")} />
          <InfoRow label="Usuario ID" value={String(patient?.idUsuario ?? "-")} />
          <InfoRow label="RUT" value={patient?.rut ?? "-"} />
          <InfoRow
            label="Nombre completo"
            value={
              patient
                ? `${patient.nombre} ${patient.apellidoPaterno} ${patient.apellidoMaterno ?? ""}`.trim()
                : "-"
            }
          />
          <InfoRow label="Fecha de nacimiento" value={patient?.fechaNacimiento ?? "-"} />
        </InfoCard>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Contacto y dirección</Text>
          <Pressable
            style={styles.editButton}
            onPress={() => router.push("/edit-address")}
            hitSlop={8}
          >
            <IconImage name="editar" size={18} />
            <Text style={styles.editButtonText}>{address ? "Editar" : "Agregar"}</Text>
          </Pressable>
        </View>
        <InfoCard>
          <InfoRow label="Teléfono principal" value={patient?.telefonoPrincipal ?? "-"} />
          <InfoRow
            label="Teléfono secundario"
            value={patient?.telefonoSecundario ?? "Sin registrar"}
          />
          <InfoRow label="Calle" value={address?.calle ?? "Sin dirección registrada"} />
          <InfoRow label="Número" value={address?.numero ?? "-"} />
          <InfoRow label="Comuna" value={address?.comuna ?? "-"} />
          <InfoRow label="Región" value={address?.region ?? "-"} />
        </InfoCard>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Enfermedades asociadas</Text>
          <Pressable
            style={styles.editButton}
            onPress={() => router.push("/add-disease")}
            hitSlop={8}
          >
            <IconImage name="agregar" size={18} />
            <Text style={styles.editButtonText}>Agregar</Text>
          </Pressable>
        </View>
        <InfoCard>
          {diseases.length > 0 ? (
            diseases.map((disease) => (
              <View key={disease.idEnfermedad} style={styles.diseaseItem}>
                <Text style={styles.diseaseName}>{disease.nombreEnfermedad}</Text>
                <Text style={styles.diseaseDescription}>{disease.descripcion}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.diseaseDescription}>Sin enfermedades registradas</Text>
          )}
        </InfoCard>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Umbrales médicos</Text>
        <InfoCard>
          {thresholds ? (
            <>
              <InfoRow label="Glucosa mínima" value={`${thresholds.glucosaMin} mg/dL`} />
              <InfoRow label="Glucosa máxima" value={`${thresholds.glucosaMax} mg/dL`} />
              <InfoRow label="Sistólica máxima" value={`${thresholds.sistolicaMax} mmHg`} />
              <InfoRow label="Diastólica máxima" value={`${thresholds.diastolicaMax} mmHg`} />
              <InfoRow label="Temperatura máxima" value={`${thresholds.temperaturaMax} °C`} />
            </>
          ) : (
            <Text style={styles.diseaseDescription}>Aún no tienes umbrales calculados</Text>
          )}
        </InfoCard>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tratamiento actual</Text>
        <InfoCard>
          <InfoRow label="Medicamentos activos" value={String(activeMedications.length)} />
          <InfoRow label="Total registrados" value={String(medications.length)} />
        </InfoCard>
      </View>

      <AppButton
        title={deleteAccountMutation.isPending ? "Eliminando..." : "Eliminar cuenta"}
        variant="danger"
        onPress={handleDeleteAccount}
        disabled={deleteAccountMutation.isPending}
      />

      <ReauthPasswordModal
        visible={reauthVisible}
        loading={reauthMutation.isPending}
        errorMessage={reauthError}
        onConfirm={(password) => reauthMutation.mutate(password)}
        onCancel={() => {
          setReauthVisible(false);
          setReauthError("");
        }}
      />
    </ScreenContainer>
  );
}

function InfoCard({ children }: Readonly<{ children: React.ReactNode }>) {
  return <View style={styles.card}>{children}</View>;
}

function InfoRow({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    marginTop: VitaCareTheme.spacing.xl,
  },
  section: {
    gap: VitaCareTheme.spacing.sm,
  },
  sectionTitle: {
    color: VitaCareTheme.colors.secondary,
    fontSize: VitaCareTheme.typography.subheading,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "800",
  },
  sectionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: VitaCareTheme.spacing.xs,
  },
  editButtonText: {
    color: VitaCareTheme.colors.primary,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
  card: {
    backgroundColor: VitaCareTheme.colors.surface,
    borderRadius: VitaCareTheme.radius.lg,
    borderWidth: 1,
    borderColor: VitaCareTheme.colors.border,
    padding: VitaCareTheme.spacing.md,
    gap: VitaCareTheme.spacing.md,
    ...VitaCareTheme.shadow.card,
  },
  infoRow: {
    gap: VitaCareTheme.spacing.xs,
  },
  infoLabel: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
  infoValue: {
    color: VitaCareTheme.colors.text,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
  diseaseItem: {
    gap: 2,
  },
  diseaseName: {
    color: VitaCareTheme.colors.text,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
  diseaseDescription: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
});
