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
import { refreshAuthProfile } from "@/context/AuthContext";
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
  // Si ya hay un usuario de Firebase autenticado al entrar acá (ej. recién
  // inició sesión con Google), la cuenta ya existe: se salta el paso de
  // crear credenciales y se empieza directo pidiendo los datos del paciente.
  const isAlreadyAuthenticated = auth.currentUser != null;
  const [step, setStep] = useState<Step>(isAlreadyAuthenticated ? 2 : 1);

  const [showPassword, setShowPassword] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const credentialsForm = useForm<RegisterCredentialsValues>({
    resolver: zodResolver(registerCredentialsSchema),
    mode: "onBlur",
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const personalForm = useForm<RegisterPersonalValues>({
    resolver: zodResolver(registerPersonalSchema),
    mode: "onBlur",
    defaultValues: {
      rut: "",
      // Google entrega un solo "nombre completo": se precarga ahí para que
      // el usuario no tenga que retipearlo, pero queda editable (no separa
      // confiablemente nombre de apellidos).
      nombre: auth.currentUser?.displayName ?? "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      telefono: "",
      birthDate: undefined as unknown as Date,
    },
  });

  const addressForm = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    mode: "onBlur",
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
      // refreshAuthProfile() se llama recién al presionar "Continuar": eso es
      // lo que dispara la navegación automática a select-disease (via
      // AppNavigator), así el usuario ve el mensaje de éxito antes de que la
      // pantalla cambie, no encima de la siguiente pantalla.
      Alert.alert("Registro exitoso", undefined, [
        { text: "Continuar", onPress: () => refreshAuthProfile() },
      ]);
    } catch (error) {
      // El detalle técnico (404/500/etc.) solo queda en consola: al usuario
      // se le muestra un mensaje genérico, nunca el error crudo del backend.
      console.error("Error al registrar dirección:", error);
      setLoading(false);
      Alert.alert("Error al registrar tu dirección", "No se pudo registrar tu dirección.", [
        {
          text: "Reintentar",
          // Se re-activa loading: sin esto, durante el reintento el botón
          // "Registrarse" quedaba habilitado y permitía un segundo submit
          // en paralelo.
          onPress: () => {
            setLoading(true);
            registerAddress(address);
          },
        },
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
      if (error instanceof ApiError && error.status === 409) {
        // El paciente ya se creó en un intento anterior (ej. el usuario
        // canceló el reintento de la dirección y volvió a presionar
        // "Registrarse"): no es un error real — se continúa directo con la
        // dirección, que es lo único que quedó pendiente. Sin esto, el 409
        // caía al alert genérico y su "Reintentar" volvía al mismo 409 en
        // un loop sin salida.
        await registerAddress(address);
        return;
      }
      // El detalle técnico (404/500/etc.) solo queda en consola: al usuario
      // se le muestra un mensaje genérico, nunca el error crudo del backend.
      console.error("Error al completar registro de paciente:", error);
      setLoading(false);
      Alert.alert(
        "Error al completar el registro",
        "No se pudo completar tu registro de paciente. Intenta de nuevo.",
        [
          {
            text: "Reintentar",
            // Se re-activa loading: sin esto, durante el reintento el botón
            // "Registrarse" quedaba habilitado y permitía un segundo submit
            // en paralelo.
            onPress: () => {
              setLoading(true);
              registerPatientProfile(personal, address);
            },
          },
          { text: "Cancelar", style: "cancel" },
        ],
      );
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

  // No se apaga `loading` tras un registro exitoso: la pantalla se mantiene
  // en estado de carga hasta que AppNavigator navegue a select-disease/home,
  // para no mostrar el formulario "normal" por un instante antes de navegar.
  // Sí se apaga en cada camino de error, para que el usuario pueda reintentar.
  async function handleRegister(address: AddressFormValues) {
    const personal = personalForm.getValues();
    setLoading(true);
    try {
      const displayName = `${personal.nombre.trim()} ${personal.apellidoPaterno.trim()}`.trim();
      if (auth.currentUser) {
        // Ya autenticado (ej. recién inició sesión con Google): la cuenta de
        // Firebase ya existe, no hay que crearla de nuevo.
        await updateProfile(auth.currentUser, { displayName });
      } else {
        const credentials = credentialsForm.getValues();
        const { user } = await createUserWithEmailAndPassword(
          auth,
          credentials.email.trim(),
          credentials.password
        );
        await updateProfile(user, { displayName });
      }
      await registerPatientProfile(personal, address);
    } catch (error: any) {
      const messages: Record<string, string> = {
        "auth/email-already-in-use": "Ya existe una cuenta con ese correo.",
        "auth/invalid-email": "El correo ingresado no es válido.",
        "auth/weak-password": "La contraseña debe tener al menos 6 caracteres.",
      };
      setLoading(false);
      Alert.alert(
        "Error al registrarse",
        messages[error.code] ?? "Ocurrió un error. Intenta nuevamente."
      );
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
        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.subtitle}>
          Paso {step} de 3 — {stepTitles[step]}.
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
            {!isAlreadyAuthenticated ? (
              <AppButton title="Atrás" variant="outline" onPress={handleBackToCredentials} />
            ) : null}
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
              title={loading ? "Guardando..." : "Registrarse"}
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
