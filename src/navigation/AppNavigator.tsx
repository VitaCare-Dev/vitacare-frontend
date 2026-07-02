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
    const onRegisterScreen = segments[0] === "(auth)" && segments[1] === "register";
    const onSelectDiseaseScreen = segments[0] === "(auth)" && segments[1] === "select-disease";

    if (auth.status === "unauthenticated" && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (auth.status === "authenticated") {
      if (!auth.hasProfile && !onRegisterScreen) {
        router.replace("/register");
      } else if (auth.hasProfile && !auth.hasDisease && !onSelectDiseaseScreen) {
        router.replace("/select-disease");
      } else if (auth.hasProfile && auth.hasDisease && inAuthGroup) {
        router.replace("/(tabs)/home");
      }
    }
  }, [auth, segments]);

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
      <Stack.Screen name="edit-address" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="glucose" />
      <Stack.Screen name="measurement-detail" />
      <Stack.Screen name="medical-info" />
      <Stack.Screen name="provider-detail" />
      <Stack.Screen name="treatment" />
      <Stack.Screen name="vital-signs" />
    </Stack>
  );
}
