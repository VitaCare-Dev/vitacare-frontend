import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { BrandHeader } from "@/components/BrandHeader";
import { ScreenContainer } from "@/components/ScreenContainer";
import { VitaCareTheme } from "@/theme/theme";

export default function LoginScreen() {
  const router = useRouter();

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
        />
        <AppInput
          label="Contraseña"
          placeholder="••••••••"
          secureTextEntry
          icon="medicamento"
        />

        <View style={styles.checkboxRow}>
          <View style={styles.checkbox} />
          <Text style={styles.checkboxLabel}>Recordarme</Text>
        </View>

        <AppButton
          title="Iniciar sesión"
          onPress={() => router.push("/home")}
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

const styles = StyleSheet.create({
  centered: {
    alignItems: "center",
    gap: VitaCareTheme.spacing.md,
    paddingTop: VitaCareTheme.spacing.xl,
  },
  tagline: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontStyle: "italic",
  },
  form: {
    marginTop: VitaCareTheme.spacing.xl,
    gap: VitaCareTheme.spacing.md,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: VitaCareTheme.spacing.sm,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderColor: VitaCareTheme.colors.primary,
    borderRadius: 4,
    backgroundColor: VitaCareTheme.colors.surface,
  },
  checkboxLabel: {
    color: VitaCareTheme.colors.text,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
  link: {
    textAlign: "right",
    color: VitaCareTheme.colors.primary,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "600",
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: VitaCareTheme.spacing.lg,
  },
  footerText: {
    color: VitaCareTheme.colors.text,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
  footerLink: {
    color: VitaCareTheme.colors.primary,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
});
