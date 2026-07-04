import { zodResolver } from "@hookform/resolvers/zod";
import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { AppPickerField } from "@/components/AppPickerField";
import { BrandHeader } from "@/components/BrandHeader";
import { PasswordRequirementsChecklist } from "@/components/PasswordRequirementsChecklist";
import { PasswordVisibilityToggle } from "@/components/PasswordVisibilityToggle";
import { PhoneInput } from "@/components/PhoneInput";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { auth } from "@/config/firebase";
import { refreshAuthProfile, useAuth } from "@/context/AuthContext";
import { chileRegions, getComunasByRegion } from "@/data/chileRegions";
import { ApiError, apiPost } from "@/services/apiClient";
import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";
import {
  addressSchema,
  registerCredentialsSchema,
  registerPersonalSchema,
  type AddressFormValues,
  type RegisterCredentialsValues,
  type RegisterPersonalValues,
} from "@/utils/formSchemas";
import { formatRut } from "@/utils/rutFormat";

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
  const theme = useTheme();
  const styles = createStyles(theme);
  const authState = useAuth();
  const isCompletingProfile = authState.status === "authenticated";
  // Quien está completando perfil ya tiene cuenta de Firebase: se salta el paso de credenciales.
  const [step, setStep] = useState<Step>(isCompletingProfile ? 2 : 1);
  const totalSteps = isCompletingProfile ? 2 : 3;
  const displayStep = isCompletingProfile ? step - 1 : step;

  const [showPassword, setShowPassword] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const credentialsForm = useForm<RegisterCredentialsValues>({
    resolver: zodResolver(registerCredentialsSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const personalForm = useForm<RegisterPersonalValues>({
    resolver: zodResolver(registerPersonalSchema),
    defaultValues: {
      rut: "",
      nombre: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      telefono: "",
      birthDate: undefined as unknown as Date,
    },
  });

  const addressForm = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: { regionId: "", comunaId: "", calle: "", numero: "" },
  });

  const regionId = addressForm.watch("regionId");
  const comunaOptions = regionId ? getComunasByRegion(regionId) : [];
  const birthDate = personalForm.watch("birthDate");
  const password = credentialsForm.watch("password");

  function handleChangeRegion(value: string) {
    addressForm.setValue("regionId", value);
    addressForm.setValue("comunaId", "");
  }

  function onValueChangeBirthDate(_event: DateTimePickerChangeEvent, selectedDate: Date) {
    setShowDatePicker(false);
    personalForm.setValue("birthDate", selectedDate, { shouldValidate: true });
  }

  function onDismissBirthDate() {
    setShowDatePicker(false);
  }

  async function registerAddress(address: AddressFormValues) {
    const regionName = chileRegions.find((item) => item.id === address.regionId)?.name ?? "";
    const comunaName =
      getComunasByRegion(address.regionId).find((item) => item.id === address.comunaId)?.name ??
      "";
    try {
      await apiPost("/api/patients/me/addresses", {
        calle: address.calle.trim(),
        numero: address.numero.trim(),
        comuna: comunaName,
        region: regionName,
      });
      await refreshAuthProfile();
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : "No se pudo registrar tu dirección.";
      Alert.alert("Error al registrar tu dirección", message, [
        { text: "Reintentar", onPress: () => registerAddress(address) },
        { text: "Cancelar", style: "cancel" },
      ]);
    }
  }

  async function registerPatientProfile(personal: RegisterPersonalValues, address: AddressFormValues) {
    try {
      await apiPost("/api/auth/register", {
        rut: personal.rut.trim(),
        nombre: personal.nombre.trim(),
        apellidoPaterno: personal.apellidoPaterno.trim(),
        apellidoMaterno: personal.apellidoMaterno.trim() || undefined,
        fechaNacimiento: toIsoDate(personal.birthDate),
        telefonoPrincipal: personal.telefono.trim(),
      });
      // La dirección se crea como paso propio (con su propio reintento): si
      // solo ella falla, no hay que reintentar la creación del paciente
      // (que no es idempotente y respondería 409 con el mismo RUT).
      await registerAddress(address);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : "No se pudo completar tu registro de paciente.";
      Alert.alert("Error al completar el registro", message, [
        { text: "Reintentar", onPress: () => registerPatientProfile(personal, address) },
        { text: "Cancelar", style: "cancel" },
      ]);
    }
  }

  function handleNextFromCredentials() {
    credentialsForm.handleSubmit(() => setStep(2))();
  }

  function handleNextFromPersonal() {
    personalForm.handleSubmit(() => setStep(3))();
  }

  function handleBackToCredentials() {
    setStep(1);
  }

  function handleBackToPersonal() {
    setStep(2);
  }

  async function handleRegister(address: AddressFormValues) {
    const personal = personalForm.getValues();

    if (isCompletingProfile) {
      setLoading(true);
      await registerPatientProfile(personal, address);
      setLoading(false);
      return;
    }

    const credentials = credentialsForm.getValues();
    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        credentials.email.trim(),
        credentials.password
      );
      await updateProfile(user, {
        displayName: `${personal.nombre.trim()} ${personal.apellidoPaterno.trim()}`.trim(),
      });
      await registerPatientProfile(personal, address);
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
            <Controller
              control={credentialsForm.control}
              name="email"
              render={({ field, fieldState }) => (
                <AppInput
                  label="Correo electrónico"
                  placeholder="correo@vitacare.cl"
                  icon="usuario"
                  value={field.value}
                  onChangeText={field.onChange}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  errorMessage={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={credentialsForm.control}
              name="password"
              render={({ field, fieldState }) => (
                <AppInput
                  label="Contraseña"
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  icon="medicamento"
                  value={field.value}
                  onChangeText={field.onChange}
                  errorMessage={fieldState.error?.message}
                  rightElement={
                    <PasswordVisibilityToggle
                      visible={showPassword}
                      onToggle={() => setShowPassword((prev) => !prev)}
                    />
                  }
                />
              )}
            />
            <PasswordRequirementsChecklist password={password} />
            <Controller
              control={credentialsForm.control}
              name="confirmPassword"
              render={({ field, fieldState }) => (
                <AppInput
                  label="Repetir contraseña"
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  icon="medicamento"
                  value={field.value}
                  onChangeText={field.onChange}
                  errorMessage={fieldState.error?.message}
                  rightElement={
                    <PasswordVisibilityToggle
                      visible={showPassword}
                      onToggle={() => setShowPassword((prev) => !prev)}
                    />
                  }
                />
              )}
            />

            <AppButton title="Siguiente" onPress={handleNextFromCredentials} />
          </>
        )}

        {step === 2 && (
          <>
            <Controller
              control={personalForm.control}
              name="rut"
              render={({ field, fieldState }) => (
                <AppInput
                  label="RUT"
                  placeholder="12.345.678-9"
                  icon="md-del-usuario"
                  value={field.value}
                  onChangeText={(text) => field.onChange(formatRut(text))}
                  maxLength={12}
                  errorMessage={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={personalForm.control}
              name="nombre"
              render={({ field, fieldState }) => (
                <AppInput
                  label="Nombre"
                  placeholder="María Carolina"
                  icon="usuario"
                  value={field.value}
                  onChangeText={field.onChange}
                  errorMessage={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={personalForm.control}
              name="apellidoPaterno"
              render={({ field, fieldState }) => (
                <AppInput
                  label="Apellido paterno"
                  placeholder="Pérez"
                  icon="usuario"
                  value={field.value}
                  onChangeText={field.onChange}
                  errorMessage={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={personalForm.control}
              name="apellidoMaterno"
              render={({ field }) => (
                <AppInput
                  label="Apellido materno"
                  placeholder="Gómez"
                  icon="usuario"
                  value={field.value}
                  onChangeText={field.onChange}
                />
              )}
            />
            <Pressable onPress={() => setShowDatePicker(true)}>
              <View pointerEvents="none">
                <AppInput
                  label="Fecha de nacimiento"
                  placeholder="15/05/1985"
                  icon="nota"
                  value={birthDate ? formatBirthDate(birthDate) : ""}
                  editable={false}
                  errorMessage={personalForm.formState.errors.birthDate?.message}
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
                accentColor={theme.colors.primary}
                themeVariant="light"
              />
            ) : null}
            <Controller
              control={personalForm.control}
              name="telefono"
              render={({ field, fieldState }) => (
                <PhoneInput
                  label="Teléfono"
                  icon="usuario"
                  value={field.value}
                  onChangeText={field.onChange}
                  errorMessage={fieldState.error?.message}
                />
              )}
            />

            <AppButton title="Siguiente" onPress={handleNextFromPersonal} />
            {isCompletingProfile ? null : (
              <AppButton title="Atrás" variant="outline" onPress={handleBackToCredentials} />
            )}
          </>
        )}

        {step === 3 && (
          <>
            <Controller
              control={addressForm.control}
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
              control={addressForm.control}
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
              control={addressForm.control}
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
              control={addressForm.control}
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

            <AppButton
              title={
                loading
                  ? "Guardando..."
                  : isCompletingProfile
                    ? "Completar registro"
                    : "Registrarse"
              }
              onPress={addressForm.handleSubmit(handleRegister)}
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

function createStyles(theme: VitaCareThemeType) {
  return StyleSheet.create({
  header: {
    gap: theme.spacing.xs,
  },
  title: {
    color: theme.colors.secondary,
    fontSize: 28,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "800",
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    fontFamily: theme.typography.fontFamily,
  },
  form: {
    gap: theme.spacing.md,
    paddingTop: theme.spacing.lg,
  },
});
}
