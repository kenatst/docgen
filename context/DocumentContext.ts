import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { GeneratedDocument, ToneType } from "@/constants/types";
import { decryptPayload, encryptPayload } from "@/utils/encryptedStorage";

const LEGACY_STORAGE_KEY = "docgen_history";
const SECURE_STORAGE_KEY = "docgen_secure_history_v1";
const SECURE_STAGING_KEY = "docgen_secure_history_v1_staging";
const RETENTION_DAYS = 365;
const MAX_DOCUMENTS = 300;

interface PersistedHistoryPayload {
  version: number;
  savedAt: string;
  history: GeneratedDocument[];
}

function normalizeTone(value: unknown): ToneType {
  if (value === "tres_poli" || value === "neutre" || value === "ferme" || value === "tres_ferme") {
    return value;
  }
  return "neutre";
}

function normalizeIsoDate(value: unknown): string {
  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) {
    return value;
  }
  return new Date().toISOString();
}

function normalizeDocument(input: unknown): GeneratedDocument | null {
  if (!input || typeof input !== "object") return null;
  const item = input as Partial<GeneratedDocument> & {
    formData?: Record<string, unknown>;
  };

  if (typeof item.content !== "string") return null;

  const id = typeof item.id === "string" ? item.id : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const values =
    item.values && typeof item.values === "object"
      ? (item.values as Record<string, string>)
      : item.formData && typeof item.formData === "object"
        ? Object.fromEntries(
            Object.entries(item.formData).map(([key, value]) => [key, typeof value === "string" ? value : String(value ?? "")])
          )
        : {};

  const createdAt = normalizeIsoDate(item.createdAt);

  return {
    id,
    templateId: typeof item.templateId === "string" ? item.templateId : "legacy-template",
    templateVersion: typeof item.templateVersion === "string" ? item.templateVersion : "legacy",
    templateTitle: typeof item.templateTitle === "string" ? item.templateTitle : "Document",
    categoryTitle: typeof item.categoryTitle === "string" ? item.categoryTitle : "Archive",
    content: item.content,
    createdAt,
    updatedAt: normalizeIsoDate(item.updatedAt ?? createdAt),
    values,
    tone: normalizeTone(item.tone),
    signatureDataUri:
      typeof (item as { signatureDataUri?: unknown }).signatureDataUri === "string"
        ? (item as { signatureDataUri: string }).signatureDataUri
        : undefined,
  };
}

function applyRetentionPolicy(docs: GeneratedDocument[]): GeneratedDocument[] {
  const now = Date.now();
  const cutoff = now - RETENTION_DAYS * 24 * 60 * 60 * 1000;

  const deduped = new Map<string, GeneratedDocument>();

  for (const doc of docs) {
    const normalized = normalizeDocument(doc);
    if (!normalized) continue;

    const createdAt = Date.parse(normalized.createdAt);
    if (Number.isNaN(createdAt) || createdAt < cutoff) {
      continue;
    }

    deduped.set(normalized.id, normalized);
  }

  return Array.from(deduped.values())
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, MAX_DOCUMENTS);
}

async function readSecureHistory(): Promise<GeneratedDocument[] | null> {
  const encryptedPrimary = await AsyncStorage.getItem(SECURE_STORAGE_KEY);
  const encryptedStaging = await AsyncStorage.getItem(SECURE_STAGING_KEY);

  const decodeHistory = async (snapshot: string | null): Promise<GeneratedDocument[] | null> => {
    if (!snapshot) return null;
    let payload: PersistedHistoryPayload | null = null;
    try {
      payload = await decryptPayload<PersistedHistoryPayload>(snapshot);
    } catch (error) {
      console.error("Secure history decrypt failed", error);
      return null;
    }

    if (!payload || !Array.isArray(payload.history)) {
      return null;
    }
    return applyRetentionPolicy(payload.history);
  };

  const primary = await decodeHistory(encryptedPrimary);
  if (primary) {
    return primary;
  }

  return decodeHistory(encryptedStaging);
}

async function readLegacyHistory(): Promise<GeneratedDocument[]> {
  const legacy = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
  if (!legacy) {
    return [];
  }

  try {
    const parsed = JSON.parse(legacy);
    if (!Array.isArray(parsed)) {
      return [];
    }
    const normalized = parsed
      .map((item) => normalizeDocument(item))
      .filter((item): item is GeneratedDocument => Boolean(item));
    return applyRetentionPolicy(normalized);
  } catch {
    return [];
  }
}

export const [DocumentProvider, useDocuments] = createContextHook(() => {
  const [history, setHistory] = useState<GeneratedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());

  const persistSnapshot = useCallback((nextHistory: GeneratedDocument[]) => {
    writeQueueRef.current = writeQueueRef.current
      .then(async () => {
        const payload: PersistedHistoryPayload = {
          version: 1,
          savedAt: new Date().toISOString(),
          history: applyRetentionPolicy(nextHistory),
        };

        const encrypted = await encryptPayload(payload);

        // Two-step commit: staging then active key.
        await AsyncStorage.setItem(SECURE_STAGING_KEY, encrypted);
        await AsyncStorage.setItem(SECURE_STORAGE_KEY, encrypted);
        await AsyncStorage.removeItem(SECURE_STAGING_KEY);
        await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
      })
      .catch((error) => {
        console.error("Document persistence failed", error);
      });
  }, []);

  const runTransaction = useCallback(
    (updater: (current: GeneratedDocument[]) => GeneratedDocument[]) => {
      setHistory((current) => {
        const next = applyRetentionPolicy(updater(current));
        persistSnapshot(next);
        return next;
      });
    },
    [persistSnapshot]
  );

  useEffect(() => {
    let alive = true;

    const load = async () => {
      let secure: GeneratedDocument[] | null = null;
      let fromLegacy: GeneratedDocument[] = [];
      try {
        secure = await readSecureHistory();
      } catch (error) {
        console.error("Secure history load failed", error);
      }

      if (!secure) {
        try {
          fromLegacy = await readLegacyHistory();
        } catch (error) {
          console.error("Legacy history load failed", error);
        }
      }

      const initial = applyRetentionPolicy(secure ?? fromLegacy);

      if (!alive) return;
      setHistory(initial);
      setIsLoading(false);
      persistSnapshot(initial);
    };

    load();

    return () => {
      alive = false;
    };
  }, [persistSnapshot]);

  const addDocument = useCallback(
    (document: GeneratedDocument) => {
      runTransaction((current) => [document, ...current]);
    },
    [runTransaction]
  );

  const removeDocument = useCallback(
    (id: string) => {
      runTransaction((current) => current.filter((document) => document.id !== id));
    },
    [runTransaction]
  );

  const clearHistory = useCallback(() => {
    runTransaction(() => []);
  }, [runTransaction]);

  const purgeHistory = useCallback(() => {
    runTransaction((current) => current);
  }, [runTransaction]);

  return {
    history,
    addDocument,
    removeDocument,
    clearHistory,
    purgeHistory,
    isLoading,
  };
});
