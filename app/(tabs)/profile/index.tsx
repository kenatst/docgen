import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import {
  CheckCircle2,
  Eraser,
  ImagePlus,
  PenLine,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCircle2,
} from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import Svg, { Path } from "react-native-svg";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import { useProfile } from "@/context/ProfileContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SignaturePreview } from "@/components/SignaturePreview";
import { UserProfile } from "@/constants/types";
import { smoothRawPath } from "@/utils/signatureSmoothing";

/** Extract SVG path `d` attributes from a data:image/svg+xml URI */
function extractPathsFromSvgUri(uri: string | undefined): string[] {
  if (!uri) return [];
  const prefix = "data:image/svg+xml;utf8,";
  if (!uri.startsWith(prefix)) return [];
  try {
    const svg = decodeURIComponent(uri.slice(prefix.length));
    const regex = /d="([^"]+)"/g;
    const paths: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = regex.exec(svg)) !== null) {
      paths.push(match[1]);
    }
    return paths;
  } catch {
    return [];
  }
}

function profilesMatch(a: UserProfile, b: UserProfile): boolean {
  return (
    a.expediteur_nom === b.expediteur_nom &&
    a.expediteur_adresse === b.expediteur_adresse &&
    a.expediteur_email === b.expediteur_email &&
    a.expediteur_tel === b.expediteur_tel &&
    a.lieu === b.lieu &&
    (a.signatureDataUri ?? "") === (b.signatureDataUri ?? "")
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile, saveProfile, isLoading, profiles, activeProfileId, switchProfile, addProfile, deleteProfile } = useProfile();

  // ── State ──────────────────────────────────────────────────
  const [draft, setDraft] = useState(profile);
  const [saved, setSaved] = useState(false);
  const [signatureEditorVisible, setSignatureEditorVisible] = useState(false);
  const [drawnPaths, setDrawnPaths] = useState<string[]>(() =>
    extractPathsFromSvgUri(profile.signatureDataUri)
  );
  const [currentPath, setCurrentPath] = useState("");
  const pathRef = useRef("");
  const [padSize, setPadSize] = useState({ width: 320, height: 140 });
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Profile sync (ONE-SHOT: only on initial load) ────────
  // Only load the signature from the profile ONCE.
  // After that, the local editor state is the source of truth.
  const hasLoadedSignatureRef = useRef(false);

  useEffect(() => {
    // Always update draft text fields (name, changes, etc.)
    setDraft((prev) => ({
      ...prev,
      ...profile,
      // PRESERVE local signature state - do not overwrite with profile's
      signatureDataUri: prev.signatureDataUri,
    }));

    // Only load drawing paths if we haven't done so yet AND there is something to load
    if (!hasLoadedSignatureRef.current && profile.signatureDataUri) {
      setDrawnPaths(extractPathsFromSvgUri(profile.signatureDataUri));
      setDraft(d => ({ ...d, signatureDataUri: profile.signatureDataUri }));
      hasLoadedSignatureRef.current = true;
    }
  }, [profile]);

  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(false), 1800);
    return () => clearTimeout(timer);
  }, [saved]);

  // ── Auto-save (debounced, non-destructive) ────────────────
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const autoSave = useCallback(() => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        if (!profilesMatch(draftRef.current, profile)) {
          await saveProfile(draftRef.current);
          setSaved(true);
        }
      } catch (error) {
        console.error("Auto-save failed", error);
      }
    }, 800);
  }, [profile, saveProfile]);

  // Trigger auto-save whenever draft changes
  useEffect(() => {
    autoSave();
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [draft, autoSave]);

  const initials = useMemo(() => {
    const fullName = draft.expediteur_nom.trim();
    if (!fullName) return "DG";
    return fullName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }, [draft.expediteur_nom]);

  const hasIdentityData =
    Boolean(draft.expediteur_nom) ||
    Boolean(draft.expediteur_adresse) ||
    Boolean(draft.expediteur_email) ||
    Boolean(draft.expediteur_tel) ||
    Boolean(draft.lieu);

  const hasSignature = Boolean(draft.signatureDataUri);



  const completion = useMemo(() => {
    const fields = [
      draft.expediteur_nom,
      draft.expediteur_adresse,
      draft.expediteur_email,
      draft.expediteur_tel,
      draft.lieu,
      draft.signatureDataUri,
    ];

    const filled = fields.filter((value) => Boolean(value && String(value).trim().length > 0)).length;
    return Math.round((filled / fields.length) * 100);
  }, [draft]);

  // ── Signature PanResponder ────────────────────────────────
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        // Capture phase: claim gesture BEFORE ScrollView can steal it
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: (event) => {
          setScrollEnabled(false);
          const x = event.nativeEvent.locationX.toFixed(1);
          const y = event.nativeEvent.locationY.toFixed(1);
          const start = `M ${x} ${y}`;
          pathRef.current = start;
          setCurrentPath(start);
        },
        onPanResponderMove: (event) => {
          if (!pathRef.current) return;
          const x = event.nativeEvent.locationX.toFixed(1);
          const y = event.nativeEvent.locationY.toFixed(1);
          const next = `${pathRef.current} L ${x} ${y}`;
          pathRef.current = next;
          setCurrentPath(next);
        },
        onPanResponderRelease: () => {
          if (pathRef.current) {
            const smoothed = smoothRawPath(pathRef.current);
            setDrawnPaths((prev) => [...prev, smoothed]);
          }
          pathRef.current = "";
          setCurrentPath("");
          setScrollEnabled(true);
        },
        onPanResponderTerminate: () => {
          if (pathRef.current) {
            const smoothed = smoothRawPath(pathRef.current);
            setDrawnPaths((prev) => [...prev, smoothed]);
          }
          pathRef.current = "";
          setCurrentPath("");
          setScrollEnabled(true);
        },
      }),
    []
  );

  const clearSignaturePad = () => {
    setDrawnPaths([]);
    setCurrentPath("");
    pathRef.current = "";
  };

  const undoLastStroke = () => {
    setDrawnPaths((prev) => prev.slice(0, -1));
  };

  // ── Save signature: generate SVG → update draft → persist ─
  const saveDrawnSignatureToDraft = useCallback(() => {
    const allPaths = [...drawnPaths, currentPath].filter((p) => p.trim().length > 0);
    if (allPaths.length === 0) return;

    const width = Math.max(220, Math.round(padSize.width));
    const height = Math.max(120, Math.round(padSize.height));
    const pathTags = allPaths
      .map(
        (path) =>
          `<path d="${path}" fill="none" stroke="#1f2a3d" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`
      )
      .join("");

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="white"/>${pathTags}</svg>`;
    const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

    // Update draft AND our ref to prevent reload loops
    setDraft((prev) => ({ ...prev, signatureDataUri: dataUri }));
    // We generated it, so we consider it "loaded" / "current"
    hasLoadedSignatureRef.current = true;
  }, [drawnPaths, currentPath, padSize]);

  const importSignature = async () => {
    try {
      const resultPicker = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.92,
        allowsEditing: true,
        base64: true,
      });

      if (resultPicker.canceled || !resultPicker.assets[0]) return;

      const asset = resultPicker.assets[0];
      if (asset.base64) {
        const mime = asset.mimeType ?? "image/png";
        setDraft((prev) => ({ ...prev, signatureDataUri: `data:${mime};base64,${asset.base64}` }));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }

      setDraft((prev) => ({ ...prev, signatureDataUri: asset.uri }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Profile signature import failed", error);
      Alert.alert("Import impossible", "La signature n'a pas pu etre importee.");
    }
  };



  const handleSwitchProfile = useCallback(
    (id: string) => {
      if (id === activeProfileId) return;
      // Save current draft first
      if (!profilesMatch(draft, profile)) {
        saveProfile(draft);
      }
      switchProfile(id);
    },
    [activeProfileId, draft, profile, saveProfile, switchProfile]
  );

  const handleAddProfile = useCallback(() => {
    Alert.prompt(
      "Nouveau profil",
      "Nom du profil (ex: Pro, Conjoint)",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Cr\u00e9er",
          onPress: (label?: string) => {
            if (label?.trim()) addProfile(label.trim());
          },
        },
      ],
      "plain-text"
    );
  }, [addProfile]);

  const handleDeleteProfile = useCallback(
    (id: string, label: string) => {
      if (profiles.length <= 1) {
        Alert.alert("Impossible", "Tu ne peux pas supprimer ton dernier profil.");
        return;
      }
      Alert.alert("Supprimer", `Supprimer le profil "${label}" ?`, [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => deleteProfile(id),
        },
      ]);
    },
    [profiles.length, deleteProfile]
  );

  // Reload draft when active profile changes
  useEffect(() => {
    setDraft(profile);
    setDrawnPaths(extractPathsFromSvgUri(profile.signatureDataUri));
  }, [activeProfileId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement du profil...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={["#FDFBF7", "#FFF8F0", "#FDFBF7"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={76}
      >
        <ScrollView
          scrollEnabled={scrollEnabled}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 30 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <BlurView intensity={34} tint="light" style={styles.heroCard}>
            <LinearGradient
              colors={["rgba(205,229,255,0.58)", "rgba(246,255,249,0.35)"]}
              style={styles.heroTint}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.heroTop}>
              <View style={styles.avatarBubble}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>

              <View style={styles.heroTextWrap}>
                <Text style={styles.heroTitle}>Profile</Text>
                <Text style={styles.heroDesc}>Tes informations sont reutilisees automatiquement.</Text>
              </View>

              <Pressable
                style={({ pressed }) => [styles.settingsButton, pressed && styles.pressedButton]}
                onPress={() => router.push("/profile/settings")}
                accessibilityRole="button"
                accessibilityLabel="Paramètres"
              >
                <Settings color={Colors.primary} size={20} />
              </Pressable>
            </View>

            <View style={styles.heroBottom}>
              <View style={styles.securePill}>
                <ShieldCheck color={Colors.primary} size={14} />
                <Text style={styles.secureText}>Stockage local chiffre</Text>
              </View>

              <View style={styles.progressWrap}>
                <Text style={styles.progressValue}>{completion}%</Text>
              </View>

              {saved ? (
                <View style={styles.savedPill}>
                  <CheckCircle2 color={Colors.primary} size={14} />
                  <Text style={styles.savedText}>Enregistre</Text>
                </View>
              ) : null}
            </View>
          </BlurView>

          {/* Profile switcher */}
          <View style={styles.profileSwitcherRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {profiles.map((entry) => {
                const isActive = entry.id === activeProfileId;
                return (
                  <Pressable
                    key={entry.id}
                    style={[styles.profilePill, isActive && styles.profilePillActive]}
                    onPress={() => handleSwitchProfile(entry.id)}
                    onLongPress={() => handleDeleteProfile(entry.id, entry.label)}
                  >
                    <Text style={[styles.profilePillText, isActive && styles.profilePillTextActive]}>
                      {entry.label}
                    </Text>
                  </Pressable>
                );
              })}
              <Pressable style={styles.profileAddPill} onPress={handleAddProfile}>
                <Plus color={Colors.primary} size={14} />
              </Pressable>
            </ScrollView>
          </View>

          {!hasIdentityData ? (
            <BlurView intensity={24} tint="light" style={styles.emptyStateCard}>
              <Sparkles color={Colors.primary} size={18} />
              <View style={styles.emptyStateTextWrap}>
                <Text style={styles.emptyStateTitle}>Commence avec ton identite</Text>
                <Text style={styles.emptyStateDesc}>Nom, adresse et contact permettent de pre-remplir la plupart des documents.</Text>
              </View>
            </BlurView>
          ) : null}

          <BlurView intensity={24} tint="light" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <UserCircle2 color={Colors.primary} size={16} />
              <Text style={styles.sectionTitle}>Coordonnees</Text>
            </View>

            <Text style={styles.label}>Prenom et nom</Text>
            <TextInput
              value={draft.expediteur_nom}
              onChangeText={(value) => setDraft((prev) => ({ ...prev, expediteur_nom: value }))}
              placeholder="Camille Martin"
              style={styles.input}
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.label}>Adresse complete</Text>
            <TextInput
              value={draft.expediteur_adresse}
              onChangeText={(value) => setDraft((prev) => ({ ...prev, expediteur_adresse: value }))}
              placeholder="14 rue des Lilas, 75015 Paris"
              multiline
              textAlignVertical="top"
              style={[styles.input, styles.multiline]}
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              value={draft.expediteur_email}
              onChangeText={(value) => setDraft((prev) => ({ ...prev, expediteur_email: value }))}
              placeholder="camille@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.label}>Telephone</Text>
            <TextInput
              value={draft.expediteur_tel}
              onChangeText={(value) => setDraft((prev) => ({ ...prev, expediteur_tel: value }))}
              placeholder="06 12 34 56 78"
              keyboardType="phone-pad"
              style={styles.input}
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.label}>Ville principale</Text>
            <TextInput
              value={draft.lieu}
              onChangeText={(value) => setDraft((prev) => ({ ...prev, lieu: value }))}
              placeholder="Paris"
              style={styles.input}
              placeholderTextColor={Colors.textMuted}
            />
          </BlurView>

          <BlurView intensity={24} tint="light" style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <PenLine color={Colors.primary} size={16} />
              <Text style={styles.sectionTitle}>Signature par defaut</Text>
            </View>

            <View style={styles.signatureActionRow}>
              <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressedButton]} onPress={importSignature}>
                <ImagePlus color={Colors.primary} size={16} />
                <Text style={styles.secondaryButtonText}>Importer</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressedButton]}
                onPress={() => {
                  if (signatureEditorVisible) {
                    // Save drawing before closing
                    saveDrawnSignatureToDraft();
                  }
                  setSignatureEditorVisible((prev) => !prev);
                }}
              >
                <PenLine color={Colors.primary} size={16} />
                <Text style={styles.secondaryButtonText}>{signatureEditorVisible ? "Terminer" : "Dessiner"}</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressedButton]}
                onPress={() => {
                  setDrawnPaths([]);
                  setDraft((prev) => ({ ...prev, signatureDataUri: undefined }));
                }}
                disabled={!draft.signatureDataUri}
              >
                <Eraser color={Colors.primary} size={16} />
                <Text style={styles.secondaryButtonText}>Retirer</Text>
              </Pressable>
            </View>

            {signatureEditorVisible ? (
              <View style={styles.signaturePadWrap}>
                <View
                  style={styles.signaturePad}
                  onLayout={(event) => {
                    const { width, height } = event.nativeEvent.layout;
                    if (width > 0 && height > 0) setPadSize({ width, height });
                  }}
                  {...panResponder.panHandlers}
                >
                  <Svg width={padSize.width} height={padSize.height} style={styles.signatureOverlay}>
                    {drawnPaths.map((path, index) => (
                      <Path
                        key={`${path}-${index}`}
                        d={path}
                        fill="none"
                        stroke="#1f2a3d"
                        strokeWidth={2.4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ))}
                    {currentPath ? (
                      <Path
                        d={currentPath}
                        fill="none"
                        stroke="#1f2a3d"
                        strokeWidth={2.4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ) : null}
                  </Svg>
                </View>

                <View style={styles.signaturePadActions}>
                  <Pressable style={({ pressed }) => [styles.inlineChip, pressed && styles.pressedButton]} onPress={undoLastStroke} disabled={drawnPaths.length === 0}>
                    <Text style={styles.inlineChipText}>Annuler</Text>
                  </Pressable>
                  <Pressable style={({ pressed }) => [styles.inlineChip, pressed && styles.pressedButton]} onPress={clearSignaturePad}>
                    <Text style={styles.inlineChipText}>Effacer</Text>
                  </Pressable>
                  <Pressable
                    style={({ pressed }) => [styles.inlineChip, pressed && styles.pressedButton]}
                    onPress={() => {
                      saveDrawnSignatureToDraft();
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }}
                  >
                    <Text style={styles.inlineChipText}>Valider</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {hasSignature ? (
              <View style={styles.signaturePreviewWrap}>
                <SignaturePreview
                  uri={draft.signatureDataUri!}
                  width="100%"
                  height="100%"
                  style={styles.signaturePreview}
                />
              </View>
            ) : (
              <View style={styles.signatureEmptyWrap}>
                <Text style={styles.signatureEmptyTitle}>Aucune signature enregistree</Text>
                <Text style={styles.signatureEmptyDesc}>Importe une image ou dessine-la pour l&apos;ajouter automatiquement aux futurs documents.</Text>
              </View>
            )}
          </BlurView>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  heroCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.78)",
    backgroundColor: "rgba(255,255,255,0.32)",
    overflow: "hidden",
    padding: 14,
  },
  heroTint: {
    ...StyleSheet.absoluteFillObject,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  avatarBubble: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: "rgba(42,104,176,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: Colors.primary,
    fontWeight: "800",
    fontSize: 18,
    letterSpacing: 0.4,
  },
  heroTextWrap: {
    flex: 1,
  },
  heroTitle: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  heroDesc: {
    color: Colors.textSecondary,
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
  },
  progressWrap: {
    minWidth: 58,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(116,169,255,0.36)",
    backgroundColor: "rgba(255,255,255,0.8)",
    alignItems: "center",
  },
  progressValue: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  heroBottom: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  securePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(230,200,170,0.30)",
    backgroundColor: "rgba(255,250,245,0.85)",
  },
  secureText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "700",
  },
  savedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(140,208,164,0.5)",
    backgroundColor: "rgba(241,255,246,0.92)",
  },
  savedText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "700",
  },
  settingsButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(230,200,170,0.28)",
    backgroundColor: Colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  pressedButton: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },
  emptyStateCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(230,200,170,0.28)",
    backgroundColor: "rgba(255,250,245,0.55)",
    overflow: "hidden",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  emptyStateTextWrap: {
    flex: 1,
  },
  emptyStateTitle: {
    color: Colors.text,
    fontWeight: "700",
    fontSize: 13,
  },
  emptyStateDesc: {
    color: Colors.textMuted,
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
  },
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(230,200,170,0.28)",
    backgroundColor: "rgba(255,250,245,0.48)",
    overflow: "hidden",
    padding: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 8,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: "800",
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.82)",
    borderWidth: 1,
    borderColor: "rgba(107,163,255,0.25)",
    color: Colors.text,
    fontSize: 15,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  multiline: {
    minHeight: 94,
  },
  signatureActionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(230,200,170,0.28)",
    paddingHorizontal: 11,
    paddingVertical: 8,
    backgroundColor: Colors.accentSoft,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  secondaryButtonText: {
    color: Colors.accent,
    fontSize: 12,
    fontWeight: "700",
  },
  signaturePadWrap: {
    marginTop: 10,
    gap: 8,
  },
  signaturePad: {
    height: 150,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(230,200,170,0.30)",
    backgroundColor: "rgba(255,250,245,0.95)",
    overflow: "hidden",
  },
  signatureOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  signaturePadActions: {
    flexDirection: "row",
    gap: 8,
  },
  inlineChip: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(230,176,100,0.28)",
    backgroundColor: "rgba(255,250,245,0.85)",
  },
  inlineChipText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "700",
  },
  signaturePreviewWrap: {
    marginTop: 10,
    height: 104,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(230,200,170,0.30)",
    backgroundColor: "rgba(255,250,245,0.92)",
    overflow: "hidden",
  },
  signaturePreview: {
    width: "100%",
    height: "100%",
  },
  signatureEmptyWrap: {
    marginTop: 10,
    minHeight: 92,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(230,200,170,0.30)",
    backgroundColor: "rgba(255,250,245,0.80)",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  signatureEmptyTitle: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  signatureEmptyDesc: {
    marginTop: 3,
    color: Colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  profileSwitcherRow: {
    paddingHorizontal: 2,
  },
  profilePill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.75)",
    borderWidth: 1.5,
    borderColor: "rgba(200,180,150,0.25)",
  },
  profilePillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  profilePillText: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  profilePillTextActive: {
    color: Colors.white,
  },
  profileAddPill: {
    width: 36,
    height: 36,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: "rgba(200,180,150,0.3)",
    borderStyle: "dashed" as const,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
});
