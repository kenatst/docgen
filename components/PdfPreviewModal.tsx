import React, { useMemo } from "react";
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
    Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import { X } from "lucide-react-native";
import Colors from "@/constants/colors";
import { GeneratedDocument } from "@/constants/types";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* ── Inline HTML builder (matches pdfExport.ts layout) ──── */

function esc(v: string): string {
    return v
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function buildPreviewHtml(doc: GeneratedDocument): string {
    const blocks = doc.content
        .split(/\n{2,}/)
        .map((b) => b.trim())
        .filter(Boolean);

    const bodyHtml = blocks
        .map((b) => `<p>${esc(b).replace(/\n/g, "<br/>")}</p>`)
        .join("\n");

    const signatureImg = doc.signatureDataUri
        ? `<div class="sig"><img src="${esc(doc.signatureDataUri)}" /></div>`
        : "";

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      font-family: "Times New Roman", Georgia, serif;
      font-size: 13px; line-height: 1.65;
      color: #1a1a1a; background: #fff;
      padding: 28px 24px 40px;
    }
    p { margin-bottom: 14px; text-align: justify; }
    .sig { margin-top: 18px; }
    .sig img { width: 140px; max-height: 60px; object-fit: contain; }
    .watermark {
      position: fixed; bottom: 12px; right: 16px;
      font-size: 9px; color: #bbb;
      font-family: sans-serif;
    }
  </style>
</head>
<body>
  ${bodyHtml}
  ${signatureImg}
  <div class="watermark">Aperçu — DocGen</div>
</body>
</html>`;
}

/* ── Component ────────────────────────────────────────────── */

interface Props {
    visible: boolean;
    onClose: () => void;
    document: GeneratedDocument | null;
}

export function PdfPreviewModal({ visible, onClose, document }: Props) {
    const insets = useSafeAreaInsets();
    const html = useMemo(
        () => (document ? buildPreviewHtml(document) : ""),
        [document]
    );

    if (!document) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.container, { paddingTop: insets.top }]}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Aperçu du document</Text>
                    <Pressable
                        onPress={onClose}
                        style={({ pressed }) => [
                            styles.closeButton,
                            pressed && { opacity: 0.7 },
                        ]}
                        hitSlop={12}
                    >
                        <X color={Colors.text} size={20} />
                    </Pressable>
                </View>

                {/* Preview */}
                {Platform.OS === "web" ? (
                    <View style={styles.webFallback}>
                        <Text style={styles.webFallbackText}>
                            L'aperçu n'est pas disponible sur le web.
                        </Text>
                    </View>
                ) : (
                    <WebView
                        originWhitelist={["*"]}
                        source={{ html }}
                        style={styles.webview}
                        scrollEnabled
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f9f6f3",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "rgba(200,180,150,0.3)",
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: "800",
        color: Colors.text,
    },
    closeButton: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: "rgba(230,200,170,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    webview: {
        flex: 1,
        backgroundColor: "#fff",
    },
    webFallback: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    webFallbackText: {
        color: Colors.textMuted,
        fontSize: 14,
    },
});
