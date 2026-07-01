import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { BrandHeader } from "@/components/BrandHeader";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { auth } from "@/config/firebase";
import { refreshAuthProfile, useAuth } from "@/context/AuthContext";
import { ApiError, apiPost } from "@/services/apiClient";
import { VitaCareTheme } from "@/theme/theme";

/** Formatea un Date como "DD/MM/AAAA" para mostrarlo en el input. */
function formatBirthDate(date: Date): string {
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

export default function RegisterScreen() {
  const authState = useAuth();
  const isCompletingProfile = authState.status === "authenticated";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [rut, setRut] = useState("");
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [telefono, setTelefono] = useState("");
  const [loading, setLoading] = useState(false);

  function onValueChangeBirthDate(_event: DateTimePickerChangeEvent, selectedDate: Date) {
    setShowDatePicker(false);
    setBirthDate(selectedDate);
  }

  function onDismissBirthDate() {
    setShowDatePicker(false);
  }

  async function registerPatientProfile() {
    try {
      await apiPost("/api/auth/register", {
        rut: rut.trim(),
        nombre: nombre.trim(),
        apellidoPaterno: apellidoPaterno.trim(),
        apellidoMaterno: apellidoMaterno.trim() || undefined,
        fechaNacimiento: birthDate ? toIsoDate(birthDate) : null,
        telefonoPrincipal: telefono.trim(),
      });
      await refreshAuthProfile();
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo completar tu registro de paciente.";
      Alert.alert("Error al completar el registro", message, [
        { text: "Reintentar", onPress: registerPatientProfile },
        { text: "Cancelar", style: "cancel" },
      ]);
    }
  }

  function validatePatientFields(): boolean {
    if (!nombre.trim() || !apellidoPaterno.trim() || !rut.trim() || !telefono.trim()) {
      Alert.alert(
        "Campos requeridos",
        "RUT, nombre, apellido paterno y teléfono son obligatorios."
      );
      return false;
    }
    if (!birthDate) {
      Alert.alert("Fecha requerida", "Selecciona tu fecha de nacimiento.");
      return false;
    }
    return true;
  }

  async function handleRegister() {
    if (isCompletingProfile) {
      if (!validatePatientFields()) return;
      setLoading(true);
      await registerPatientProfile();
      setLoading(false);
      return;
    }

    if (!email.trim() || !password) {
      Alert.alert("Campos requeridos", "Correo y contraseña son obligatorios.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Contraseña inválida", "La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (!validatePatientFields()) return;

    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(user, {
        displayName: `${nombre.trim()} ${apellidoPaterno.trim()}`.trim(),
      });
      await registerPatientProfile();
    } catch (error: any) {
      const messages: Record<string, string> = {
        "auth/email-already-in-use": "Ya existe una cuenta con ese correo.",
        "auth/invalid-email": "El correo ingresado no es válido.",
        "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
      };
      Alert.alert(
        "Error al registrarse",
        messages[error.code] ?? "Ocurrió un error. Intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer scrollable>
      <ScreenHeader showBackButton title="Registrarse" />
      <BrandHeader logoStyle="horizontal" />
      <View style={styles.header}>
        <Text style={styles.title}>
          {isCompletingProfile ? "Completa tu perfil" : "Crear cuenta"}
        </Text>
        <Text style={styles.subtitle}>
          {isCompletingProfile
            ? "Nos falta un poco más de información para terminar tu registro."
            : "Completa tus datos para comenzar a usar VitaCare."}
        </Text>
      </View>

      <View style={styles.form}>
        {isCompletingProfile ? null : (
          <>
            <AppInput
              label="Correo electrónico"
              placeholder="correo@vitacare.cl"
              icon="usuario"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <AppInput
              label="Contraseña"
              placeholder="••••••••"
              secureTextEntry
              icon="medicamento"
              value={password}
              onChangeText={setPassword}
            />
          </>
        )}
        <AppInput
          label="RUT"
          placeholder="12.345.678-9"
          icon="md-del-usuario"
          value={rut}
          onChangeText={setRut}
        />
        <AppInput
          label="Nombre"
          placeholder="María Carolina"
          icon="usuario"
          value={nombre}
          onChangeText={setNombre}
        />
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
              value={birthDate ? formatBirthDate(birthDate) : ""}
              editable={false}
            />
          </View>
        </Pressable>
        {showDatePicker ? (
          <DateTimePicker
            value={birthDate ?? new Date(2000, 0, 1)}
            mode="date"
            maximumDate={new Date()}
            onValueChange={onValueChangeBirthDate}
            onDismiss={onDismissBirthDate}
            accentColor={VitaCareTheme.colors.primary}
            themeVariant="light"
          />
        ) : null}
        <AppInput
          label="Teléfono"
          placeholder="+56 9 8765 4321"
          icon="usuario"
          value={telefono}
          onChangeText={setTelefono}
          keyboardType="phone-pad"
        />

        <AppButton
          title={
            loading
              ? "Guardando..."
              : isCompletingProfile
                ? "Completar registro"
                : "Registrarse"
          }
          onPress={handleRegister}
          disabled={loading}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: VitaCareTheme.spacing.xs,
  },
  title: {
    color: VitaCareTheme.colors.secondary,
    fontSize: 28,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "800",
  },
  subtitle: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
  form: {
    gap: VitaCareTheme.spacing.md,
    paddingTop: VitaCareTheme.spacing.lg,
  },
});
