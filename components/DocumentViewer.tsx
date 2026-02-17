import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { CheckCircle, Copy, Download, Mail, Share2 } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";
import { GeneratedDocument } from "@/constants/types";
import { exportDocumentPdf } from "@/utils/pdfExport";
import { SignaturePreview } from "@/components/SignaturePreview";

interface DocumentViewerProps {
  document: GeneratedDocument;
  showSuccessBanner?: boolean;
  showRestartButton?: boolean;
  onRestartPress?: () => void;
}

function formatDate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DocumentViewer({
  document,
  showSuccessBanner = false,
  showRestartButton = false,
  onRestartPress,
}: DocumentViewerProps) {
  const insets = useSafeAreaInsets();
  const [copied, setCopied] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 420,
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

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      if (Platform.OS === "web") {
        await navigator.clipboard.writeText(document.content);
      } else {
        const Clipboard = await import("expo-clipboard");
        await Clipboard.setStringAsync(document.content);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCopied(true);
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
      copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2200);
    } catch (error) {
      console.error("Copy failed", error);
      Alert.alert("Copie impossible", "Le contenu n'a pas pu etre copie.");
    }
  }, [document.content]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        title: document.templateTitle,
        message: document.content,
      });
    } catch (error) {
      console.error("Share failed", error);
      Alert.alert("Partage impossible", "Le document n'a pas pu etre partage.");
    }
  }, [document.content, document.templateTitle]);

  const handleExportPdf = useCallback(async () => {
    setExportingPdf(true);
    try {
      await exportDocumentPdf(document);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("PDF export failed", error);
      Alert.alert("Export PDF impossible", "Le document n'a pas pu etre exporte en PDF.");
    } finally {
      setExportingPdf(false);
    }
  }, [document]);

  const handleEmail = useCallback(async () => {
    setExportingPdf(true);
    try {
      const result = await exportDocumentPdf(document);
      if (!result.uri) {
        Alert.alert("Erreur", "Impossible de générer le PDF pour l'email.");
        return;
      }
      const MailComposer = await import("expo-mail-composer");
      const available = await MailComposer.isAvailableAsync();
      if (!available) {
        Alert.alert("Email indisponible", "Aucune application mail n'est configurée sur cet appareil.");
        return;
      }
      await MailComposer.composeAsync({
        subject: document.templateTitle,
        body: "Veuillez trouver ci-joint le document généré via DocGen.",
        attachments: [result.uri],
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Email send failed", error);
      Alert.alert("Erreur", "L'envoi par email a échoué.");
    } finally {
      setExportingPdf(false);
    }
  }, [document]);

  return (
    <LinearGradient
      colors={["#FFF7F4", "#F4F8FF", "#F5FFF8"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.backdrop} pointerEvents="none">
        <View style={[styles.orb, styles.orbOne]} />
        <View style={[styles.orb, styles.orbTwo]} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {showSuccessBanner ? (
          <BlurView intensity={30} tint="light" style={styles.successBanner}>
            <CheckCircle color={Colors.success} size={20} />
            <Text style={styles.successText}>Document genere avec succes</Text>
          </BlurView>
        ) : null}

        <BlurView intensity={24} tint="light" style={styles.metaCard}>
          <View style={styles.metaChip}>
            <Text style={styles.metaText}>{document.categoryTitle}</Text>
          </View>
          <View style={styles.metaChip}>
            <Text style={styles.metaText}>{document.templateTitle}</Text>
          </View>
          <View style={styles.metaChip}>
            <Text style={styles.metaText}>{formatDate(document.createdAt)}</Text>
          </View>
        </BlurView>

        <Animated.View
          style={[styles.documentCard, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}
        >
          <BlurView intensity={34} tint="light" style={styles.blurCard}>
            <LinearGradient
              colors={["rgba(255,255,255,0.34)", "rgba(255,255,255,0.08)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardTint}
            />
            <Text style={styles.content} selectable>
              {document.content}
            </Text>
            {document.signatureDataUri ? (
              <View style={styles.signatureBlock}>
                <Text style={styles.signatureLabel}>Signature</Text>
                <SignaturePreview
                  uri={document.signatureDataUri}
                  width={180}
                  height={80}
                  style={styles.signatureImage}
                />
              </View>
            ) : null}
          </BlurView>
        </Animated.View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionButtonPrimary, copied && styles.actionButtonSuccess]}
            onPress={handleCopy}
            activeOpacity={0.84}
            accessibilityRole="button"
            accessibilityLabel="Copier le document"
            accessibilityHint="Copie le texte du document dans le presse-papiers"
            testID="copy-button"
          >
            {copied ? <CheckCircle color={Colors.white} size={18} /> : <Copy color={Colors.white} size={18} />}
            <Text style={styles.actionTextPrimary}>{copied ? "Copie" : "Copier"}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButtonSecondary, exportingPdf && styles.actionButtonDisabled]}
            onPress={handleExportPdf}
            activeOpacity={0.84}
            disabled={exportingPdf}
            accessibilityRole="button"
            accessibilityLabel="Exporter en PDF"
            accessibilityHint="Genere et partage un fichier PDF du document"
            testID="pdf-button"
          >
            <Download color={Colors.primary} size={18} />
            <Text style={styles.actionTextSecondary}>{exportingPdf ? "Export..." : "PDF"}</Text>
          </TouchableOpacity>

          {Platform.OS !== "web" ? (
            <TouchableOpacity
              style={styles.actionButtonSecondary}
              onPress={handleShare}
              activeOpacity={0.84}
              accessibilityRole="button"
              accessibilityLabel="Partager le document"
              testID="share-button"
            >
              <Share2 color={Colors.primary} size={18} />
              <Text style={styles.actionTextSecondary}>Partager</Text>
            </TouchableOpacity>
          ) : null}

          {Platform.OS !== "web" ? (
            <TouchableOpacity
              style={[styles.actionButtonSecondary, exportingPdf && styles.actionButtonDisabled]}
              onPress={handleEmail}
              activeOpacity={0.84}
              disabled={exportingPdf}
              accessibilityRole="button"
              accessibilityLabel="Envoyer par email"
              testID="email-button"
            >
              <Mail color={Colors.primary} size={18} />
              <Text style={styles.actionTextSecondary}>Email</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {showRestartButton ? (
          <TouchableOpacity
            style={styles.restartButton}
            onPress={onRestartPress}
            activeOpacity={0.84}
            accessibilityRole="button"
            accessibilityLabel="Creer un autre document"
            accessibilityHint="Retourne au flux de creation de document"
          >
            <Text style={styles.restartText}>Creer un autre document</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  orb: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.26)",
  },
  orbOne: {
    width: 180,
    height: 180,
    top: -40,
    right: -30,
  },
  orbTwo: {
    width: 160,
    height: 160,
    bottom: 90,
    left: -50,
    backgroundColor: "rgba(198,228,255,0.24)",
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  successBanner: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.76)",
    backgroundColor: "rgba(232, 247, 239, 0.65)",
    overflow: "hidden",
  },
  successText: {
    color: Colors.success,
    fontWeight: "700",
    fontSize: 14,
  },
  metaCard: {
    borderRadius: 14,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.76)",
    backgroundColor: "rgba(255,255,255,0.36)",
    overflow: "hidden",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  metaChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(116,169,255,0.3)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "rgba(255,255,255,0.82)",
  },
  metaText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
  },
  documentCard: {
    borderRadius: 18,
    overflow: "hidden",
  },
  blurCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.78)",
    backgroundColor: "rgba(255,255,255,0.32)",
    overflow: "hidden",
    padding: 18,
  },
  cardTint: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    color: Colors.text,
    fontSize: 15,
    lineHeight: 23,
  },
  signatureBlock: {
    marginTop: 20,
    alignItems: "flex-end",
  },
  signatureLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 6,
  },
  signatureImage: {
    width: 180,
    height: 80,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionButtonPrimary: {
    flex: 1,
    minHeight: 46,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    backgroundColor: Colors.primary,
  },
  actionButtonSuccess: {
    backgroundColor: Colors.success,
  },
  actionTextPrimary: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 14,
  },
  actionButtonSecondary: {
    flex: 1,
    minHeight: 46,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.74)",
    borderWidth: 1,
    borderColor: "rgba(116, 169, 255, 0.45)",
  },
  actionButtonDisabled: {
    opacity: 0.65,
  },
  actionTextSecondary: {
    color: Colors.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  restartButton: {
    marginTop: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
  },
  restartText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
});
