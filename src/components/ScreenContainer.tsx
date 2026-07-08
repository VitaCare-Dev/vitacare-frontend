import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";

type ScreenContainerProps = Readonly<{
  children: ReactNode;
  scrollable?: boolean;
  contentStyle?: object;
  style?: object;
  /** Si se entrega junto con onRefresh, habilita "tirar para actualizar" (solo aplica con scrollable). */
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Muestra una barra fija de "sin conexión" arriba de la pantalla (no bloquea el contenido, no requiere cerrarse). */
  offline?: boolean;
  onRetryOffline?: () => void;
}>;

/**
 * Barra fija de estado de conexión: una franja delgada, no un modal. Sigue el
 * mismo patrón que apps como Gmail/WhatsApp para "sin conexión" — informa sin
 * bloquear ni oscurecer el resto de la pantalla.
 */
function OfflineStatusBar({ onRetry }: Readonly<{ onRetry?: () => void }>) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.offlineBar}>
      <Text style={styles.offlineBarText}>Sin conexión a internet o con el servidor.</Text>
      {onRetry ? (
        <Pressable onPress={onRetry}>
          <Text style={styles.offlineBarRetry}>Reintentar</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ScreenContainer({
  children,
  scrollable = true,
  contentStyle,
  style,
  refreshing,
  onRefresh,
  offline = false,
  onRetryOffline,
}: Readonly<ScreenContainerProps>) {
  const theme = useTheme();
  const styles = createStyles(theme);
  if (!scrollable) {
    return (
      <SafeAreaView style={[styles.safeArea, style]}>
        {offline ? <OfflineStatusBar onRetry={onRetryOffline} /> : null}
        <View style={[styles.scrollContent, contentStyle]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      {offline ? <OfflineStatusBar onRetry={onRetryOffline} /> : null}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={Boolean(refreshing)}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
                colors={[theme.colors.primary]}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(theme: VitaCareThemeType) {
  return StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.lg,
  },
  offlineBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  offlineBarText: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
    textAlign: "center",
  },
  offlineBarRetry: {
    color: theme.colors.primary,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
    fontWeight: "700",
  },
});
}
