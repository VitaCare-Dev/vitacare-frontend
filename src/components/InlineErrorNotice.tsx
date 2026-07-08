import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";

type InlineErrorNoticeProps = Readonly<{
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
}>;

/**
 * Aviso de "no se pudo cargar" para usar dentro de una pantalla, en vez de un
 * texto rojo suelto: color ámbar (no transmite un error crítico/destructivo),
 * un ícono de contexto y, si se pasa `onRetry`, un botón para reintentar sin
 * depender solo del pull-to-refresh de toda la pantalla.
 */
export function InlineErrorNotice({ message, onRetry, retrying = false }: InlineErrorNoticeProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      {onRetry ? (
        <AppButton
          title={retrying ? "Reintentando..." : "Reintentar"}
          variant="outline"
          onPress={onRetry}
          disabled={retrying}
        />
      ) : null}
    </View>
  );
}

function createStyles(theme: VitaCareThemeType) {
  return StyleSheet.create({
    container: {
      backgroundColor: theme.colors.warning,
      borderRadius: theme.radius.md,
      borderWidth: 1,
      borderColor: theme.colors.warningStrong,
      padding: theme.spacing.md,
      gap: theme.spacing.sm,
    },
    row: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: theme.spacing.sm,
    },
    icon: {
      fontSize: theme.typography.subheading,
    },
    message: {
      flex: 1,
      color: theme.colors.text,
      fontSize: theme.typography.body,
      fontFamily: theme.typography.fontFamily,
      fontWeight: "600",
    },
  });
}
