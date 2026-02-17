import React, { memo, useCallback, useMemo, useRef } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ChevronRight,
  Clock,
  FileText,
  Inbox,
  Search,
  Trash2,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { GeneratedDocument } from "@/constants/types";
import { useDocuments } from "@/context/DocumentContext";

/* ── helpers ──────────────────────────────────────────────── */

function formatRelativeDate(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHrs = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHrs < 24) return `Il y a ${diffHrs}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function formatFullDate(isoDate: string): string {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ── category accent color ────────────────────────────────── */

const CATEGORY_ACCENTS: Record<string, string> = {
  travail: "#E67E22",
  logement: "#3498DB",
  banque: "#2ECC71",
  famille: "#E74C3C",
  justice: "#9B59B6",
  transport: "#1ABC9C",
  impots: "#F39C12",
  divers: "#95A5A6",
};

function getCategoryAccent(categoryTitle: string): string {
  const key = categoryTitle.toLowerCase().trim();
  for (const [k, v] of Object.entries(CATEGORY_ACCENTS)) {
    if (key.includes(k)) return v;
  }
  return Colors.accent;
}

/* ── History Item Card ────────────────────────────────────── */

interface HistoryItemProps {
  item: GeneratedDocument;
  onOpen: (doc: GeneratedDocument) => void;
  onDelete: (doc: GeneratedDocument) => void;
  index: number;
}

const HistoryItem = memo(function HistoryItem({
  item,
  onOpen,
  onDelete,
  index,
}: HistoryItemProps) {
  const accentColor = getCategoryAccent(item.categoryTitle);
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={() => onOpen(item)}
        onLongPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onDelete(item);
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`Ouvrir ${item.templateTitle}`}
        accessibilityHint="Appui long pour supprimer"
        testID={`history-${item.id}`}
      >
        <View style={styles.card}>
          {/* Accent stripe */}
          <View style={[styles.accentStripe, { backgroundColor: accentColor }]} />

          <View style={styles.cardInner}>
            {/* Icon */}
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: `${accentColor}18` },
              ]}
            >
              <FileText color={accentColor} size={20} />
            </View>

            {/* Content */}
            <View style={styles.cardContent}>
              <Text numberOfLines={1} style={styles.cardTitle}>
                {item.templateTitle}
              </Text>
              <View style={styles.metaRow}>
                <View style={[styles.categoryPill, { backgroundColor: `${accentColor}18` }]}>
                  <Text style={[styles.categoryPillText, { color: accentColor }]}>
                    {item.categoryTitle}
                  </Text>
                </View>
                <View style={styles.dateChip}>
                  <Clock color={Colors.textMuted} size={10} />
                  <Text style={styles.dateText}>
                    {formatRelativeDate(item.createdAt)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Chevron and Delete */}
            <View style={styles.cardActions}>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onDelete(item);
                }}
                style={({ pressed }) => [styles.deleteButton, pressed && { opacity: 0.6 }]}
                hitSlop={12}
              >
                <Trash2 color={Colors.error} size={18} />
              </Pressable>

              <ChevronRight color={Colors.textMuted} size={16} />
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

/* ── History Screen ───────────────────────────────────────── */

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { history, removeDocument, clearHistory, isLoading } = useDocuments();

  const handleOpen = useCallback(
    (doc: GeneratedDocument) => {
      router.push({
        pathname: "/history/detail",
        params: { documentId: doc.id },
      });
    },
    [router]
  );

  const handleDelete = useCallback(
    (doc: GeneratedDocument) => {
      Alert.alert("Supprimer", `Supprimer « ${doc.templateTitle} » ?`, [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            removeDocument(doc.id);
          },
        },
      ]);
    },
    [removeDocument]
  );

  const handleClearAll = useCallback(() => {
    Alert.alert("Tout supprimer", "Voulez-vous supprimer tout l'historique ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer tout",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          clearHistory();
        },
      },
    ]);
  }, [clearHistory]);

  const renderItem = useCallback(
    ({ item, index }: { item: GeneratedDocument; index: number }) => (
      <HistoryItem
        item={item}
        onOpen={handleOpen}
        onDelete={handleDelete}
        index={index}
      />
    ),
    [handleDelete, handleOpen]
  );

  /* ── Loading ── */
  if (isLoading) {
    return (
      <LinearGradient
        colors={["#FDF8F3", "#FFF5EC", "#FDF8F3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.centerContainer}
      >
        <Clock color={Colors.textMuted} size={34} />
        <Text style={styles.emptyTitle}>Chargement…</Text>
      </LinearGradient>
    );
  }

  /* ── Empty state ── */
  if (history.length === 0) {
    return (
      <LinearGradient
        colors={["#FDF8F3", "#FFF5EC", "#FDF8F3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.centerContainer}
      >
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconWrap}>
            <Inbox color={Colors.accent} size={40} />
          </View>
          <Text style={styles.emptyTitle}>Aucun document</Text>
          <Text style={styles.emptyDesc}>
            Créez votre premier courrier et il apparaîtra ici.
          </Text>
        </View>
      </LinearGradient>
    );
  }

  /* ── List ── */
  return (
    <LinearGradient
      colors={["#FDF8F3", "#FFF5EC", "#FDF8F3"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Mes Courriers</Text>
              <Text style={styles.headerSubtitle}>
                {history.length} document{history.length > 1 ? "s" : ""} généré
                {history.length > 1 ? "s" : ""}
              </Text>
            </View>
            {history.length > 0 && (
              <Pressable
                onPress={handleClearAll}
                style={({ pressed }) => [
                  styles.clearButton,
                  pressed && { opacity: 0.7 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Supprimer tout"
              >
                <Trash2 color={Colors.error} size={16} />
                <Text style={styles.clearButtonText}>Tout effacer</Text>
              </Pressable>
            )}
          </View>
        }
        renderItem={renderItem}
        initialNumToRender={10}
        maxToRenderPerBatch={12}
        windowSize={7}
        removeClippedSubviews
      />
    </LinearGradient>
  );
}

/* ── Styles ────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 10,
  },

  /* Header */
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
  },
  clearButtonText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: "700",
  },

  /* Card */
  card: {
    borderRadius: 16,
    backgroundColor: "rgba(255,252,248,0.92)",
    borderWidth: 1,
    borderColor: "rgba(230,200,170,0.28)",
    overflow: "hidden",
    shadowColor: "#8B7355",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  accentStripe: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    paddingLeft: 16,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  categoryPill: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  categoryPillText: {
    fontSize: 10.5,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  dateChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  dateText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  cardActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  deleteButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
  },

  /* Empty */
  emptyCard: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 40,
    borderRadius: 24,
    backgroundColor: "rgba(255,252,248,0.88)",
    borderWidth: 1,
    borderColor: "rgba(230,200,170,0.25)",
    shadowColor: "#8B7355",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "rgba(230, 126, 34, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: "800",
    marginTop: 8,
  },
  emptyDesc: {
    marginTop: 8,
    textAlign: "center",
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
