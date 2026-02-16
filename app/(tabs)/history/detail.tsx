import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import Colors from "@/constants/colors";
import { useDocuments } from "@/context/DocumentContext";
import { DocumentViewer } from "@/components/DocumentViewer";

export default function HistoryDetailScreen() {
  const { documentId } = useLocalSearchParams<{ documentId: string }>();
  const { history } = useDocuments();

  const document = history.find((item) => item.id === documentId);

  if (!document) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Document introuvable</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: document.templateTitle }} />
      <DocumentViewer document={document} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
