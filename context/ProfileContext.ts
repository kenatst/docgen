import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { UserProfile } from "@/constants/types";
import { decryptPayload, encryptPayload } from "@/utils/encryptedStorage";

const LEGACY_PROFILE_STORAGE_KEY = "docgen_user_profile_v1";
const SECURE_PROFILE_STORAGE_KEY = "docgen_user_profile_secure_v1";
const SECURE_PROFILE_STAGING_KEY = "docgen_user_profile_secure_v1_staging";

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

export const [ProfileProvider, useProfile] = createContextHook(() => {
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const [applyVersion, setApplyVersion] = useState(0);
  const [lastFormTemplateId, setLastFormTemplateId] = useState<string | null>(null);
  const writeQueueRef = useRef<Promise<void>>(Promise.resolve());

  const persistSnapshot = useCallback((nextProfile: UserProfile) => {
    writeQueueRef.current = writeQueueRef.current
      .then(async () => {
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
      })
      .catch((error) => {
        console.error("Profile persistence failed", error);
      });

    return writeQueueRef.current;
  }, []);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      let secureProfile: UserProfile | null = null;
      let legacyProfile: UserProfile | null = null;

      try {
        secureProfile = await readSecureProfile();
      } catch (error) {
        console.error("Secure profile load failed", error);
      }

      if (!secureProfile) {
        try {
          legacyProfile = await readLegacyProfile();
        } catch (error) {
          console.error("Legacy profile load failed", error);
        }
      }

      const initialProfile = normalizeProfile(secureProfile ?? legacyProfile ?? EMPTY_PROFILE);

      if (!mounted) return;
      setProfile(initialProfile);
      setIsLoading(false);

      persistSnapshot(initialProfile);
    };

    load();

    return () => {
      mounted = false;
    };
  }, [persistSnapshot]);

  const saveProfile = useCallback(
    async (nextProfile: UserProfile) => {
      const normalized = normalizeProfile(nextProfile);
      setProfile(normalized);
      await persistSnapshot(normalized);
    },
    [persistSnapshot]
  );

  const updateField = useCallback(
    async (field: keyof UserProfile, value: string) => {
      const next = { ...profile, [field]: value };
      await saveProfile(next);
    },
    [profile, saveProfile]
  );

  const requestApplyToForms = useCallback(() => {
    setApplyVersion((current) => current + 1);
  }, []);

  const registerLastFormTemplate = useCallback((templateId: string) => {
    setLastFormTemplateId(templateId);
  }, []);

  return {
    profile,
    saveProfile,
    updateField,
    isLoading,
    applyVersion,
    requestApplyToForms,
    lastFormTemplateId,
    registerLastFormTemplate,
  };
});
