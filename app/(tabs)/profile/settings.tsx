import React, { useCallback, useState } from "react";
import {
    Alert,
    Linking,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
    ChevronRight,
    ExternalLink,
    FileText,
    HelpCircle,
    Info,
    Mail,
    Shield,
    ShieldCheck,
    Trash2,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Colors from "@/constants/colors";

const APP_VERSION = "1.0.0";
const DEVELOPER_NAME = "DocGen";
const SUPPORT_EMAIL = "support@docgen.app";

// ── Section Renderers ─────────────────────────────────────

interface SettingsRowProps {
    icon: React.ReactNode;
    label: string;
    onPress?: () => void;
    trailing?: React.ReactNode;
    destructive?: boolean;
}

function SettingsRow({ icon, label, onPress, trailing, destructive }: SettingsRowProps) {
    return (
        <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={label}
        >
            <View style={styles.rowLeading}>
                {icon}
                <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>{label}</Text>
            </View>
            {trailing ?? <ChevronRight color={Colors.textMuted} size={16} />}
        </Pressable>
    );
}

// ── Privacy Policy Content ────────────────────────────────

function PrivacySection({ visible }: { visible: boolean }) {
    if (!visible) return null;
    return (
        <View style={styles.disclosureContent}>
            <Text style={styles.legalTitle}>Politique de Confidentialité</Text>
            <Text style={styles.legalDate}>Dernière mise à jour : 16 février 2026</Text>

            <Text style={styles.legalHeading}>1. Données Collectées</Text>
            <Text style={styles.legalText}>
                Assistant Rédaction Document ne collecte aucune donnée personnelle en dehors de celles que
                vous saisissez volontairement dans l'application (nom, adresse, email, téléphone, ville et
                signature). Ces données sont stockées exclusivement sur votre appareil de manière chiffrée
                et ne sont jamais transmises à des serveurs externes.
            </Text>

            <Text style={styles.legalHeading}>2. Stockage et Sécurité</Text>
            <Text style={styles.legalText}>
                Toutes les données sont chiffrées localement à l'aide de mécanismes de chiffrement
                standards. Aucune donnée n'est envoyée à un serveur distant. Vos documents générés restent
                exclusivement sur votre appareil.
            </Text>

            <Text style={styles.legalHeading}>3. Partage de Données</Text>
            <Text style={styles.legalText}>
                Nous ne vendons, ne partageons et ne transférons aucune donnée personnelle à des tiers.
                L'application fonctionne intégralement hors ligne.
            </Text>

            <Text style={styles.legalHeading}>4. Services Tiers</Text>
            <Text style={styles.legalText}>
                L'application n'intègre aucun SDK de tracking, d'analyse ou de publicité. Aucun cookie n'est
                utilisé.
            </Text>

            <Text style={styles.legalHeading}>5. Droits de l'Utilisateur</Text>
            <Text style={styles.legalText}>
                Vous pouvez supprimer toutes vos données à tout moment depuis les paramètres de
                l'application. Comme les données ne quittent jamais votre appareil, la suppression est
                immédiate et définitive.
            </Text>

            <Text style={styles.legalHeading}>6. Contact</Text>
            <Text style={styles.legalText}>
                Pour toute question relative à cette politique de confidentialité, contactez-nous à{" "}
                {SUPPORT_EMAIL}.
            </Text>
        </View>
    );
}

// ── Terms of Service Content ──────────────────────────────

