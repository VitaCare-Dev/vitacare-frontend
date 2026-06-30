import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { BrandHeader } from "@/components/BrandHeader";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { auth } from "@/config/firebase";
import { VitaCareTheme } from "@/theme/theme";

export default function RegisterScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [apellidoPaterno, setApellidoPaterno] = useState("");
  const [apellidoMaterno, setApellidoMaterno] = useState("");
  const [rut, setRut] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [telefono, setTelefono] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!email.trim() || !password || !nombre.trim()) {
      Alert.alert("Campos requeridos", "Correo, contraseña y nombre son obligatorios.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Contraseña inválida", "La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(user, {
        displayName: `${nombre.trim()} ${apellidoPaterno.trim()}`.trim(),
      });
      router.replace("/(tabs)/home");
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
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <AppInput
          label="Contraseña"
          placeholder="••••••••"
          secureTextEntry
          icon="medicamento"
          value={password}
          onChangeText={setPassword}
        />
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
        <AppInput
          label="Fecha de nacimiento"
          placeholder="15/05/1985"
          icon="nota"
          value={fechaNacimiento}
          onChangeText={setFechaNacimiento}
        />
        <AppInput
          label="Teléfono"
          placeholder="+56 9 8765 4321"
          icon="usuario"
          value={telefono}
          onChangeText={setTelefono}
          keyboardType="phone-pad"
        />

        <AppButton
          title={loading ? "Registrando..." : "Registrarse"}
          onPress={handleRegister}
          disabled={loading}
        />
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
