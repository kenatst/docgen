import React, { useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  Share,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Copy, Share2, CheckCircle, ArrowLeft } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useDocuments } from "@/context/DocumentContext";

export default function PreviewScreen() {
  const { documentId } = useLocalSearchParams<{ documentId: string }>();
  const router = useRouter();
  const { history } = useDocuments();
  const [copied, setCopied] = React.useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  const document = history.find((d) => d.id === documentId);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

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

  const handleNewDocument = useCallback(() => {
    router.dismissAll();
  }, [router]);

  if (!document) {
    return (
      <View style={styles.container}>
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
            <TouchableOpacity onPress={handleNewDocument} style={styles.headerBtn}>
              <ArrowLeft color={Colors.primary} size={20} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.successBanner}>
          <CheckCircle color={Colors.success} size={20} />
          <Text style={styles.successText}>Document généré avec succès</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>{document.categoryTitle}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaLabel}>{document.templateTitle}</Text>
        </View>

        <Animated.View
          style={[
            styles.documentCard,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Text style={styles.documentContent} selectable>
            {document.content}
          </Text>
        </Animated.View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, copied && styles.actionButtonSuccess]}
            onPress={handleCopy}
            activeOpacity={0.7}
            testID="copy-button"
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
              testID="share-button"
            >
              <Share2 color={Colors.primary} size={18} />
              <Text style={styles.actionTextOutline}>Partager</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.newDocButton}
          onPress={handleNewDocument}
          activeOpacity={0.7}
        >
          <Text style={styles.newDocText}>Créer un autre document</Text>
        </TouchableOpacity>
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
  headerBtn: {
    padding: 4,
  },
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.successLight,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 16,
  },
  successText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: Colors.success,
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
    marginBottom: 20,
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
  newDocButton: {
    alignItems: "center",
    paddingVertical: 14,
  },
  newDocText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.accent,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: "center",
    marginTop: 40,
  },
});
