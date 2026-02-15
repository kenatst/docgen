import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Share,
} from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { Copy, Share2, CheckCircle } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useDocuments } from "@/context/DocumentContext";

export default function HistoryDetailScreen() {
  const { documentId } = useLocalSearchParams<{ documentId: string }>();
  const { history } = useDocuments();
  const [copied, setCopied] = React.useState(false);

  const document = history.find((d) => d.id === documentId);

  const handleCopy = useCallback(async () => {
    if (!document) return;
    try {
      if (Platform.OS === "web") {
        await navigator.clipboard.writeText(document.content);
      } else {
        const Clipboard = await import("expo-clipboard");
        await Clipboard.setStringAsync(document.content);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.log("Copy failed", e);
    }
  }, [document]);

  const handleShare = useCallback(async () => {
    if (!document) return;
    try {
      await Share.share({
        message: document.content,
        title: document.templateTitle,
      });
    } catch (e) {
      console.log("Share failed", e);
    }
  }, [document]);

  if (!document) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Document introuvable</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: document.templateTitle }} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>{document.categoryTitle}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaLabel}>{document.templateTitle}</Text>
        </View>

        <View style={styles.documentCard}>
          <Text style={styles.documentContent} selectable>
            {document.content}
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, copied && styles.actionButtonSuccess]}
            onPress={handleCopy}
            activeOpacity={0.7}
          >
            {copied ? (
              <CheckCircle color={Colors.white} size={18} />
            ) : (
              <Copy color={Colors.white} size={18} />
            )}
            <Text style={styles.actionText}>
              {copied ? "Copié !" : "Copier"}
            </Text>
          </TouchableOpacity>

          {Platform.OS !== "web" && (
            <TouchableOpacity
              style={styles.actionButtonOutline}
              onPress={handleShare}
              activeOpacity={0.7}
            >
              <Share2 color={Colors.primary} size={18} />
              <Text style={styles.actionTextOutline}>Partager</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 6,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: Colors.textMuted,
  },
  metaDot: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  documentCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 20,
  },
  documentContent: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  actionButtonSuccess: {
    backgroundColor: Colors.success,
  },
  actionText: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  actionButtonOutline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  actionTextOutline: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.primary,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: "center",
    marginTop: 40,
  },
});
