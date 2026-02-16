import React, { useEffect, useRef } from "react";
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AlertTriangle,
  Briefcase,
  ChevronRight,
  FileCheck,
  FileText,
  Home,
  PenTool,
  Wallet,
  Car,
  Scale,
  Scissors,
  Shield,
  Users,
} from "lucide-react-native";
import Colors from "@/constants/colors";
import { CATEGORIES } from "@/constants/templates";

const ICON_MAP: Record<string, React.ComponentType<{ color: string; size: number }>> = {
  scissors: Scissors,
  home: Home,
  briefcase: Briefcase,
  "file-text": FileText,
  scale: Scale,
  "file-check": FileCheck,
  users: Users,
  shield: Shield,
  wallet: Wallet,
  car: Car,
  "alert-triangle": AlertTriangle,
};

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const yAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 520,
        useNativeDriver: true,
      }),
      Animated.timing(yAnim, {
        toValue: 0,
        duration: 520,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, yAnim]);

  return (
    <LinearGradient
      colors={["#FFF6F3", "#F2F8FF", "#F5FFF7"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 14 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[styles.headerWrap, { opacity: fadeAnim, transform: [{ translateY: yAnim }] }]}
        >
          <BlurView intensity={30} tint="light" style={styles.headerCard}>
            <View style={styles.logoRow}>
              <View style={styles.logoBubble}>
                <PenTool color={Colors.white} size={20} />
              </View>
              <View>
                <Text style={styles.logoText}>DocGen Studio</Text>
                <Text style={styles.subtitle}>Courriers utiles, clairs, exportables en PDF</Text>
              </View>
            </View>
          </BlurView>
        </Animated.View>

        <View style={styles.grid}>
          {CATEGORIES.map((category, index) => {
            const Icon = ICON_MAP[category.icon] ?? FileText;
            return (
              <TouchableOpacity
                key={category.id}
                activeOpacity={0.82}
                testID={`category-${category.id}`}
                onPress={() =>
                  router.push({ pathname: "/category", params: { categoryId: category.id } })
                }
                style={styles.cardTouch}
                accessibilityRole="button"
                accessibilityLabel={`Ouvrir la categorie ${category.title}`}
                accessibilityHint={`${category.templates.length} modeles disponibles`}
              >
                <BlurView intensity={22} tint="light" style={styles.card}>
                  <LinearGradient
                    colors={[`${category.color}66`, `${category.color}26`]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cardTint}
                  />
                  <View style={styles.cardTop}>
                    <View style={[styles.iconWrap, { backgroundColor: `${category.color}AA` }]}>
                      <Icon color={Colors.primaryDark} size={19} />
                    </View>
                    <ChevronRight color={Colors.textMuted} size={16} />
                  </View>
                  <Text style={styles.cardTitle}>{category.title}</Text>
                  <Text style={styles.cardDesc}>{category.description}</Text>
                  <Text style={styles.cardCount}>
                    {category.templates.length} modele{category.templates.length > 1 ? "s" : ""}
                  </Text>
                </BlurView>
              </TouchableOpacity>
            );
          })}
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
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  headerWrap: {
    marginBottom: 14,
  },
  headerCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
    backgroundColor: "rgba(255,255,255,0.28)",
    overflow: "hidden",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoBubble: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "#7EA7FF",
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    fontSize: 24,
    color: Colors.primary,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 3,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  cardTouch: {
    width: "48%",
    flexGrow: 1,
    flexBasis: "47%",
  },
  card: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.76)",
    backgroundColor: "rgba(255,255,255,0.28)",
    overflow: "hidden",
    minHeight: 156,
  },
  cardTint: {
    ...StyleSheet.absoluteFillObject,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4,
  },
  cardDesc: {
    color: Colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    minHeight: 35,
  },
  cardCount: {
    marginTop: 8,
    color: Colors.primary,
    fontSize: 11,
    fontWeight: "700",
  },
});
