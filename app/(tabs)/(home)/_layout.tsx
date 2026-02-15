import { Stack } from "expo-router";
import React from "react";
import Colors from "@/constants/colors";

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.primary,
        headerTitleStyle: { fontWeight: "600" as const, color: Colors.text },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="category" options={{ title: "Catégorie" }} />
      <Stack.Screen name="form" options={{ title: "Remplir le document" }} />
      <Stack.Screen name="preview" options={{ title: "Votre document" }} />
    </Stack>
  );
}
