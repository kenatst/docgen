import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ChevronRight, FileText } from "lucide-react-native";
import Colors from "@/constants/colors";
import { CATEGORIES } from "@/constants/templates";

export default function CategoryScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const router = useRouter();
  const category = CATEGORIES.find((item) => item.id === categoryId);

  if (!category) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Categorie introuvable</Text>
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
      <Stack.Screen options={{ title: category.title }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <BlurView intensity={30} tint="light" style={styles.banner}>
          <LinearGradient
            colors={[`${category.color}7F`, `${category.color}2B`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bannerTint}
          />
          <Text style={styles.bannerTitle}>{category.title}</Text>
          <Text style={styles.bannerDesc}>{category.description}</Text>
          <Text style={styles.bannerCount}>{category.templates.length} modeles disponibles</Text>
        </BlurView>

        <View style={styles.templateList}>
          {category.templates.map((template) => (
            <TouchableOpacity
              key={template.id}
              style={styles.templateTouch}
              activeOpacity={0.82}
              onPress={() => router.push({ pathname: "/form", params: { templateId: template.id } })}
              testID={`template-${template.id}`}
              accessibilityRole="button"
              accessibilityLabel={`Ouvrir le modele ${template.title}`}
              accessibilityHint="Accede au formulaire de redaction"
            >
              <BlurView intensity={24} tint="light" style={styles.templateCard}>
                <View style={styles.templateIcon}>
                  <FileText color={Colors.accent} size={18} />
                </View>
                <View style={styles.templateBody}>
                  <Text style={styles.templateTitle}>{template.title}</Text>
                  <Text numberOfLines={2} style={styles.templateDesc}>
                    {template.description}
                  </Text>
                </View>
                <ChevronRight color={Colors.textMuted} size={16} />
              </BlurView>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 30,
  },
  banner: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(230,200,170,0.30)",
    overflow: "hidden",
    backgroundColor: "rgba(255,250,245,0.55)",
  },
  bannerTint: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerTitle: {
    color: Colors.primary,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 6,
  },
  bannerDesc: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  bannerCount: {
    marginTop: 9,
    color: Colors.primaryDark,
    fontWeight: "700",
    fontSize: 12,
  },
  templateList: {
    gap: 8,
  },
  templateTouch: {
    borderRadius: 16,
    overflow: "hidden",
  },
  templateCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(230,200,170,0.30)",
    padding: 13,
    backgroundColor: "rgba(255,250,245,0.50)",
    overflow: "hidden",
  },
  templateIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(230, 126, 34, 0.18)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  templateBody: {
    flex: 1,
  },
  templateTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 2,
  },
  templateDesc: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: Colors.error,
    fontSize: 16,
    fontWeight: "700",
  },
});
