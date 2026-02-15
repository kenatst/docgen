import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { Send, Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { findTemplate } from "@/constants/templates";
import { TONE_OPTIONS, DocumentFormData, ToneType } from "@/constants/types";
import { generateDocument } from "@/utils/documentGenerator";
import { useDocuments } from "@/context/DocumentContext";

export default function FormScreen() {
  const { templateId } = useLocalSearchParams<{ templateId: string }>();
  const router = useRouter();
  const { addDocument } = useDocuments();

  const result = useMemo(() => findTemplate(templateId ?? ""), [templateId]);

  const [formData, setFormData] = useState<DocumentFormData>({
    nom: "",
    adresse: "",
    email: "",
    destinataire: "",
    adresse_destinataire: "",
    date: "",
    details: "",
    tone: "neutre",
  });

  const updateField = useCallback((field: keyof DocumentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleToneSelect = useCallback((tone: ToneType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFormData((prev) => ({ ...prev, tone }));
  }, []);

  const handleGenerate = useCallback(() => {
    if (!result) return;

    if (!formData.nom.trim()) {
      Alert.alert("Champ requis", "Veuillez renseigner votre nom.");
      return;
    }
    if (!formData.destinataire.trim()) {
      Alert.alert("Champ requis", "Veuillez renseigner le destinataire.");
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const content = generateDocument(result.template.id, formData);
    const doc = {
      id: Date.now().toString(),
      templateId: result.template.id,
      templateTitle: result.template.title,
      categoryTitle: result.category.title,
      content,
      createdAt: new Date().toISOString(),
      formData,
    };

    addDocument(doc);
    router.push({ pathname: "/preview", params: { documentId: doc.id } });
  }, [formData, result, addDocument, router]);

  if (!result) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Modèle introuvable</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: result.template.title }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={100}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>VOS INFORMATIONS</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Prénom et Nom *</Text>
              <TextInput
                style={styles.input}
                placeholder="Jean Dupont"
                placeholderTextColor={Colors.textMuted}
                value={formData.nom}
                onChangeText={(v) => updateField("nom", v)}
                testID="input-nom"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Votre adresse</Text>
              <TextInput
                style={styles.input}
                placeholder="12 rue de la Paix, 75001 Paris"
                placeholderTextColor={Colors.textMuted}
                value={formData.adresse}
                onChangeText={(v) => updateField("adresse", v)}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Votre email</Text>
              <TextInput
                style={styles.input}
                placeholder="jean.dupont@email.com"
                placeholderTextColor={Colors.textMuted}
                value={formData.email}
                onChangeText={(v) => updateField("email", v)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DESTINATAIRE</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nom du destinataire *</Text>
              <TextInput
                style={styles.input}
                placeholder="Nom de l'organisme ou de la personne"
                placeholderTextColor={Colors.textMuted}
                value={formData.destinataire}
                onChangeText={(v) => updateField("destinataire", v)}
                testID="input-destinataire"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Adresse du destinataire</Text>
              <TextInput
                style={styles.input}
                placeholder="Adresse complète"
                placeholderTextColor={Colors.textMuted}
                value={formData.adresse_destinataire}
                onChangeText={(v) => updateField("adresse_destinataire", v)}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DÉTAILS</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date du document</Text>
              <TextInput
                style={styles.input}
                placeholder="7 février 2026"
                placeholderTextColor={Colors.textMuted}
                value={formData.date}
                onChangeText={(v) => updateField("date", v)}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contexte / Détails</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                placeholder="Précisez votre situation, numéro de contrat, références..."
                placeholderTextColor={Colors.textMuted}
                value={formData.details}
                onChangeText={(v) => updateField("details", v)}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TON DU DOCUMENT</Text>
            <View style={styles.toneGrid}>
              {TONE_OPTIONS.map((tone) => {
                const isSelected = formData.tone === tone.id;
                return (
                  <TouchableOpacity
                    key={tone.id}
                    style={[styles.toneCard, isSelected && styles.toneCardSelected]}
                    onPress={() => handleToneSelect(tone.id)}
                    activeOpacity={0.7}
                    testID={`tone-${tone.id}`}
                  >
                    {isSelected && (
                      <View style={styles.toneCheck}>
                        <Check color={Colors.white} size={12} />
                      </View>
                    )}
                    <Text style={[styles.toneLabel, isSelected && styles.toneLabelSelected]}>
                      {tone.label}
                    </Text>
                    <Text style={[styles.toneDesc, isSelected && styles.toneDescSelected]}>
                      {tone.description}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.generateSection}>
            <TouchableOpacity
              style={styles.generateButton}
              onPress={handleGenerate}
              activeOpacity={0.8}
              testID="generate-button"
            >
              <Send color={Colors.white} size={18} />
              <Text style={styles.generateText}>Générer le document</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: Colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  multilineInput: {
    minHeight: 100,
    paddingTop: 14,
  },
  toneGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  toneCard: {
    width: "48%" as const,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    flexGrow: 1,
    flexBasis: "45%" as const,
  },
  toneCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "08",
  },
  toneCheck: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  toneLabel: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 2,
  },
  toneLabelSelected: {
    color: Colors.primary,
  },
  toneDesc: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  toneDescSelected: {
    color: Colors.primaryLight,
  },
  generateSection: {
    padding: 20,
    paddingTop: 28,
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 10,
  },
  generateText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.white,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: "center",
    marginTop: 40,
  },
});
