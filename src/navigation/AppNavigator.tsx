import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/theme/ThemeContext";

export function AppNavigator() {
  const authState = useAuth();
  // Cast a string[]: el tipo tupla exacto que infiere expo-router depende de
  // .expo/types/router.d.ts (generado localmente por `expo start`/`prebuild`),
  // que no existe en un checkout limpio de CI y rompe el acceso a segments[1].
  const segments = useSegments() as string[];
  const router = useRouter();
  const theme = useTheme();

  useEffect(() => {
    // "checking": Firebase ya autenticó, pero aún no sabemos si el usuario
    // tiene paciente/enfermedad registrados. No se debe navegar con esa
    // incertidumbre (por eso se trata igual que "loading"): decidir sin
    // esperar la verificación real es lo que causaba ir a Home de forma
    // optimista y luego rebotar de vuelta a /register a mitad del registro.
    if (authState.status === "loading" || authState.status === "checking") return;

    const inAuthGroup = segments[0] === "(auth)";
    const onRegisterScreen = segments[0] === "(auth)" && segments[1] === "register";
    const onSelectDiseaseScreen = segments[0] === "(auth)" && segments[1] === "select-disease";

    if (authState.status === "unauthenticated" && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (authState.status === "authenticated") {
      if (!authState.hasProfile && !onRegisterScreen) {
        // Autenticado sin paciente registrado: pasa con Google (Firebase crea
        // la cuenta al vuelo en el primer inicio de sesión) o si el usuario
        // cerró la app a mitad del registro y volvió a entrar después. En
        // ambos casos el camino es el mismo: completar el registro —
        // RegisterScreen ya maneja el caso "usuario ya autenticado" (salta el
        // paso de credenciales y parte en el paso 2). Antes acá se cerraba la
        // sesión de las cuentas que no estaban en su primer inicio de sesión
        // (heurística creationTime === lastSignInTime), pero eso las dejaba
        // bloqueadas para siempre: cada nuevo intento ya no era "primer
        // inicio" y volvía a cerrar la sesión, sin ninguna vía posible para
        // terminar de registrarse.
        router.replace("/register");
      } else if (authState.hasProfile && !authState.hasDisease && !onSelectDiseaseScreen) {
        router.replace("/select-disease");
      } else if (authState.hasProfile && authState.hasDisease && inAuthGroup) {
        router.replace("/(tabs)/home");
      }
    }
  }, [authState, segments]);

  // Importante: NO se agrega "checking" acá. Antes de este fix, entrar en
  // "checking" (justo al crear la cuenta de Firebase, a mitad del registro)
  // desmontaba todo el Stack (incluida RegisterScreen) y lo volvía a montar
  // al resolver — eso rompía el flujo de registro en curso (con suerte de
  // timing, hasta se disparaba el cierre de sesión pensado para el caso
  // borde de un usuario huérfano, matando el token a mitad del registro).
  // Evitar navegar durante "checking" ya lo hace el efecto de arriba; no
  // hace falta (ni conviene) dejar de renderizar el árbol completo.
  if (authState.status === "loading") return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="assistant" />
      <Stack.Screen name="alerts-recommendations" />
      <Stack.Screen name="add-disease" />
      <Stack.Screen name="add-medication" />
      <Stack.Screen name="change-password" />
      <Stack.Screen name="cholesterol" />
      <Stack.Screen name="edit-address" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="glucose" />
      <Stack.Screen name="measurement-detail" />
      <Stack.Screen name="measurement-trend" />
      <Stack.Screen name="medical-info" />
      <Stack.Screen name="provider-detail" />
      <Stack.Screen name="treatment" />
      <Stack.Screen name="vital-signs" />
    </Stack>
  );
}
