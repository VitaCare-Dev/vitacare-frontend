import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { VitaCareTheme } from "@/theme/theme";

type ScreenContainerProps = Readonly<{
  children: ReactNode;
  scrollable?: boolean;
  contentStyle?: object;
  style?: object;
}>;

export function ScreenContainer({
  children,
  scrollable = true,
  contentStyle,
  style,
}: Readonly<ScreenContainerProps>) {
  if (!scrollable) {
    return (
      <SafeAreaView style={[styles.safeArea, style]}>
        <View style={[styles.scrollContent, contentStyle]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: VitaCareTheme.colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: VitaCareTheme.spacing.lg,
    paddingTop: VitaCareTheme.spacing.lg,
    paddingBottom: VitaCareTheme.spacing.xxl,
    gap: VitaCareTheme.spacing.lg,
  },
});
