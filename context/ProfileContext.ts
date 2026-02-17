import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { UserProfile } from "@/constants/types";
import { decryptPayload, encryptPayload } from "@/utils/encryptedStorage";

// ── Storage keys ──────────────────────────────────────────
const LEGACY_PROFILE_STORAGE_KEY = "docgen_user_profile_v1";
const SECURE_PROFILE_STORAGE_KEY = "docgen_user_profile_secure_v1";
const SECURE_PROFILE_STAGING_KEY = "docgen_user_profile_secure_v1_staging";
const MULTI_PROFILES_KEY = "docgen_multi_profiles_v1";
const ACTIVE_PROFILE_KEY = "docgen_active_profile_id";

// ── Types ─────────────────────────────────────────────────
export interface ProfileEntry {
  id: string;
  label: string;
  profile: UserProfile;
}

interface PersistedProfilePayload {
  version: number;
  savedAt: string;
  profile: UserProfile;
}

const EMPTY_PROFILE: UserProfile = {
  expediteur_nom: "",
  expediteur_adresse: "",
  expediteur_email: "",
  expediteur_tel: "",
  lieu: "",
  signatureDataUri: undefined,
};

function createProfileId(): string {
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function normalizeProfile(input: unknown): UserProfile {
  if (!input || typeof input !== "object") {
    return EMPTY_PROFILE;
  }

  const parsed = input as Partial<UserProfile>;

  return {
    expediteur_nom: typeof parsed.expediteur_nom === "string" ? parsed.expediteur_nom : "",
    expediteur_adresse:
      typeof parsed.expediteur_adresse === "string" ? parsed.expediteur_adresse : "",
    expediteur_email: typeof parsed.expediteur_email === "string" ? parsed.expediteur_email : "",
    expediteur_tel: typeof parsed.expediteur_tel === "string" ? parsed.expediteur_tel : "",
    lieu: typeof parsed.lieu === "string" ? parsed.lieu : "",
    signatureDataUri:
      typeof parsed.signatureDataUri === "string" ? parsed.signatureDataUri : undefined,
  };
}

// ── Legacy loaders (unchanged) ────────────────────────────
async function decodeSecureProfile(encryptedPayload: string | null): Promise<UserProfile | null> {
  if (!encryptedPayload) return null;

  let payload: PersistedProfilePayload | null = null;
  try {
    payload = await decryptPayload<PersistedProfilePayload>(encryptedPayload);
  } catch (error) {
    console.error("Secure profile decrypt failed", error);
    return null;
  }

  if (!payload || !payload.profile) {
    return null;
  }

  return normalizeProfile(payload.profile);
}

async function readSecureProfile(): Promise<UserProfile | null> {
  const encryptedPrimary = await AsyncStorage.getItem(SECURE_PROFILE_STORAGE_KEY);
  const encryptedStaging = await AsyncStorage.getItem(SECURE_PROFILE_STAGING_KEY);

  const primary = await decodeSecureProfile(encryptedPrimary);
  if (primary) {
    return primary;
  }

  return decodeSecureProfile(encryptedStaging);
}

async function readLegacyProfile(): Promise<UserProfile | null> {
  const raw = await AsyncStorage.getItem(LEGACY_PROFILE_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return normalizeProfile(JSON.parse(raw));
  } catch {
    return null;
  }
}

// ── Multi-profile persistence ─────────────────────────────
async function loadMultiProfiles(): Promise<ProfileEntry[] | null> {
  const raw = await AsyncStorage.getItem(MULTI_PROFILES_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as ProfileEntry[];
  } catch { /* ignore */ }
  return null;
}

async function persistMultiProfiles(entries: ProfileEntry[]): Promise<void> {
  await AsyncStorage.setItem(MULTI_PROFILES_KEY, JSON.stringify(entries));
}

async function loadActiveProfileId(): Promise<string | null> {
  return AsyncStorage.getItem(ACTIVE_PROFILE_KEY);
}

async function persistActiveProfileId(id: string): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, id);
}

// Also keep persisting the "active" profile in the legacy encrypted store
// so downstream code (document gen, form shortcuts) still works via useProfile().profile
async function persistLegacySnapshot(nextProfile: UserProfile): Promise<void> {
  const payload: PersistedProfilePayload = {
    version: 1,
    savedAt: new Date().toISOString(),
    profile: normalizeProfile(nextProfile),
  };
  const encrypted = await encryptPayload(payload);
  await AsyncStorage.setItem(SECURE_PROFILE_STAGING_KEY, encrypted);
  await AsyncStorage.setItem(SECURE_PROFILE_STORAGE_KEY, encrypted);
  await AsyncStorage.removeItem(SECURE_PROFILE_STAGING_KEY);
  await AsyncStorage.removeItem(LEGACY_PROFILE_STORAGE_KEY);
}

