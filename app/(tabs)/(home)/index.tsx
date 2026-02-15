import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Scissors,
  AlertTriangle,
  FileCheck,
  Briefcase,
  FileText,
  Layers,
  ChevronRight,
  PenTool,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { CATEGORIES } from "@/constants/templates";

const ICON_MAP: Record<string, React.ComponentType<{ color: string; size: number }>> = {
  scissors: Scissors,
  "alert-triangle": AlertTriangle,
  "file-check": FileCheck,
  briefcase: Briefcase,
  "file-text": FileText,
  layers: Layers,
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const handleCategoryPress = (categoryId: string) => {
    router.push({ pathname: "/category", params: { categoryId } });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.logoRow}>
            <View style={styles.logoBadge}>
              <PenTool color={Colors.white} size={20} />
            </View>
            <Text style={styles.logoText}>DocGen</Text>
          </View>
          <Text style={styles.subtitle}>
            Générez vos documents administratifs en quelques secondes
          </Text>
        </Animated.View>

        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Choisissez une catégorie</Text>
          {CATEGORIES.map((category, index) => {
            const IconComponent = ICON_MAP[category.icon] || FileText;
            return (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => handleCategoryPress(category.id)}
                activeOpacity={0.7}
                testID={`category-${category.id}`}
              >
                <View style={[styles.categoryIconWrap, { backgroundColor: category.color + "14" }]}>
                  <IconComponent color={category.color} size={22} />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryTitle}>{category.title}</Text>
                  <Text style={styles.categoryDesc}>{category.description}</Text>
                  <Text style={styles.categoryCount}>
                    {category.templates.length} modèle{category.templates.length > 1 ? "s" : ""}
                  </Text>
                </View>
                <ChevronRight color={Colors.textMuted} size={18} />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Documents conformes aux usages administratifs français
          </Text>
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
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 28,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  logoText: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginTop: 4,
  },
  categoriesSection: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.textMuted,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginBottom: 6,
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  categoryIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 2,
  },
  categoryDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  categoryCount: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
    fontWeight: "600" as const,
  },
  footer: {
    marginTop: 32,
    alignItems: "center",
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: "center" as const,
    lineHeight: 18,
  },
});
