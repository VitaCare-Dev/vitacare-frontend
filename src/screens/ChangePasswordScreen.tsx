import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { PasswordRequirementsChecklist } from "@/components/PasswordRequirementsChecklist";
import { PasswordVisibilityToggle } from "@/components/PasswordVisibilityToggle";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { auth } from "@/config/firebase";
import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";
import { changePasswordSchema, type ChangePasswordFormValues } from "@/utils/formSchemas";

export default function ChangePasswordScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, watch } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onBlur",
    defaultValues: { currentPassword: "", newPassword: "", confirmNewPassword: "" },
  });

  const newPassword = watch("newPassword");

  async function onSubmit(values: ChangePasswordFormValues) {
    const user = auth.currentUser;
    if (!user?.email) {
      Alert.alert("No se pudo cambiar la contraseña", "No hay una sesión activa.");
      return;
    }

    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, values.currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, values.newPassword);
      Alert.alert("Contraseña actualizada", "Tu contraseña se cambió correctamente.", [
        { text: "Aceptar", onPress: () => router.back() },
      ]);
    } catch (error: any) {
      const messages: Record<string, string> = {
        "auth/invalid-credential": "La contraseña actual es incorrecta.",
        "auth/wrong-password": "La contraseña actual es incorrecta.",
        "auth/too-many-requests": "Demasiados intentos. Intenta más tarde.",
      };
      Alert.alert(
        "No se pudo cambiar la contraseña",
        messages[error.code] ?? "Ocurrió un error. Intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer scrollable>
      <ScreenHeader showBackButton title="Cambiar contraseña" />
      <View style={styles.header}>
        <Text style={styles.title}>Cambiar contraseña</Text>
        <Text style={styles.subtitle}>Ingresa tu contraseña actual y la nueva.</Text>
      </View>

      <View style={styles.card}>
        <Controller
          control={control}
          name="currentPassword"
          render={({ field, fieldState }) => (
            <AppInput
              label="Contraseña actual"
              placeholder="••••••••"
              secureTextEntry={!showPasswords}
              icon="medicamento"
              value={field.value}
              onChangeText={field.onChange}
              errorMessage={fieldState.error?.message}
              rightElement={
                <PasswordVisibilityToggle
                  visible={showPasswords}
                  onToggle={() => setShowPasswords((prev) => !prev)}
                />
              }
            />
          )}
        />
        <Controller
          control={control}
          name="newPassword"
          render={({ field, fieldState }) => (
            <AppInput
              label="Nueva contraseña"
              placeholder="••••••••"
              secureTextEntry={!showPasswords}
              icon="medicamento"
              value={field.value}
              onChangeText={field.onChange}
              errorMessage={fieldState.error?.message}
              rightElement={
                <PasswordVisibilityToggle
                  visible={showPasswords}
                  onToggle={() => setShowPasswords((prev) => !prev)}
                />
              }
            />
          )}
        />
        <PasswordRequirementsChecklist password={newPassword} />
        <Controller
          control={control}
          name="confirmNewPassword"
          render={({ field, fieldState }) => (
            <AppInput
              label="Repetir nueva contraseña"
              placeholder="••••••••"
              secureTextEntry={!showPasswords}
              icon="medicamento"
              value={field.value}
              onChangeText={field.onChange}
              errorMessage={fieldState.error?.message}
              rightElement={
                <PasswordVisibilityToggle
                  visible={showPasswords}
                  onToggle={() => setShowPasswords((prev) => !prev)}
                />
              }
            />
          )}
        />
      </View>

      <AppButton
        title={loading ? "Guardando..." : "Cambiar contraseña"}
        onPress={handleSubmit(onSubmit)}
        disabled={loading}
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