function TermsSection({ visible }: { visible: boolean }) {
    if (!visible) return null;
    return (
        <View style={styles.disclosureContent}>
            <Text style={styles.legalTitle}>Conditions Générales d'Utilisation</Text>
            <Text style={styles.legalDate}>Dernière mise à jour : 16 février 2026</Text>

            <Text style={styles.legalHeading}>1. Acceptation des Conditions</Text>
            <Text style={styles.legalText}>
                En téléchargeant et en utilisant Assistant Rédaction Document, vous acceptez les présentes
                conditions. Si vous n'êtes pas d'accord, veuillez ne pas utiliser l'application.
            </Text>

            <Text style={styles.legalHeading}>2. Description du Service</Text>
            <Text style={styles.legalText}>
                L'application est un outil d'aide à la rédaction de documents administratifs. Elle génère
                des modèles de lettres et documents à partir de vos informations. Les documents générés sont
                des modèles indicatifs et ne constituent pas des conseils juridiques.
            </Text>

            <Text style={styles.legalHeading}>3. Responsabilité</Text>
            <Text style={styles.legalText}>
                L'utilisateur est seul responsable de l'utilisation des documents générés. {DEVELOPER_NAME}{" "}
                ne saurait être tenu responsable des conséquences liées à l'utilisation de ces documents.
            </Text>

            <Text style={styles.legalHeading}>4. Propriété Intellectuelle</Text>
            <Text style={styles.legalText}>
                Le contenu de l'application, y compris les modèles de documents, l'interface utilisateur et
                le code source, est protégé par les lois relatives à la propriété intellectuelle.
            </Text>

            <Text style={styles.legalHeading}>5. Limitation de Garantie</Text>
            <Text style={styles.legalText}>
                L'application est fournie « en l'état ». {DEVELOPER_NAME} ne garantit pas l'exactitude,
                l'exhaustivité ou la pertinence juridique des documents générés.
            </Text>

            <Text style={styles.legalHeading}>6. Modifications</Text>
            <Text style={styles.legalText}>
                Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications
                entrent en vigueur dès leur publication dans l'application.
            </Text>
        </View>
    );
}

// ── Main Component ────────────────────────────────────────

