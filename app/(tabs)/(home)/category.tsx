import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { ChevronRight, FileText } from "lucide-react-native";
import Colors from "@/constants/colors";
import { CATEGORIES } from "@/constants/templates";

export default function CategoryScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const router = useRouter();

  const category = CATEGORIES.find((c) => c.id === categoryId);

  if (!category) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Catégorie introuvable</Text>
      </View>
    );
  }

  const handleTemplatePress = (templateId: string) => {
    router.push({ pathname: "/form", params: { templateId } });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: category.title }} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.headerBanner, { backgroundColor: category.color + "10" }]}>
          <Text style={[styles.headerTitle, { color: category.color }]}>
            {category.title}
          </Text>
          <Text style={styles.headerDesc}>{category.description}</Text>
        </View>

        <View style={styles.templatesList}>
          {category.templates.map((template) => (
            <TouchableOpacity
              key={template.id}
              style={styles.templateCard}
              onPress={() => handleTemplatePress(template.id)}
              activeOpacity={0.7}
              testID={`template-${template.id}`}
            >
              <View style={styles.templateIcon}>
                <FileText color={Colors.primary} size={18} />
              </View>
              <Text style={styles.templateTitle}>{template.title}</Text>
              <ChevronRight color={Colors.textMuted} size={16} />
            </TouchableOpacity>
          ))}
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
    paddingBottom: 32,
  },
  headerBanner: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800" as const,
    marginBottom: 6,
  },
  headerDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  templatesList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  templateCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  templateIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.overlay,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  templateTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: "center",
    marginTop: 40,
  },
});
