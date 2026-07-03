import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppInput } from "@/components/AppInput";
import { VitaCareTheme } from "@/theme/theme";

type ReauthPasswordModalProps = Readonly<{
  visible: boolean;
  loading: boolean;
  errorMessage: string;
  onConfirm: (password: string) => void;
  onCancel: () => void;
}>;

/**
 * Firebase exige un login "reciente" para operaciones sensibles (ej. eliminar
 * la cuenta). En vez de forzar cerrar sesión y volver a entrar, se pide la
 * contraseña acá mismo y se reautentica sin salir de la pantalla.
 */
export function ReauthPasswordModal({
  visible,
  loading,
  errorMessage,
  onConfirm,
  onCancel,
}: ReauthPasswordModalProps) {
  const [password, setPassword] = useState("");

  function handleCancel() {
    setPassword("");
    onCancel();
  }

  function handleConfirm() {
    onConfirm(password);
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Confirma tu contraseña</Text>
          <Text style={styles.subtitle}>
            Por seguridad, ingresa tu contraseña actual para continuar con la eliminación de tu
            cuenta.
          </Text>

          <AppInput
            label="Contraseña"
            placeholder="••••••••"
            secureTextEntry
            icon="medicamento"
            value={password}
            onChangeText={setPassword}
          />

          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

          <AppButton
            title={loading ? "Verificando..." : "Confirmar y eliminar cuenta"}
            variant="danger"
            onPress={handleConfirm}
            disabled={loading || !password.trim()}
          />
          <Pressable onPress={handleCancel} disabled={loading} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    padding: VitaCareTheme.spacing.lg,
  },
  card: {
    backgroundColor: VitaCareTheme.colors.surface,
    borderRadius: VitaCareTheme.radius.lg,
    padding: VitaCareTheme.spacing.lg,
    gap: VitaCareTheme.spacing.md,
    ...VitaCareTheme.shadow.card,
  },
  title: {
    color: VitaCareTheme.colors.secondary,
    fontSize: VitaCareTheme.typography.subheading,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "800",
  },
  subtitle: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
  error: {
    color: "#B54444",
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "700",
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: VitaCareTheme.spacing.xs,
  },
  cancelText: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "600",
  },
});
