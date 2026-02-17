import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Colors from "@/constants/colors";
import { DocumentProvider } from "@/context/DocumentContext";
import { ProfileProvider } from "@/context/ProfileContext";
import { AddressBookProvider } from "@/context/AddressBookContext";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Retour",
        headerBackButtonDisplayMode: "minimal",
        headerStyle: { backgroundColor: Colors.background },
        headerTintColor: Colors.primary,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppErrorBoundary>
        <ProfileProvider>
          <DocumentProvider>
            <AddressBookProvider>
              <RootLayoutNav />
            </AddressBookProvider>
          </DocumentProvider>
        </ProfileProvider>
      </AppErrorBoundary>
    </GestureHandlerRootView>
  );
}
