import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { FileText, Trash2, Clock, ChevronRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useDocuments } from "@/context/DocumentContext";
import { GeneratedDocument } from "@/constants/types";

function formatDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoDate;
  }
}

export default function HistoryScreen() {
  const router = useRouter();
  const { history, removeDocument, clearHistory } = useDocuments();

  const handlePress = useCallback(
    (doc: GeneratedDocument) => {
      router.push({ pathname: "/history/detail", params: { documentId: doc.id } });
    },
    [router]
  );

  const handleDelete = useCallback(
    (doc: GeneratedDocument) => {
      Alert.alert("Supprimer", `Supprimer "${doc.templateTitle}" ?`, [
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
    Alert.alert(
      "Tout supprimer",
      "Voulez-vous supprimer tout l'historique ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer tout",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            clearHistory();
          },
        },
      ]
    );
  }, [clearHistory]);

  const renderItem = useCallback(
    ({ item }: { item: GeneratedDocument }) => (
      <TouchableOpacity
        style={styles.historyCard}
        onPress={() => handlePress(item)}
        onLongPress={() => handleDelete(item)}
        activeOpacity={0.7}
        testID={`history-${item.id}`}
      >
        <View style={styles.cardIcon}>
          <FileText color={Colors.primary} size={18} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.templateTitle}
          </Text>
          <Text style={styles.cardCategory}>{item.categoryTitle}</Text>
          <View style={styles.dateRow}>
            <Clock color={Colors.textMuted} size={11} />
            <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        <ChevronRight color={Colors.textMuted} size={16} />
      </TouchableOpacity>
    ),
    [handlePress, handleDelete]
  );

  const keyExtractor = useCallback((item: GeneratedDocument) => item.id, []);

  if (history.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Clock color={Colors.textMuted} size={40} />
        </View>
        <Text style={styles.emptyTitle}>Aucun document</Text>
        <Text style={styles.emptyDesc}>
          Vos documents générés apparaîtront ici
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={history}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderText}>
              {history.length} document{history.length > 1 ? "s" : ""}
            </Text>
            <TouchableOpacity onPress={handleClearAll} activeOpacity={0.7}>
              <Trash2 color={Colors.error} size={18} />
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: 20,
    paddingBottom: 32,
    gap: 8,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  listHeaderText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.textMuted,
  },
  historyCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.overlay,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: Colors.text,
  },
  cardCategory: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  cardDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.overlay,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: "center",
  },
});
