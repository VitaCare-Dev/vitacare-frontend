import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { BrandHeader } from "@/components/BrandHeader";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { VitaCareTheme } from "@/theme/theme";

export default function RegisterScreen() {
  const router = useRouter();

  return (
    <ScreenContainer scrollable>
      <ScreenHeader showBackButton title="Registrarse" />
      <BrandHeader logoStyle="horizontal" />
      <View style={styles.header}>
        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.subtitle}>
          Completa tus datos para comenzar a usar VitaCare.
        </Text>
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
        <AppInput
          label="RUT"
          placeholder="12.345.678-9"
          icon="md-del-usuario"
        />
        <AppInput label="Nombre" placeholder="María Carolina" icon="usuario" />
        <AppInput label="Apellido paterno" placeholder="Pérez" icon="usuario" />
        <AppInput label="Apellido materno" placeholder="Gómez" icon="usuario" />
        <AppInput
          label="Fecha de nacimiento"
          placeholder="15/05/1985"
          icon="nota"
        />
        <AppInput
          label="Teléfono"
          placeholder="+56 9 8765 4321"
          icon="usuario"
          keyboardType="phone-pad"
        />

        <AppButton title="Registrarse" onPress={() => router.push("/home")} />
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
