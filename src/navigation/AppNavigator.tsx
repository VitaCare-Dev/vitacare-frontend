import { Stack } from "expo-router";

export function AppNavigator() {
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
