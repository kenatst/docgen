import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";

const STORAGE_KEY = "docgen_address_book_v1";

export interface SavedContact {
    id: string;
    label: string;
    nom: string;
    adresse: string;
    email?: string;
    tel?: string;
}

function createId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export const [AddressBookProvider, useAddressBook] = createContextHook(() => {
    const [contacts, setContacts] = useState<SavedContact[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const writeQueue = useRef<Promise<void>>(Promise.resolve());

    const persist = useCallback((next: SavedContact[]) => {
        writeQueue.current = writeQueue.current
            .then(async () => {
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            })
            .catch((err) => console.error("Address book persist failed", err));
    }, []);

    useEffect(() => {
        let alive = true;
        AsyncStorage.getItem(STORAGE_KEY)
            .then((raw) => {
                if (!alive) return;
                if (raw) {
                    try {
                        const parsed = JSON.parse(raw);
                        if (Array.isArray(parsed)) setContacts(parsed);
                    } catch { /* ignore */ }
                }
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
        return () => { alive = false; };
    }, []);

    const addContact = useCallback(
        (contact: Omit<SavedContact, "id">) => {
            const entry = { ...contact, id: createId() };
            setContacts((prev) => {
                const next = [entry, ...prev];
                persist(next);
                return next;
            });
            return entry;
        },
        [persist]
    );

    const removeContact = useCallback(
        (id: string) => {
            setContacts((prev) => {
                const next = prev.filter((c) => c.id !== id);
                persist(next);
                return next;
            });
        },
        [persist]
    );

    const updateContact = useCallback(
        (id: string, updates: Partial<Omit<SavedContact, "id">>) => {
            setContacts((prev) => {
                const next = prev.map((c) => (c.id === id ? { ...c, ...updates } : c));
                persist(next);
                return next;
            });
        },
        [persist]
    );

    return { contacts, isLoading, addContact, removeContact, updateContact };
});
