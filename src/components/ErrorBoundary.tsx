import { Component, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";

type ErrorBoundaryProps = Readonly<{ children: ReactNode }>;
type ErrorBoundaryState = { hasError: boolean };

/**
 * Atrapa errores de renderizado en cualquier parte del árbol de componentes
 * debajo de él, mostrando una UI de "algo salió mal" en vez de dejar que la
 * app entera se caiga en pantalla en blanco. Solo atrapa errores de render;
 * los errores async (llamadas a la API) ya se manejan aparte con try/catch
 * en cada pantalla, como siempre.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error("Error no controlado en el árbol de componentes:", error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={this.handleRetry} />;
    }
    return this.props.children;
  }
}

function ErrorFallback({ onRetry }: Readonly<{ onRetry: () => void }>) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Algo salió mal</Text>
      <Text style={styles.message}>
        Ocurrió un error inesperado. Intenta de nuevo; si el problema persiste, cierra y vuelve a
        abrir la app.
      </Text>
      <AppButton title="Reintentar" onPress={onRetry} />
    </View>
  );
}

function createStyles(theme: VitaCareThemeType) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: theme.spacing.xl,
      gap: theme.spacing.md,
      backgroundColor: theme.colors.background,
    },
    title: {
      color: theme.colors.secondary,
      fontSize: theme.typography.heading,
      fontFamily: theme.typography.fontFamily,
      fontWeight: "800",
    },
    message: {
      color: theme.colors.textMuted,
      fontSize: theme.typography.body,
      fontFamily: theme.typography.fontFamily,
      textAlign: "center",
    },
  });
}