// ── Context ───────────────────────────────────────────────
export const [ProfileProvider, useProfile] = createContextHook(() => {
  const [profiles, setProfiles] = useState<ProfileEntry[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [applyVersion, setApplyVersion] = useState(0);
  const [lastFormTemplateId, setLastFormTemplateId] = useState<string | null>(null);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());

  // Derived active profile
  const activeEntry = profiles.find((p) => p.id === activeProfileId) ?? profiles[0];
  const profile = activeEntry ? normalizeProfile(activeEntry.profile) : EMPTY_PROFILE;

  // ── Load ────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      // Try multi-profile store first
      let entries = await loadMultiProfiles();
      let savedActiveId = await loadActiveProfileId();

      if (!entries || entries.length === 0) {
        // Migrate from legacy single profile
        let legacyProfile: UserProfile | null = null;
        try { legacyProfile = await readSecureProfile(); } catch { /* */ }
        if (!legacyProfile) {
          try { legacyProfile = await readLegacyProfile(); } catch { /* */ }
        }

        const id = createProfileId();
        entries = [{
          id,
          label: "Personnel",
          profile: normalizeProfile(legacyProfile ?? EMPTY_PROFILE),
        }];
        savedActiveId = id;
        await persistMultiProfiles(entries);
        await persistActiveProfileId(id);
      }

      if (!mounted) return;
      setProfiles(entries);
      setActiveProfileId(savedActiveId ?? entries[0]?.id ?? null);
      setIsLoading(false);

      // Keep legacy store in sync
      const active = entries.find((e) => e.id === savedActiveId) ?? entries[0];
      if (active) {
        persistLegacySnapshot(active.profile).catch(() => { });
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  // ── Save profile (edits active entry) ────────────────────
  const saveProfile = useCallback(
    async (nextProfile: UserProfile) => {
      const normalized = normalizeProfile(nextProfile);

      setProfiles((prev) => {
        const next = prev.map((entry) =>
          entry.id === activeProfileId ? { ...entry, profile: normalized } : entry
        );
        writeQueueRef.current = writeQueueRef.current
          .then(() => Promise.all([persistMultiProfiles(next), persistLegacySnapshot(normalized)]))
          .then(() => { })
          .catch((err) => console.error("Profile save failed", err));
        return next;
      });
    },
    [activeProfileId]
  );

  const updateField = useCallback(
    async (field: keyof UserProfile, value: string) => {
      const next = { ...profile, [field]: value };
      await saveProfile(next);
    },
    [profile, saveProfile]
  );

  // ── Multi-profile operations ─────────────────────────────
  const switchProfile = useCallback(
    (id: string) => {
      setActiveProfileId(id);
      persistActiveProfileId(id).catch(() => { });

      // Sync legacy store with newly active profile
      const entry = profiles.find((p) => p.id === id);
      if (entry) {
        persistLegacySnapshot(entry.profile).catch(() => { });
      }
    },
    [profiles]
  );

  const addProfile = useCallback(
    (label: string) => {
      const id = createProfileId();
      const entry: ProfileEntry = { id, label, profile: { ...EMPTY_PROFILE } };
      setProfiles((prev) => {
        const next = [...prev, entry];
        persistMultiProfiles(next).catch(() => { });
        return next;
      });
      setActiveProfileId(id);
      persistActiveProfileId(id).catch(() => { });
      persistLegacySnapshot(EMPTY_PROFILE).catch(() => { });
      return id;
    },
    []
  );

  const deleteProfile = useCallback(
    (id: string) => {
      setProfiles((prev) => {
        const next = prev.filter((p) => p.id !== id);
        if (next.length === 0) {
          // Never delete the last profile
          return prev;
        }
        persistMultiProfiles(next).catch(() => { });

        // If we deleted the active profile, switch to the first remaining
        if (activeProfileId === id) {
          setActiveProfileId(next[0].id);
          persistActiveProfileId(next[0].id).catch(() => { });
          persistLegacySnapshot(next[0].profile).catch(() => { });
        }
        return next;
      });
    },
    [activeProfileId]
  );

  const renameProfile = useCallback(
    (id: string, label: string) => {
      setProfiles((prev) => {
        const next = prev.map((p) => (p.id === id ? { ...p, label } : p));
        persistMultiProfiles(next).catch(() => { });
        return next;
      });
    },
    []
  );

  const requestApplyToForms = useCallback(() => {
    setApplyVersion((current) => current + 1);
  }, []);

  const registerLastFormTemplate = useCallback((templateId: string) => {
    setLastFormTemplateId(templateId);
  }, []);

  return {
    // Current active profile (backward compatible)
    profile,
    saveProfile,
    updateField,
    isLoading,
    applyVersion,
    requestApplyToForms,
    lastFormTemplateId,
    registerLastFormTemplate,

    // Multi-profile API
    profiles,
    activeProfileId,
    switchProfile,
    addProfile,
    deleteProfile,
    renameProfile,
  };
});
