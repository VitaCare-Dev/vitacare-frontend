import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { AppPickerField } from "@/components/AppPickerField";
import { BrandHeader } from "@/components/BrandHeader";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { auth } from "@/config/firebase";
import { refreshAuthProfile, useAuth } from "@/context/AuthContext";
import { chileRegions, getComunasByRegion } from "@/data/chileRegions";
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

type Step = 1 | 2 | 3;

export default function RegisterScreen() {
  const authState = useAuth();
  const isCompletingProfile = authState.status === "authenticated";
  // Quien está completando perfil ya tiene cuenta de Firebase: se salta el paso de credenciales.
  const [step, setStep] = useState<Step>(isCompletingProfile ? 2 : 1);
  const totalSteps = isCompletingProfile ? 2 : 3;
  const displayStep = isCompletingProfile ? step - 1 : step;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [nombre, setNombre] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [rut, setRut] = useState("");
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [telefono, setTelefono] = useState("");
  const [calle, setCalle] = useState("");
  const [numero, setNumero] = useState("");
  const [regionId, setRegionId] = useState("");
  const [comunaId, setComunaId] = useState("");
  const [loading, setLoading] = useState(false);

  const comunaOptions = regionId ? getComunasByRegion(regionId) : [];

  function handleChangeRegion(value: string) {
    setRegionId(value);
    setComunaId("");
  }

  function onValueChangeBirthDate(_event: DateTimePickerChangeEvent, selectedDate: Date) {
    setShowDatePicker(false);
    setBirthDate(selectedDate);
  }

  function onDismissBirthDate() {
    setShowDatePicker(false);
  }

  async function registerAddress() {
    const regionName = chileRegions.find((item) => item.id === regionId)?.name ?? "";
    const comunaName = comunaOptions.find((item) => item.id === comunaId)?.name ?? "";
    try {
      await apiPost("/api/patients/me/addresses", {
        calle: calle.trim(),
        numero: numero.trim(),
        comuna: comunaName,
        region: regionName,
      });
      await refreshAuthProfile();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "No se pudo registrar tu dirección.";
      Alert.alert("Error al registrar tu dirección", message, [
        { text: "Reintentar", onPress: registerAddress },
        { text: "Cancelar", style: "cancel" },
      ]);
    }
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
      // La dirección se crea como paso propio (con su propio reintento): si
      // solo ella falla, no hay que reintentar la creación del paciente
      // (que no es idempotente y respondería 409 con el mismo RUT).
      await registerAddress();
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

  function validateCredentialsFields(): boolean {
    if (!email.trim() || !password) {
      Alert.alert("Campos requeridos", "Correo y contraseña son obligatorios.");
      return false;
    }
    if (password.length < 6) {
      Alert.alert("Contraseña inválida", "La contraseña debe tener al menos 6 caracteres.");
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert("Las contraseñas no coinciden", "Verifica que ambas contraseñas sean iguales.");
      return false;
    }
    return true;
  }

  function validatePersonalFields(): boolean {
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

  function validateAddressFields(): boolean {
    if (!regionId || !comunaId || !calle.trim() || !numero.trim()) {
      Alert.alert(
        "Campos requeridos",
        "Región, comuna, calle y número son obligatorios."
      );
      return false;
    }
    return true;
  }

  function handleNextFromCredentials() {
    if (!validateCredentialsFields()) return;
    setStep(2);
  }

  function handleNextFromPersonal() {
    if (!validatePersonalFields()) return;
    setStep(3);
  }

  function handleBackToCredentials() {
    setStep(1);
  }

  function handleBackToPersonal() {
    setStep(2);
  }

  async function handleRegister() {
    if (!validateAddressFields()) return;

    if (isCompletingProfile) {
      setLoading(true);
      await registerPatientProfile();
      setLoading(false);
      return;
    }

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

  const stepTitles: Record<Step, string> = {
    1: "Tu cuenta",
    2: "Tus datos personales",
    3: "Tu dirección",
  };

  return (
    <ScreenContainer scrollable>
      <ScreenHeader showBackButton title="Registrarse" />
      <BrandHeader logoStyle="vertical" />
      <View style={styles.header}>
        <Text style={styles.title}>
          {isCompletingProfile ? "Completa tu perfil" : "Crear cuenta"}
        </Text>
        <Text style={styles.subtitle}>
          Paso {displayStep} de {totalSteps} — {stepTitles[step]}.
        </Text>
      </View>

      <View style={styles.form}>
        {step === 1 && (
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
              secureTextEntry={!showPassword}
              icon="medicamento"
              value={password}
              onChangeText={setPassword}
            />
            <AppInput
              label="Repetir contraseña"
              placeholder="••••••••"
              secureTextEntry={!showPassword}
              icon="medicamento"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <Pressable onPress={() => setShowPassword((prev) => !prev)}>
              <Text style={styles.link}>
                {showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              </Text>
            </Pressable>

            <AppButton title="Siguiente" onPress={handleNextFromCredentials} />
          </>
        )}

        {step === 2 && (
          <>
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

            <AppButton title="Siguiente" onPress={handleNextFromPersonal} />
            {isCompletingProfile ? null : (
              <AppButton title="Atrás" variant="outline" onPress={handleBackToCredentials} />
            )}
          </>
        )}

        {step === 3 && (
          <>
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
            <AppInput
              label="Calle"
              placeholder="Av. Los Carrera"
              icon="nota"
              value={calle}
              onChangeText={setCalle}
            />
            <AppInput
              label="Número"
              placeholder="1234, Depto. 56"
              icon="nota"
              value={numero}
              onChangeText={setNumero}
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
            <AppButton
              title="Atrás"
              variant="outline"
              onPress={handleBackToPersonal}
              disabled={loading}
            />
          </>
        )}
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
  link: {
    textAlign: "right",
    color: VitaCareTheme.colors.primary,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "600",
  },
});
