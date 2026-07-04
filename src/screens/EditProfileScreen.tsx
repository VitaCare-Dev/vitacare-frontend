import { zodResolver } from "@hookform/resolvers/zod";
import DateTimePicker, {
  type DateTimePickerChangeEvent,
} from "@react-native-community/datetimepicker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { PhoneInput } from "@/components/PhoneInput";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAuth } from "@/context/AuthContext";
import { ApiError, apiGet, apiPut } from "@/services/apiClient";
import { queryKeys } from "@/services/queryKeys";
import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";
import { editProfileSchema, type EditProfileFormValues } from "@/utils/formSchemas";
import { formatChileanPhone } from "@/utils/phoneFormat";

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
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const queryClient = useQueryClient();
  const authState = useAuth();
  const enabled = authState.status === "authenticated";
  const [showDatePicker, setShowDatePicker] = useState(false);

  const patientQuery = useQuery({
    queryKey: queryKeys.patientMe,
    queryFn: () => apiGet<PatientRecord>("/api/patients/me"),
    enabled,
  });
  const patient = patientQuery.data ?? null;

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      nombre: "",
      apellidoPaterno: "",
      apellidoMaterno: "",
      telefonoPrincipal: "",
      telefonoSecundario: "",
      birthDate: undefined as unknown as Date,
    },
  });

  useEffect(() => {
    if (!patient) return;
    reset({
      nombre: patient.nombre,
      apellidoPaterno: patient.apellidoPaterno,
      apellidoMaterno: patient.apellidoMaterno ?? "",
      telefonoPrincipal: formatChileanPhone(patient.telefonoPrincipal),
      telefonoSecundario: formatChileanPhone(patient.telefonoSecundario ?? ""),
      birthDate: new Date(patient.fechaNacimiento),
    });
  }, [patient, reset]);

  const birthDate = watch("birthDate");

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

  function onSubmit(values: EditProfileFormValues) {
    saveMutation.mutate({
      nombre: values.nombre.trim(),
      apellidoPaterno: values.apellidoPaterno.trim(),
      apellidoMaterno: values.apellidoMaterno.trim() || undefined,
      fechaNacimiento: toIsoDate(values.birthDate),
      telefonoPrincipal: values.telefonoPrincipal.trim(),
      telefonoSecundario: values.telefonoSecundario.trim() || undefined,
    });
  }

  if (patientQuery.isLoading) {
    return (
      <ScreenContainer scrollable>
        <ScreenHeader showBackButton title="Editar perfil" />
        <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
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
        <Controller
          control={control}
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
          control={control}
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
          control={control}
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
              value={birthDate ? formatDate(birthDate) : ""}
              editable={false}
              errorMessage={errors.birthDate?.message}
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
              setValue("birthDate", selectedDate, { shouldValidate: true });
            }}
            onDismiss={() => setShowDatePicker(false)}
            accentColor={theme.colors.primary}
            themeVariant="light"
          />
        ) : null}
        <Controller
          control={control}
          name="telefonoPrincipal"
          render={({ field, fieldState }) => (
            <PhoneInput
              label="Teléfono principal"
              icon="usuario"
              value={field.value}
              onChangeText={field.onChange}
              errorMessage={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="telefonoSecundario"
          render={({ field, fieldState }) => (
            <PhoneInput
              label="Teléfono secundario (opcional)"
              icon="usuario"
              value={field.value}
              onChangeText={field.onChange}
              errorMessage={fieldState.error?.message}
            />
          )}
        />
      </View>

      <AppButton
        title={saveMutation.isPending ? "Guardando..." : "Guardar cambios"}
        onPress={handleSubmit(onSubmit)}
        disabled={saveMutation.isPending}
      />
    </ScreenContainer>
  );
}

function createStyles(theme: VitaCareThemeType) {
  return StyleSheet.create({
  loader: {
    marginTop: theme.spacing.xl,
  },
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
