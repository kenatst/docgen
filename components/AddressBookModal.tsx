import React, { useCallback, useState } from "react";
import {
    Alert,
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { Plus, Trash2, UserRound, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { SavedContact, useAddressBook } from "@/context/AddressBookContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
    visible: boolean;
    onClose: () => void;
    onSelect: (contact: SavedContact) => void;
}

export function AddressBookModal({ visible, onClose, onSelect }: Props) {
    const insets = useSafeAreaInsets();
    const { contacts, addContact, removeContact } = useAddressBook();
    const [addMode, setAddMode] = useState(false);
    const [form, setForm] = useState({ label: "", nom: "", adresse: "", email: "", tel: "" });

    const resetForm = () => {
        setForm({ label: "", nom: "", adresse: "", email: "", tel: "" });
        setAddMode(false);
    };

    const handleAdd = useCallback(() => {
        if (!form.nom.trim() || !form.adresse.trim()) {
            Alert.alert("Champs requis", "Le nom et l'adresse sont obligatoires.");
            return;
        }
        addContact({
            label: form.label.trim() || form.nom.trim(),
            nom: form.nom.trim(),
            adresse: form.adresse.trim(),
            email: form.email.trim() || undefined,
            tel: form.tel.trim() || undefined,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        resetForm();
    }, [form, addContact]);

    const handleDelete = useCallback(
        (id: string, label: string) => {
            Alert.alert("Supprimer", `Supprimer "${label}" ?`, [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Supprimer",
                    style: "destructive",
                    onPress: () => {
                        removeContact(id);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    },
                },
            ]);
        },
        [removeContact]
    );

    const renderItem = ({ item }: { item: SavedContact }) => (
        <Pressable
            style={({ pressed }) => [styles.contactCard, pressed && { opacity: 0.85 }]}
            onPress={() => {
                onSelect(item);
                onClose();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
        >
            <View style={styles.contactIconWrap}>
                <UserRound color={Colors.accent} size={18} />
            </View>
            <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>{item.label}</Text>
                <Text style={styles.contactDetail} numberOfLines={1}>
                    {item.nom} — {item.adresse.slice(0, 40)}
                </Text>
            </View>
            <Pressable
                onPress={() => handleDelete(item.id, item.label)}
                hitSlop={12}
                style={styles.deleteBtn}
            >
                <Trash2 color={Colors.error} size={16} />
            </Pressable>
        </Pressable>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.container, { paddingTop: insets.top }]}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Carnet d'adresses</Text>
                    <Pressable
                        onPress={() => { resetForm(); onClose(); }}
                        style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.7 }]}
                        hitSlop={12}
                    >
                        <X color={Colors.text} size={20} />
                    </Pressable>
                </View>

                {/* Add button */}
                {!addMode ? (
                    <Pressable
                        style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.85 }]}
                        onPress={() => setAddMode(true)}
                    >
                        <Plus color={Colors.white} size={18} />
                        <Text style={styles.addButtonText}>Ajouter un contact</Text>
                    </Pressable>
                ) : (
                    <View style={styles.addForm}>
                        <TextInput
                            style={styles.input}
                            placeholder="Libellé (ex: Propriétaire)"
                            placeholderTextColor={Colors.textMuted}
                            value={form.label}
                            onChangeText={(v) => setForm((p) => ({ ...p, label: v }))}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Nom complet *"
                            placeholderTextColor={Colors.textMuted}
                            value={form.nom}
                            onChangeText={(v) => setForm((p) => ({ ...p, nom: v }))}
                        />
                        <TextInput
                            style={[styles.input, { minHeight: 60 }]}
                            placeholder="Adresse complète *"
                            placeholderTextColor={Colors.textMuted}
                            value={form.adresse}
                            onChangeText={(v) => setForm((p) => ({ ...p, adresse: v }))}
                            multiline
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor={Colors.textMuted}
                            value={form.email}
                            onChangeText={(v) => setForm((p) => ({ ...p, email: v }))}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Téléphone"
                            placeholderTextColor={Colors.textMuted}
                            value={form.tel}
                            onChangeText={(v) => setForm((p) => ({ ...p, tel: v }))}
                            keyboardType="phone-pad"
                        />
                        <View style={styles.addFormActions}>
                            <Pressable
                                style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.7 }]}
                                onPress={resetForm}
                            >
                                <Text style={styles.cancelText}>Annuler</Text>
                            </Pressable>
                            <Pressable
                                style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
                                onPress={handleAdd}
                            >
                                <Text style={styles.saveText}>Enregistrer</Text>
                            </Pressable>
                        </View>
                    </View>
                )}

                {/* Contacts list */}
                <FlatList
                    data={contacts}
                    keyExtractor={(c) => c.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyWrap}>
                            <UserRound color={Colors.textMuted} size={32} />
                            <Text style={styles.emptyText}>Aucun contact enregistré</Text>
                            <Text style={styles.emptySubtext}>
                                Ajoute tes destinataires fréquents pour les réutiliser rapidement.
                            </Text>
                        </View>
                    }
                />
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f9f6f3",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "rgba(200,180,150,0.3)",
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: "800",
        color: Colors.text,
    },
    closeButton: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: "rgba(230,200,170,0.2)",
        alignItems: "center",
        justifyContent: "center",
    },
    addButton: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        backgroundColor: Colors.accent,
        marginHorizontal: 16,
        marginTop: 12,
        padding: 14,
        borderRadius: 14,
        justifyContent: "center",
    },
    addButtonText: {
        color: Colors.white,
        fontWeight: "700",
        fontSize: 14,
    },
    addForm: {
        margin: 16,
        gap: 8,
        padding: 14,
        borderRadius: 14,
        backgroundColor: "rgba(255,255,255,0.8)",
        borderWidth: 1,
        borderColor: "rgba(230,200,170,0.3)",
    },
    input: {
        borderWidth: 1,
        borderColor: "rgba(200,180,150,0.35)",
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: Colors.text,
        backgroundColor: "rgba(255,255,255,0.9)",
    },
    addFormActions: {
        flexDirection: "row",
        gap: 10,
        marginTop: 4,
    },
    cancelBtn: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        alignItems: "center",
        backgroundColor: "rgba(200,180,150,0.15)",
    },
    cancelText: {
        color: Colors.textSecondary,
        fontWeight: "600",
        fontSize: 14,
    },
    saveBtn: {
        flex: 2,
        padding: 12,
        borderRadius: 10,
        alignItems: "center",
        backgroundColor: Colors.accent,
    },
    saveText: {
        color: Colors.white,
        fontWeight: "700",
        fontSize: 14,
    },
    listContent: {
        padding: 16,
        gap: 8,
    },
    contactCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.85)",
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: "rgba(230,200,170,0.25)",
        gap: 12,
    },
    contactIconWrap: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: "rgba(230,176,100,0.12)",
        alignItems: "center",
        justifyContent: "center",
    },
    contactInfo: {
        flex: 1,
        gap: 2,
    },
    contactLabel: {
        fontSize: 15,
        fontWeight: "700",
        color: Colors.text,
    },
    contactDetail: {
        fontSize: 12,
        color: Colors.textMuted,
    },
    deleteBtn: {
        padding: 6,
    },
    emptyWrap: {
        alignItems: "center",
        paddingTop: 60,
        gap: 8,
    },
    emptyText: {
        fontSize: 15,
        fontWeight: "700",
        color: Colors.textSecondary,
        marginTop: 8,
    },
    emptySubtext: {
        fontSize: 13,
        color: Colors.textMuted,
        textAlign: "center",
        maxWidth: 260,
    },
});
