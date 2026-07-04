import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { BrandHeader } from "@/components/BrandHeader";
import { PasswordVisibilityToggle } from "@/components/PasswordVisibilityToggle";
import { ScreenContainer } from "@/components/ScreenContainer";
import { auth } from "@/config/firebase";
import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";

export default function LoginScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert("Campos requeridos", "Por favor ingresa tu correo y contraseña.");
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
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
          rightElement={
            <PasswordVisibilityToggle
              visible={showPassword}
              onToggle={() => setShowPassword((prev) => !prev)}
            />
          }
        />

        <AppButton
          title={loading ? "Ingresando..." : "Iniciar sesión"}
          onPress={handleLogin}
          disabled={loading}
        />

        <Pressable onPress={() => router.push("/register")}>
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
