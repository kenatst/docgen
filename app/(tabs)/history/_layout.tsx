import { Stack } from "expo-router";
import React from "react";
import Colors from "@/constants/colors";

export default function HistoryLayout() {
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
      <Stack.Screen name="index" options={{ title: "Historique" }} />
      <Stack.Screen name="detail" options={{ title: "Document" }} />
    </Stack>
  );
}
