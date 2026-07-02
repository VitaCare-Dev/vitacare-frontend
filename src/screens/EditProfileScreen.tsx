import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAuth } from "@/context/AuthContext";
import { ApiError, apiGet, apiPut } from "@/services/apiClient";
import { queryKeys } from "@/services/queryKeys";
import { VitaCareTheme } from "@/theme/theme";

/** Espejo de PatientDto del BFF. */
type PatientRecord = {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string | null;
  fechaNacimiento: string;
  telefonoPrincipal: string;
  telefonoSecundario: string | null;
};

/** Formatea un Date como "DD/MM/AAAA" para mostrarlo en el input. */
function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
}

/** Convierte un Date a "AAAA-MM-DD" (ISO) usando la fecha local, sin corrimiento por timezone. */
function toIsoDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export default function EditProfileScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const authState = useAuth();
  const enabled = authState.status === "authenticated";

  const patientQuery = useQuery({
    queryKey: queryKeys.patientMe,
    queryFn: () => apiGet<PatientRecord>("/api/patients/me"),
    enabled,
  });
  const patient = patientQuery.data ?? null;

  const [nombre, setNombre] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [telefonoPrincipal, setTelefonoPrincipal] = useState("");
  const [telefonoSecundario, setTelefonoSecundario] = useState("");
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (initialized || !patient) return;

    setNombre(patient.nombre);
    setApellidoPaterno(patient.apellidoPaterno);
    setApellidoMaterno(patient.apellidoMaterno ?? "");
    setTelefonoPrincipal(patient.telefonoPrincipal);
    setTelefonoSecundario(patient.telefonoSecundario ?? "");
    setBirthDate(new Date(patient.fechaNacimiento));
    setInitialized(true);
  }, [patient, initialized]);

  const saveMutation = useMutation({
    mutationFn: (payload: {
      nombre: string;
      apellidoPaterno: string;
      apellidoMaterno?: string;
      fechaNacimiento: string;
      telefonoPrincipal: string;
      telefonoSecundario?: string;
    }) => apiPut("/api/patients/me", payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.patientMe });
      Alert.alert("Perfil actualizado", "Tus datos se guardaron correctamente.", [
        { text: "Aceptar", onPress: () => router.back() },
      ]);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "No se pudo actualizar el perfil.";
      Alert.alert("Error", message);
    },
  });

  function handleSave() {
    if (!nombre.trim() || !apellidoPaterno.trim() || !telefonoPrincipal.trim() || !birthDate) {
      Alert.alert(
        "Campos requeridos",
        "Nombre, apellido paterno, teléfono principal y fecha de nacimiento son obligatorios."
      );
      return;
    }

    saveMutation.mutate({
      nombre: nombre.trim(),
      apellidoPaterno: apellidoPaterno.trim(),
      apellidoMaterno: apellidoMaterno.trim() || undefined,
      fechaNacimiento: toIsoDate(birthDate),
      telefonoPrincipal: telefonoPrincipal.trim(),
      telefonoSecundario: telefonoSecundario.trim() || undefined,
    });
  }

  if (patientQuery.isLoading) {
    return (
      <ScreenContainer scrollable>
        <ScreenHeader showBackButton title="Editar perfil" />
        <ActivityIndicator color={VitaCareTheme.colors.primary} style={styles.loader} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable>
      <ScreenHeader showBackButton title="Editar perfil" />
      <View style={styles.header}>
        <Text style={styles.title}>Editar perfil</Text>
        <Text style={styles.subtitle}>Actualiza tus datos personales.</Text>
      </View>

      <View style={styles.card}>
        <AppInput label="Nombre" placeholder="María Carolina" icon="usuario" value={nombre} onChangeText={setNombre} />
        <AppInput
          label="Apellido paterno"
          placeholder="Pérez"
          icon="usuario"
          value={apellidoPaterno}
          onChangeText={setApellidoPaterno}
        />
        <AppInput
          label="Apellido materno"
          placeholder="Gómez"
          icon="usuario"
          value={apellidoMaterno}
          onChangeText={setApellidoMaterno}
        />
        <Pressable onPress={() => setShowDatePicker(true)}>
          <View pointerEvents="none">
            <AppInput
              label="Fecha de nacimiento"
              placeholder="15/05/1985"
              icon="nota"
              value={birthDate ? formatDate(birthDate) : ""}
              editable={false}
            />
          </View>
        </Pressable>
        {showDatePicker ? (
          <DateTimePicker
            value={birthDate ?? new Date(2000, 0, 1)}
            mode="date"
            maximumDate={new Date()}
            onValueChange={(_event: DateTimePickerChangeEvent, selectedDate: Date) => {
              setShowDatePicker(false);
              setBirthDate(selectedDate);
            }}
            onDismiss={() => setShowDatePicker(false)}
            accentColor={VitaCareTheme.colors.primary}
            themeVariant="light"
          />
        ) : null}
        <AppInput
          label="Teléfono principal"
          placeholder="+56 9 8765 4321"
          icon="usuario"
          keyboardType="phone-pad"
          value={telefonoPrincipal}
          onChangeText={setTelefonoPrincipal}
        />
        <AppInput
          label="Teléfono secundario (opcional)"
          placeholder="+56 9 1234 5678"
          icon="usuario"
          keyboardType="phone-pad"
          value={telefonoSecundario}
          onChangeText={setTelefonoSecundario}
        />
      </View>

      <AppButton
        title={saveMutation.isPending ? "Guardando..." : "Guardar cambios"}
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
