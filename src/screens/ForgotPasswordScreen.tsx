import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { auth } from "@/config/firebase";
import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/utils/formSchemas";

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const { control, handleSubmit } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, values.email.trim());
      setSent(true);
    } catch (error: any) {
      const messages: Record<string, string> = {
        "auth/invalid-email": "El correo ingresado no es válido.",
        "auth/too-many-requests": "Demasiados intentos. Intenta más tarde.",
      };
      // Nota: Firebase no confirma si el correo existe o no (evita filtrar
      // qué correos están registrados), así que "user-not-found" también
      // muestra el mismo mensaje de éxito genérico en vez de un error.
      if (error.code === "auth/user-not-found") {
        setSent(true);
        return;
      }
      Alert.alert(
        "No se pudo enviar el correo",
        messages[error.code] ?? "Ocurrió un error. Intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer scrollable>
      <ScreenHeader showBackButton title="Recuperar contraseña" />
      <View style={styles.header}>
        <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
        <Text style={styles.subtitle}>
          Ingresa tu correo y te enviaremos un enlace para restablecerla.
        </Text>
      </View>

      {sent ? (
        <View style={styles.confirmationCard}>
          <Text style={styles.confirmationText}>
            Si existe una cuenta con ese correo, te enviamos un enlace para restablecer tu
            contraseña. Revisa tu bandeja de entrada (y spam).
          </Text>
          <AppButton title="Volver a iniciar sesión" onPress={() => router.replace("/login")} />
        </View>
      ) : (
        <View style={styles.form}>
          <Controller
            control={control}
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

          <AppButton
            title={loading ? "Enviando..." : "Enviar enlace"}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          />
        </View>
      )}
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
    form: {
      marginTop: theme.spacing.xl,
      gap: theme.spacing.md,
    },
    confirmationCard: {
      marginTop: theme.spacing.xl,
      gap: theme.spacing.lg,
      backgroundColor: theme.colors.surfaceAlt,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.md,
    },
    confirmationText: {
      color: theme.colors.text,
      fontSize: theme.typography.body,
      fontFamily: theme.typography.fontFamily,
    },
  });
}
