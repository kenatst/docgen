import React from "react";
import { Stack } from "expo-router";
import Colors from "@/constants/colors";

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "rgba(255,255,255,0.88)" },
        headerTintColor: Colors.primary,
        headerTitleStyle: { fontWeight: "700", color: Colors.text },
        headerBackTitle: "Retour",
        headerBackButtonDisplayMode: "minimal",
        headerShadowVisible: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="category" options={{ title: "Categorie" }} />
      <Stack.Screen name="form" options={{ title: "Redaction" }} />
      <Stack.Screen name="preview" options={{ title: "Apercu" }} />
    </Stack>
  );
}