export default function SettingsScreen() {
    const insets = useSafeAreaInsets();
    const [privacyOpen, setPrivacyOpen] = useState(false);
    const [termsOpen, setTermsOpen] = useState(false);

    const handleClearData = useCallback(() => {
        Alert.alert(
            "Effacer toutes les données",
            "Cette action supprimera définitivement votre profil, votre signature et l'historique de vos documents. Cette opération est irréversible.",
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Effacer",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await AsyncStorage.clear();
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            Alert.alert("Données effacées", "Toutes vos données ont été supprimées.");
                        } catch (error) {
                            console.error("Clear data failed", error);
                            Alert.alert("Erreur", "Impossible de supprimer les données.");
                        }
                    },
                },
            ]
        );
    }, []);

    const handleContactSupport = useCallback(() => {
        Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Support%20DocGen`).catch(() =>
            Alert.alert("Erreur", "Impossible d'ouvrir le client mail.")
        );
    }, []);

    return (
        <LinearGradient
            colors={["#FFF8F4", "#F2F9FF", "#F8FFF5"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 30 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Legal & Compliance ── */}
                <BlurView intensity={24} tint="light" style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Shield color={Colors.primary} size={16} />
                        <Text style={styles.sectionTitle}>Juridique & Conformité</Text>
                    </View>

                    <SettingsRow
                        icon={<ShieldCheck color={Colors.primary} size={18} />}
                        label="Politique de Confidentialité"
                        onPress={() => setPrivacyOpen((v) => !v)}
                        trailing={
                            <ChevronRight
                                color={Colors.textMuted}
                                size={16}
                                style={{ transform: [{ rotate: privacyOpen ? "90deg" : "0deg" }] }}
                            />
                        }
                    />
                    <PrivacySection visible={privacyOpen} />

                    <View style={styles.separator} />

                    <SettingsRow
                        icon={<FileText color={Colors.primary} size={18} />}
                        label="Conditions Générales d'Utilisation"
                        onPress={() => setTermsOpen((v) => !v)}
                        trailing={
                            <ChevronRight
                                color={Colors.textMuted}
                                size={16}
                                style={{ transform: [{ rotate: termsOpen ? "90deg" : "0deg" }] }}
                            />
                        }
                    />
                    <TermsSection visible={termsOpen} />
                </BlurView>

                {/* ── Data & Storage ── */}
                <BlurView intensity={24} tint="light" style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Info color={Colors.primary} size={16} />
                        <Text style={styles.sectionTitle}>Données & Stockage</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Stockage</Text>
                        <Text style={styles.infoValue}>Local uniquement (chiffré)</Text>
                    </View>

                    <View style={styles.separator} />

                    <SettingsRow
                        icon={<Trash2 color={Colors.error} size={18} />}
                        label="Effacer toutes les données"
                        onPress={handleClearData}
                        destructive
                        trailing={null}
                    />
                </BlurView>

                {/* ── Support ── */}
                <BlurView intensity={24} tint="light" style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <HelpCircle color={Colors.primary} size={16} />
                        <Text style={styles.sectionTitle}>Aide & Support</Text>
                    </View>

                    <SettingsRow
                        icon={<Mail color={Colors.primary} size={18} />}
                        label="Contacter le support"
                        onPress={handleContactSupport}
                        trailing={<ExternalLink color={Colors.textMuted} size={16} />}
                    />
                </BlurView>

                {/* ── About ── */}
                <BlurView intensity={24} tint="light" style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Info color={Colors.primary} size={16} />
                        <Text style={styles.sectionTitle}>À propos</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Application</Text>
                        <Text style={styles.infoValue}>Assistant Rédaction Document</Text>
                    </View>
                    <View style={styles.separator} />
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Version</Text>
                        <Text style={styles.infoValue}>{APP_VERSION}</Text>
                    </View>
                    <View style={styles.separator} />
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Développeur</Text>
                        <Text style={styles.infoValue}>{DEVELOPER_NAME}</Text>
                    </View>
                    <View style={styles.separator} />
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Plateforme</Text>
                        <Text style={styles.infoValue}>{Platform.OS === "ios" ? "iOS" : "Android"}</Text>
                    </View>
                </BlurView>

                <Text style={styles.footer}>
                    © 2026 {DEVELOPER_NAME}. Tous droits réservés.
                </Text>
            </ScrollView>
        </LinearGradient>
    );
}

// ── Styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        gap: 12,
    },
    sectionCard: {
        borderRadius: 18,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.76)",
        backgroundColor: "rgba(255,255,255,0.3)",
        overflow: "hidden",
        padding: 14,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
        marginBottom: 10,
    },
    sectionTitle: {
        color: Colors.text,
        fontSize: 13,
        fontWeight: "800",
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        paddingHorizontal: 4,
        borderRadius: 10,
    },
    rowPressed: {
        backgroundColor: "rgba(116,169,255,0.08)",
    },
    rowLeading: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        flex: 1,
    },
    rowLabel: {
        color: Colors.text,
        fontSize: 14,
        fontWeight: "600",
        flex: 1,
    },
    rowLabelDestructive: {
        color: Colors.error,
    },
    separator: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: "rgba(147,174,215,0.24)",
        marginVertical: 2,
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 4,
    },
    infoLabel: {
        color: Colors.textSecondary,
        fontSize: 13,
        fontWeight: "600",
    },
    infoValue: {
        color: Colors.text,
        fontSize: 13,
        fontWeight: "700",
        textAlign: "right",
        maxWidth: "55%",
    },
    disclosureContent: {
        paddingVertical: 10,
        paddingHorizontal: 6,
        backgroundColor: "rgba(255,255,255,0.5)",
        borderRadius: 12,
        marginVertical: 6,
    },
    legalTitle: {
        color: Colors.text,
        fontSize: 15,
        fontWeight: "800",
        marginBottom: 4,
    },
    legalDate: {
        color: Colors.textMuted,
        fontSize: 11,
        fontWeight: "600",
        marginBottom: 12,
    },
    legalHeading: {
        color: Colors.text,
        fontSize: 13,
        fontWeight: "700",
        marginTop: 10,
        marginBottom: 4,
    },
    legalText: {
        color: Colors.textSecondary,
        fontSize: 12.5,
        lineHeight: 18,
    },
    footer: {
        textAlign: "center",
        color: Colors.textMuted,
        fontSize: 11,
        fontWeight: "600",
        marginTop: 8,
        paddingBottom: 8,
    },
});
