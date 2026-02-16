import React from "react";
import { Stack } from "expo-router";
import Colors from "@/constants/colors";

export default function ProfileLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                headerStyle: { backgroundColor: Colors.background },
                headerTintColor: Colors.primary,
                headerShadowVisible: false,
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen
                name="settings"
                options={{
                    headerShown: true,
                    title: "Paramètres",
                    headerBackTitle: "Retour",
                }}
            />
        </Stack>
    );
}
