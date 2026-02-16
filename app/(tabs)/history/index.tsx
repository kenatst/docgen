import React, { memo, useCallback, useMemo } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChevronRight, Clock, FileText, Trash2 } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { GeneratedDocument } from "@/constants/types";
import { useDocuments } from "@/context/DocumentContext";

function formatDate(isoDate: string): string {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return isoDate;
  }
  return parsed.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface HistoryItemProps {
  item: GeneratedDocument;
  onOpen: (doc: GeneratedDocument) => void;
  onDelete: (doc: GeneratedDocument) => void;
}

const HistoryItem = memo(function HistoryItem({ item, onOpen, onDelete }: HistoryItemProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.82}
      style={styles.cardTouch}
      onPress={() => onOpen(item)}
      onLongPress={() => onDelete(item)}
      accessibilityRole="button"
      accessibilityLabel={`Ouvrir ${item.templateTitle}`}
      accessibilityHint="Appui long pour supprimer ce document"
      testID={`history-${item.id}`}
    >
      <BlurView intensity={24} tint="light" style={styles.card}>
        <View style={styles.iconWrap}>
          <FileText color={Colors.primary} size={18} />
        </View>
        <View style={styles.info}>
          <Text numberOfLines={1} style={styles.title}>
            {item.templateTitle}
          </Text>
          <Text numberOfLines={1} style={styles.category}>
            {item.categoryTitle}
          </Text>
          <View style={styles.dateRow}>
            <Clock color={Colors.textMuted} size={11} />
            <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        <ChevronRight color={Colors.textMuted} size={16} />
      </BlurView>
    </TouchableOpacity>
  );
});

export default function HistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { history, removeDocument, clearHistory, isLoading } = useDocuments();

  const handleOpen = useCallback(
    (doc: GeneratedDocument) => {
      router.push({ pathname: "/history/detail", params: { documentId: doc.id } });
    },
    [router]
  );

  const handleDelete = useCallback(
    (doc: GeneratedDocument) => {
      Alert.alert("Supprimer", `Supprimer \"${doc.templateTitle}\" ?`, [
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

  const header = useMemo(
    () => (
      <BlurView intensity={30} tint="light" style={styles.headerCard}>
        <Text style={styles.headerTitle}>
          {history.length} document{history.length > 1 ? "s" : ""}
        </Text>
        <TouchableOpacity
          onPress={handleClearAll}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Supprimer tout l'historique"
        >
          <Trash2 color={Colors.error} size={18} />
        </TouchableOpacity>
      </BlurView>
    ),
    [handleClearAll, history.length]
  );

  const renderItem = useCallback(
    ({ item }: { item: GeneratedDocument }) => (
      <HistoryItem item={item} onOpen={handleOpen} onDelete={handleDelete} />
    ),
    [handleDelete, handleOpen]
  );

  if (isLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Clock color={Colors.textMuted} size={34} />
        <Text style={styles.emptyTitle}>Chargement...</Text>
      </View>
    );
  }

  if (history.length === 0) {
    return (
      <LinearGradient
        colors={["#FFF6F3", "#F2F8FF", "#F5FFF7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.emptyContainer}
      >
        <BlurView intensity={25} tint="light" style={styles.emptyCard}>
          <Clock color={Colors.textMuted} size={40} />
          <Text style={styles.emptyTitle}>Aucun document</Text>
          <Text style={styles.emptyDesc}>Vos documents exportables en PDF apparaitront ici.</Text>
        </BlurView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#FFF6F3", "#F2F8FF", "#F5FFF7"]}
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
        ListHeaderComponent={header}
        renderItem={renderItem}
        initialNumToRender={10}
        maxToRenderPerBatch={12}
        windowSize={7}
        removeClippedSubviews
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  headerCard: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.75)",
    backgroundColor: "rgba(255,255,255,0.3)",
    overflow: "hidden",
    marginBottom: 2,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: "700",
  },
  cardTouch: {
    borderRadius: 16,
    overflow: "hidden",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.78)",
    backgroundColor: "rgba(255,255,255,0.3)",
    overflow: "hidden",
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(116, 169, 255, 0.25)",
    marginRight: 10,
  },
  info: {
    flex: 1,
  },
  title: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  category: {
    marginTop: 2,
    color: Colors.textSecondary,
    fontSize: 12,
  },
  dateRow: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dateText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: Colors.background,
  },
  emptyCard: {
    borderRadius: 18,
    padding: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.75)",
    backgroundColor: "rgba(255,255,255,0.32)",
    overflow: "hidden",
  },
  emptyTitle: {
    marginTop: 14,
    color: Colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  emptyDesc: {
    marginTop: 8,
    textAlign: "center",
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
});
