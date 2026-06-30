import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

import { useAuth } from "@/context/AuthContext";

export function AppNavigator() {
  const auth = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (auth.status === "loading") return;

    const inAuthGroup = segments[0] === "(auth)";

    if (auth.status === "unauthenticated" && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (auth.status === "authenticated" && inAuthGroup) {
      router.replace("/(tabs)/home");
    }
  }, [auth.status, segments]);

  if (auth.status === "loading") return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#F8FAF8" },
      }}
    >
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="assistant" />
      <Stack.Screen name="alerts-recommendations" />
      <Stack.Screen name="add-medication" />
      <Stack.Screen name="cholesterol" />
      <Stack.Screen name="glucose" />
      <Stack.Screen name="intake-history" />
      <Stack.Screen name="medical-info" />
      <Stack.Screen name="provider-detail" />
      <Stack.Screen name="treatment" />
      <Stack.Screen name="vital-signs" />
    </Stack>
  );
}
