import { QueryClientProvider } from "@tanstack/react-query";
import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { queryClient } from "@/config/queryClient";
import { AuthProvider } from "@/context/AuthContext";
import { AppNavigator } from "@/navigation/AppNavigator";
import { AppThemeProvider, useThemeMode } from "@/theme/ThemeContext";

function NavigationThemeBridge({ children }: Readonly<{ children: React.ReactNode }>) {
  const { mode } = useThemeMode();
  return (
    <ThemeProvider value={mode === "dark" ? DarkTheme : DefaultTheme}>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      {children}
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppThemeProvider>
        <NavigationThemeBridge>
          <AuthProvider>
            <ErrorBoundary>
              <AppNavigator />
            </ErrorBoundary>
          </AuthProvider>
        </NavigationThemeBridge>
      </AppThemeProvider>
    </QueryClientProvider>
  );
}
