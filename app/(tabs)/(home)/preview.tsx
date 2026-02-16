import React, { useCallback } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import Colors from "@/constants/colors";
import { useDocuments } from "@/context/DocumentContext";
import { DocumentViewer } from "@/components/DocumentViewer";

export default function PreviewScreen() {
  const { documentId } = useLocalSearchParams<{ documentId: string }>();
  const router = useRouter();
  const { history } = useDocuments();

  const document = history.find((item) => item.id === documentId);

  const handleBackToHome = useCallback(() => {
    router.dismissAll();
  }, [router]);

  if (!document) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Document introuvable</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "Votre document",
          headerLeft: () => (
            <TouchableOpacity onPress={handleBackToHome} style={styles.headerBtn}>
              <ArrowLeft color={Colors.primary} size={20} />
            </TouchableOpacity>
          ),
        }}
      />
      <DocumentViewer
        document={document}
        showSuccessBanner
        showRestartButton
        onRestartPress={handleBackToHome}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBtn: {
    padding: 4,
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
  errorText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: "700",
  },
});
