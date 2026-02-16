import React from "react";
import { Stack } from "expo-router";
import Colors from "@/constants/colors";

export default function HistoryLayout() {
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
      <Stack.Screen name="index" options={{ title: "Historique" }} />
      <Stack.Screen name="detail" options={{ title: "Document" }} />
    </Stack>
  );
}
