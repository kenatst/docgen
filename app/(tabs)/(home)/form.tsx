import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { BookUser, Check, Eraser, Eye, ImagePlus, PenLine, Send, Sparkles, UserRound } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import Colors from "@/constants/colors";
import {
  DocumentFormValues,
  FIELD_SECTION_LABELS,
  FormField,
  TONE_OPTIONS,
  ToneType,
} from "@/constants/types";
import { findTemplate } from "@/constants/templates";
import { useDocuments } from "@/context/DocumentContext";
import { useProfile } from "@/context/ProfileContext";
import { generateDocument, validateTemplateValues } from "@/utils/documentGenerator";
import { createDocumentId } from "@/utils/ids";
import { SignaturePreview } from "@/components/SignaturePreview";
import { smoothRawPath } from "@/utils/signatureSmoothing";
import { PdfPreviewModal } from "@/components/PdfPreviewModal";
import { GeneratedDocument } from "@/constants/types";
import { AddressBookModal } from "@/components/AddressBookModal";
import { SavedContact } from "@/context/AddressBookContext";

const SECTION_TINTS: Record<string, [string, string]> = {
  expediteur: ["rgba(230,176,100,0.25)", "rgba(255,248,240,0.2)"],
  destinataire: ["rgba(255,200,170,0.28)", "rgba(255,247,244,0.2)"],
  demande: ["rgba(200,220,180,0.28)", "rgba(248,255,248,0.15)"],
  pieces: ["rgba(245,220,180,0.30)", "rgba(255,252,241,0.15)"],
};

function getFrenchToday(): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function keyboardTypeFromField(field: FormField) {
  if (field.type === "email") return "email-address" as const;
  if (field.type === "phone") return "phone-pad" as const;
  if (field.type === "number") return "numeric" as const;
  return "default" as const;
}

function autoCapitalizeFromField(field: FormField) {
  if (field.type === "email") return "none" as const;
  return "sentences" as const;
}

