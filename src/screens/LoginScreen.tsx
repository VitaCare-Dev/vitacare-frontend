import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { BrandHeader } from "@/components/BrandHeader";
import { PasswordVisibilityToggle } from "@/components/PasswordVisibilityToggle";
import { ScreenContainer } from "@/components/ScreenContainer";
import { auth } from "@/config/firebase";
import { signInWithGoogle } from "@/services/googleAuth";
import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";
import { loginSchema, type LoginFormValues } from "@/utils/formSchemas";

export default function LoginScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Error al iniciar sesión con Google:", error);
      Alert.alert("Error", "No se pudo iniciar sesión con Google.");
    } finally {
      setGoogleLoading(false);
    }
  }

  const {
    control,
    handleSubmit,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, values.email.trim(), values.password);
      router.replace("/(tabs)/home");
    } catch (error: any) {
      const messages: Record<string, string> = {
        "auth/invalid-credential": "Correo o contraseña incorrectos.",
        "auth/user-not-found": "No existe una cuenta con ese correo.",
        "auth/wrong-password": "Contraseña incorrecta.",
        "auth/invalid-email": "El correo ingresado no es válido.",
        "auth/too-many-requests": "Demasiados intentos. Intenta más tarde.",
      };
      Alert.alert(
        "Error al iniciar sesión",
        messages[error.code] ?? "Ocurrió un error. Intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScreenContainer scrollable>
      <View style={styles.centered}>
        <BrandHeader logoStyle="vertical" />
        <Text style={styles.tagline}>Tu salud, siempre contigo.</Text>
      </View>

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
        <Controller
          control={control}
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

        <AppButton
          title={loading ? "Ingresando..." : "Iniciar sesión"}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        />

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o</Text>
          <View style={styles.dividerLine} />
        </View>

        <AppButton
          title={googleLoading ? "Ingresando..." : "Continuar con Google"}
          variant="outline"
          onPress={handleGoogleSignIn}
          disabled={googleLoading}
        />

        <Pressable onPress={() => router.push("/forgot-password")}>
          <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
        </Pressable>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>¿No tienes cuenta? </Text>
          <Pressable onPress={() => router.push("/register")}>
            <Text style={styles.footerLink}>Registrarse</Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
}

function createStyles(theme: VitaCareThemeType) {
  return StyleSheet.create({
  centered: {
    alignItems: "center",
    gap: theme.spacing.md,
    paddingTop: theme.spacing.xl,
  },
  tagline: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.body,
    fontFamily: theme.typography.fontFamily,
    fontStyle: "italic",
  },
  form: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
  },
  link: {
    textAlign: "right",
    color: theme.colors.primary,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "600",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: theme.spacing.lg,
  },
  footerText: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontFamily: theme.typography.fontFamily,
  },
  footerLink: {
    color: theme.colors.primary,
    fontSize: theme.typography.body,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "700",
  },
});
}