export default function FormScreen() {
  const { templateId } = useLocalSearchParams<{ templateId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { addDocument, history } = useDocuments();
  const { profile, applyVersion, isLoading: isProfileLoading, registerLastFormTemplate } = useProfile();

  const result = useMemo(() => findTemplate(templateId ?? ""), [templateId]);
  const [values, setValues] = useState<DocumentFormValues>({});
  const [tone, setTone] = useState<ToneType>("neutre");
  const [signatureDataUri, setSignatureDataUri] = useState<string | undefined>();
  const [signatureEditorVisible, setSignatureEditorVisible] = useState(false);
  const [drawnPaths, setDrawnPaths] = useState<string[]>([]);
  const [currentPath, setCurrentPath] = useState("");
  const pathRef = useRef("");
  const [padSize, setPadSize] = useState({ width: 320, height: 150 });
  const [formScrollEnabled, setFormScrollEnabled] = useState(true);
  const applyVersionRef = useRef(applyVersion);
  const initializedTemplateRef = useRef<string | null>(null);

  const applyProfileToValues = useCallback(
    (baseValues: DocumentFormValues): DocumentFormValues => {
      const next = { ...baseValues };

      if (next.expediteur_nom !== undefined && profile.expediteur_nom) {
        next.expediteur_nom = profile.expediteur_nom;
      }
      if (next.expediteur_adresse !== undefined && profile.expediteur_adresse) {
        next.expediteur_adresse = profile.expediteur_adresse;
      }
      if (next.expediteur_email !== undefined && profile.expediteur_email) {
        next.expediteur_email = profile.expediteur_email;
      }
      if (next.expediteur_tel !== undefined && profile.expediteur_tel) {
        next.expediteur_tel = profile.expediteur_tel;
      }
      if (next.lieu !== undefined && profile.lieu) {
        next.lieu = profile.lieu;
      }

      return next;
    },
    [profile]
  );

  useEffect(() => {
    if (!result || isProfileLoading) return;
    if (initializedTemplateRef.current === result.template.id) return;
    initializedTemplateRef.current = result.template.id;

    const initialValues: DocumentFormValues = {};
    for (const field of result.template.fields) {
      initialValues[field.id] = "";
    }

    setValues(applyProfileToValues(initialValues));
    setTone("neutre");
    setSignatureDataUri(profile.signatureDataUri);
    setSignatureEditorVisible(false);
    setDrawnPaths([]);
    setCurrentPath("");
    pathRef.current = "";
  }, [applyProfileToValues, isProfileLoading, profile.signatureDataUri, result]);

  useEffect(() => {
    if (!result?.template.id) return;
    registerLastFormTemplate(result.template.id);
  }, [registerLastFormTemplate, result?.template.id]);

  const latestFilledDocument = useMemo(
    () => history.find((entry) => entry.values.expediteur_nom || entry.values.destinataire_nom),
    [history]
  );

  const fieldsBySection = useMemo(() => {
    if (!result) return [];
    const sections = new Map<string, FormField[]>();

    for (const field of result.template.fields) {
      const section = field.section ?? "demande";
      const currentSection = sections.get(section) ?? [];
      currentSection.push(field);
      sections.set(section, currentSection);
    }

    return Array.from(sections.entries());
  }, [result]);

  const dateFieldIds = useMemo(() => {
    if (!result) return [];
    return result.template.fields
      .filter((field) => field.type === "date" || field.id === "date")
      .map((field) => field.id);
  }, [result]);

  const updateField = useCallback((fieldId: string, value: string) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
  }, []);

  const applyTodayToDateFields = useCallback(() => {
    if (dateFieldIds.length === 0) return;
    const today = getFrenchToday();

    setValues((prev) => {
      const next = { ...prev };
      for (const fieldId of dateFieldIds) {
        next[fieldId] = today;
      }
      return next;
    });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [dateFieldIds]);

  const applyProfileShortcut = useCallback(() => {
    setValues((prev) => applyProfileToValues(prev));
    if (profile.signatureDataUri) {
      setSignatureDataUri(profile.signatureDataUri);
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [applyProfileToValues, profile.signatureDataUri]);

  useEffect(() => {
    if (applyVersion === applyVersionRef.current) return;
    applyVersionRef.current = applyVersion;

    setValues((prev) => applyProfileToValues(prev));

    if (profile.signatureDataUri) {
      setSignatureDataUri(profile.signatureDataUri);
    }
  }, [applyProfileToValues, applyVersion, profile.signatureDataUri]);

  const applyRecipientShortcut = useCallback(() => {
    if (!latestFilledDocument) return;

    const latestValues = latestFilledDocument.values;
    setValues((prev) => ({
      ...prev,
      destinataire_nom: latestValues.destinataire_nom ?? prev.destinataire_nom,
      destinataire_adresse: latestValues.destinataire_adresse ?? prev.destinataire_adresse,
    }));

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [latestFilledDocument]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: (event) => {
          setFormScrollEnabled(false);
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
          if (!pathRef.current) return;
          const smoothed = smoothRawPath(pathRef.current);
          setDrawnPaths((prev) => [...prev, smoothed]);
          pathRef.current = "";
          setCurrentPath("");
          setFormScrollEnabled(true);
        },
        onPanResponderTerminate: () => {
          if (pathRef.current) {
            const smoothed = smoothRawPath(pathRef.current);
            setDrawnPaths((prev) => [...prev, smoothed]);
          }
          pathRef.current = "";
          setCurrentPath("");
          setFormScrollEnabled(true);
        },
      }),
    []
  );

  const clearSignaturePad = useCallback(() => {
    setDrawnPaths([]);
    setCurrentPath("");
    pathRef.current = "";
  }, []);

  const undoLastStroke = useCallback(() => {
    setDrawnPaths((prev) => prev.slice(0, -1));
  }, []);

  const saveDrawnSignature = useCallback(() => {
    const allPaths = [...drawnPaths, currentPath].filter((path) => path.trim().length > 0);
    if (allPaths.length === 0) {
      Alert.alert("Signature vide", "Dessine ta signature avant d'enregistrer.");
      return;
    }

    const width = Math.max(220, Math.round(padSize.width));
    const height = Math.max(120, Math.round(padSize.height));
    const pathTags = allPaths
      .map(
        (path) =>
          `<path d=\"${path}\" fill=\"none\" stroke=\"#1f2a3d\" stroke-width=\"2.4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>`
      )
      .join("");

    const svg = `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"${width}\" height=\"${height}\" viewBox=\"0 0 ${width} ${height}\"><rect width=\"100%\" height=\"100%\" fill=\"white\"/>${pathTags}</svg>`;
    const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

    setSignatureDataUri(dataUri);
    setSignatureEditorVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [currentPath, drawnPaths, padSize.height, padSize.width]);

  const importSignature = useCallback(async () => {
    try {
      const resultPicker = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.92,
        allowsEditing: true,
        base64: true,
      });

      if (resultPicker.canceled || !resultPicker.assets[0]) {
        return;
      }

      const asset = resultPicker.assets[0];
      if (asset.base64) {
        const mime = asset.mimeType ?? "image/png";
        setSignatureDataUri(`data:${mime};base64,${asset.base64}`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }

      setSignatureDataUri(asset.uri);
    } catch (error) {
      console.error("Signature import failed", error);
      Alert.alert("Import impossible", "La signature n'a pas pu etre importee.");
    }
  }, []);

  const handleGenerate = useCallback(() => {
    if (!result) return;

    const errors = validateTemplateValues(result.template, values);
    if (errors.length > 0) {
      Alert.alert("Champs a completer", errors.slice(0, 3).join("\n"));
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const content = generateDocument(result.template, values, tone);
    const now = new Date().toISOString();
    const id = createDocumentId();

    addDocument({
      id,
      templateId: result.template.id,
      templateVersion: result.template.version,
      templateTitle: result.template.title,
      categoryTitle: result.category.title,
      content,
      createdAt: now,
      updatedAt: now,
      values,
      tone,
      signatureDataUri,
    });

    router.push({ pathname: "/preview", params: { documentId: id } });
  }, [addDocument, result, router, signatureDataUri, tone, values]);

  // ── Preview ───────────────────────────────────────────────
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<GeneratedDocument | null>(null);

  const handlePreview = useCallback(() => {
    if (!result) return;
    const errors = validateTemplateValues(result.template, values);
    if (errors.length > 0) {
      Alert.alert("Champs à compléter", errors.slice(0, 3).join("\n"));
      return;
    }
    const content = generateDocument(result.template, values, tone);
    setPreviewDoc({
      id: "preview",
      templateId: result.template.id,
      templateVersion: result.template.version,
      templateTitle: result.template.title,
      categoryTitle: result.category.title,
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      values,
      tone,
      signatureDataUri,
    });
    setPreviewVisible(true);
  }, [result, values, tone, signatureDataUri]);

  // ── Address book ──────────────────────────────────────────
  const [addressBookVisible, setAddressBookVisible] = useState(false);

  const handleContactSelect = useCallback(
    (contact: SavedContact) => {
      setValues((prev) => {
        const next = { ...prev };
        // Map contact fields to form destinataire fields
        const fields = result?.template.fields ?? [];
        for (const f of fields) {
          if (f.section === "destinataire") {
            if (f.id.toLowerCase().includes("nom") && contact.nom) next[f.id] = contact.nom;
            else if (f.id.toLowerCase().includes("adresse") && contact.adresse) next[f.id] = contact.adresse;
            else if (f.id.toLowerCase().includes("email") && contact.email) next[f.id] = contact.email;
            else if (f.id.toLowerCase().includes("tel") && contact.tel) next[f.id] = contact.tel;
          }
        }
        return next;
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    [result]
  );

  if (!result) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Modele introuvable</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={["#FDF8F3", "#FFF5EC", "#FDF8F3"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <Stack.Screen options={{ title: result.template.title }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={88}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 36 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={formScrollEnabled}
        >
          <BlurView intensity={36} tint="light" style={styles.headCard}>
            <Text style={styles.headTitle}>{result.template.title}</Text>
            <Text style={styles.headDesc}>{result.template.description}</Text>
          </BlurView>

          <BlurView intensity={24} tint="light" style={styles.shortcutCard}>
            <Text style={styles.shortcutTitle}>Raccourcis intelligents</Text>
            <View style={styles.shortcutRow}>
              <TouchableOpacity style={styles.shortcutChip} onPress={applyTodayToDateFields} activeOpacity={0.86}>
                <Sparkles color={Colors.primary} size={14} />
                <Text style={styles.shortcutText}>Date du jour</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shortcutChip}
                onPress={applyProfileShortcut}
                activeOpacity={0.86}
                accessibilityRole="button"
                accessibilityLabel="Appliquer mes informations de profil"
                disabled={
                  !profile.expediteur_nom &&
                  !profile.expediteur_adresse &&
                  !profile.expediteur_email &&
                  !profile.expediteur_tel &&
                  !profile.lieu
                }
              >
                <UserRound color={Colors.primary} size={14} />
                <Text style={styles.shortcutText}>Mes infos</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shortcutChip}
                onPress={applyRecipientShortcut}
                activeOpacity={0.86}
                accessibilityRole="button"
                accessibilityLabel="Remplir avec le dernier destinataire"
                disabled={!latestFilledDocument}
              >
                <UserRound color={Colors.primary} size={14} />
                <Text style={styles.shortcutText}>Dernier dest.</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shortcutChip}
                onPress={() => setAddressBookVisible(true)}
                activeOpacity={0.86}
                accessibilityRole="button"
                accessibilityLabel="Ouvrir le carnet d'adresses"
              >
                <BookUser color={Colors.primary} size={14} />
                <Text style={styles.shortcutText}>Carnet</Text>
              </TouchableOpacity>
            </View>
          </BlurView>

          {fieldsBySection.map(([section, sectionFields]) => (
            <BlurView key={section} intensity={24} tint="light" style={styles.sectionCard}>
              <LinearGradient
                colors={SECTION_TINTS[section] ?? ["rgba(255,255,255,0.45)", "rgba(255,255,255,0.1)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sectionTint}
              />

              <Text style={styles.sectionLabel}>
                {FIELD_SECTION_LABELS[section as keyof typeof FIELD_SECTION_LABELS] ?? "Informations"}
              </Text>

              {sectionFields.map((field) => {
                const value = values[field.id] ?? "";
                const multiline = field.multiline || field.type === "textarea";
                const isDateField = field.type === "date" || field.id === "date";
                const isAddressField = field.id === "destinataire_adresse" && Boolean(values.expediteur_adresse);

                return (
                  <View style={styles.inputGroup} key={field.id}>
                    <View style={styles.inputLabelRow}>
                      <Text style={styles.inputLabel}>
                        {field.label}
                        {field.required ? " *" : ""}
                      </Text>

                      <View style={styles.inlineActions}>
                        {isDateField ? (
                          <TouchableOpacity
                            style={styles.inlineChip}
                            activeOpacity={0.86}
                            onPress={() => updateField(field.id, getFrenchToday())}
                          >
                            <Text style={styles.inlineChipText}>Aujourd&apos;hui</Text>
                          </TouchableOpacity>
                        ) : null}

                        {isAddressField ? (
                          <TouchableOpacity
                            style={styles.inlineChip}
                            activeOpacity={0.86}
                            onPress={() => updateField(field.id, values.expediteur_adresse)}
                          >
                            <Text style={styles.inlineChipText}>Mon adresse</Text>
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>

                    <TextInput
                      style={[styles.input, multiline && styles.multilineInput]}
                      placeholder={field.placeholder}
                      placeholderTextColor={Colors.textMuted}
                      value={value}
                      onChangeText={(next) => updateField(field.id, next)}
                      keyboardType={keyboardTypeFromField(field)}
                      autoCapitalize={autoCapitalizeFromField(field)}
                      autoCorrect={false}
                      multiline={multiline}
                      numberOfLines={multiline ? 4 : 1}
                      textAlignVertical={multiline ? "top" : "center"}
                      testID={`field-${field.id}`}
                    />
                    {field.helperText ? <Text style={styles.helperText}>{field.helperText}</Text> : null}
                  </View>
                );
              })}
            </BlurView>
          ))}

          {result.template.toneEnabled ? (
            <BlurView intensity={24} tint="light" style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>Ton du document</Text>
              <View style={styles.toneGrid}>
                {TONE_OPTIONS.map((option) => {
                  const selected = tone === option.id;
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[styles.toneCard, selected && styles.toneCardSelected]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setTone(option.id);
                      }}
                      activeOpacity={0.84}
                      testID={`tone-${option.id}`}
                    >
                      {selected ? (
                        <View style={styles.toneCheck}>
                          <Check color={Colors.white} size={12} />
                        </View>
                      ) : null}
                      <Text style={[styles.toneLabel, selected && styles.toneLabelSelected]}>{option.label}</Text>
                      <Text style={[styles.toneDesc, selected && styles.toneDescSelected]}>{option.description}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </BlurView>
          ) : null}

          <BlurView intensity={24} tint="light" style={styles.sectionCard}>
            <Text style={styles.sectionLabel}>Signature</Text>
            <View style={styles.signatureActionRow}>
              <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.86} onPress={importSignature}>
                <ImagePlus color={Colors.primary} size={16} />
                <Text style={styles.secondaryButtonText}>Importer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                activeOpacity={0.86}
                onPress={() => setSignatureEditorVisible((prev) => !prev)}
                accessibilityRole="button"
                accessibilityLabel="Dessiner une signature"
              >
                <PenLine color={Colors.primary} size={16} />
                <Text style={styles.secondaryButtonText}>
                  {signatureEditorVisible ? "Masquer" : "Dessiner"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                activeOpacity={0.86}
                onPress={() => setSignatureDataUri(undefined)}
                disabled={!signatureDataUri}
                accessibilityRole="button"
                accessibilityLabel="Retirer la signature"
              >
                <Eraser color={Colors.primary} size={16} />
                <Text style={styles.secondaryButtonText}>Retirer</Text>
              </TouchableOpacity>
            </View>

            {signatureEditorVisible ? (
              <View style={styles.signaturePadWrap}>
                <View
                  style={styles.signaturePad}
                  onLayout={(event) => {
                    const { width, height } = event.nativeEvent.layout;
                    if (width > 0 && height > 0) {
                      setPadSize({ width, height });
                    }
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
                  <TouchableOpacity style={styles.inlineChip} activeOpacity={0.86} onPress={undoLastStroke} disabled={drawnPaths.length === 0}>
                    <Text style={styles.inlineChipText}>Annuler</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.inlineChip} activeOpacity={0.86} onPress={clearSignaturePad}>
                    <Text style={styles.inlineChipText}>Effacer</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.inlineChip} activeOpacity={0.86} onPress={saveDrawnSignature}>
                    <Text style={styles.inlineChipText}>Valider</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {signatureDataUri ? (
              <View style={styles.signaturePreviewWrap}>
                <SignaturePreview
                  uri={signatureDataUri}
                  width="100%"
                  height="100%"
                  style={styles.signaturePreview}
                />
              </View>
            ) : null}
          </BlurView>

          <View style={styles.generateRow}>
            <TouchableOpacity
              style={styles.previewButton}
              activeOpacity={0.84}
              onPress={handlePreview}
              accessibilityRole="button"
              accessibilityLabel="Aperçu du document"
              testID="preview-button"
            >
              <Eye color={Colors.accent} size={18} />
              <Text style={styles.previewText}>Aperçu</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.generateButton}
              activeOpacity={0.84}
              onPress={handleGenerate}
              accessibilityRole="button"
              accessibilityLabel="Generer le document"
              testID="generate-button"
            >
              <Send color={Colors.white} size={18} />
              <Text style={styles.generateText}>Générer</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <PdfPreviewModal
        visible={previewVisible}
        onClose={() => setPreviewVisible(false)}
        document={previewDoc}
      />
      <AddressBookModal
        visible={addressBookVisible}
        onClose={() => setAddressBookVisible(false)}
        onSelect={handleContactSelect}
      />
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
    paddingTop: 14,
    gap: 10,
  },
  headCard: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(230,200,170,0.30)",
    backgroundColor: "rgba(255,250,245,0.55)",
    overflow: "hidden",
  },
  headTitle: {
    color: Colors.text,
    fontSize: 19,
    fontWeight: "800",
  },
  headDesc: {
    marginTop: 6,
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  shortcutCard: {
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(230,200,170,0.28)",
    backgroundColor: "rgba(255,250,245,0.50)",
    overflow: "hidden",
  },
  shortcutTitle: {
    color: Colors.text,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
  },
  shortcutRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  shortcutChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(230,176,100,0.28)",
    backgroundColor: "rgba(255,250,245,0.8)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  shortcutText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "700",
  },
  sectionCard: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(230,200,170,0.28)",
    backgroundColor: "rgba(255,250,245,0.48)",
    overflow: "hidden",
  },
  sectionTint: {
    ...StyleSheet.absoluteFillObject,
  },
  sectionLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: Colors.textMuted,
    fontWeight: "700",
    marginBottom: 10,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  inputLabel: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  inlineActions: {
    flexDirection: "row",
    gap: 6,
  },
  inlineChip: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(230,176,100,0.28)",
    backgroundColor: "rgba(255,250,245,0.85)",
  },
  inlineChipText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "700",
  },
  input: {
    borderRadius: 13,
    backgroundColor: "rgba(255,250,245,0.90)",
    borderWidth: 1,
    borderColor: "rgba(230,200,170,0.22)",
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: Colors.text,
  },
  multilineInput: {
    minHeight: 104,
    paddingTop: 11,
  },
  helperText: {
    marginTop: 4,
    color: Colors.textMuted,
    fontSize: 11,
  },
  toneGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  toneCard: {
    width: "48%",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(230,200,170,0.22)",
    backgroundColor: "rgba(255,250,245,0.8)",
    flexGrow: 1,
    flexBasis: "45%",
  },
  toneCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentSoft,
  },
  toneCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  toneLabel: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 3,
  },
  toneLabelSelected: {
    color: Colors.primary,
  },
  toneDesc: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  toneDescSelected: {
    color: Colors.primaryLight,
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
    color: Colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  signaturePadWrap: {
    marginTop: 10,
    gap: 8,
  },
  signaturePad: {
    height: 155,
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
    flexWrap: "wrap",
  },
  signaturePreviewWrap: {
    marginTop: 10,
    height: 110,
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
  generateRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  previewButton: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: "rgba(255,250,245,0.85)",
    borderWidth: 1.5,
    borderColor: "rgba(230,176,100,0.45)",
    minHeight: 52,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  previewText: {
    color: Colors.accent,
    fontWeight: "700",
    fontSize: 15,
  },
  generateButton: {
    flex: 2,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    minHeight: 52,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  generateText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: 16,
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
