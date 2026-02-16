import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import CryptoJS from "crypto-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const MASTER_KEY_NAME = "docgen_master_key_v1";
const MASTER_KEY_FALLBACK_NAME = "docgen_master_key_v1_fallback";
const ENCRYPTION_VERSION = 1;
const IS_DEV = typeof __DEV__ !== "undefined" && __DEV__;
const ALLOW_INSECURE_FALLBACK = IS_DEV || Platform.OS === "web";
let hasWarnedInsecureFallback = false;

interface EncryptedPayloadV1 {
  v: number;
  iv: string;
  ct: string;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getPseudoRandomBytes(length: number): Uint8Array {
  const output = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) {
    output[i] = Math.floor(Math.random() * 256);
  }
  return output;
}

function warnInsecureFallback(reason: string): void {
  if (hasWarnedInsecureFallback) return;
  hasWarnedInsecureFallback = true;
  console.warn(`Insecure crypto fallback enabled (${reason}). Data at rest protection is reduced.`);
}

function getRandomBytes(length: number): Uint8Array {
  try {
    return Crypto.getRandomBytes(length);
  } catch {
    if (!ALLOW_INSECURE_FALLBACK) {
      throw new Error("Secure random number generator unavailable.");
    }
    warnInsecureFallback("random bytes unavailable");
    return getPseudoRandomBytes(length);
  }
}

async function getOrCreateMasterKey(): Promise<string> {
  let existing: string | null = null;
  try {
    existing = await SecureStore.getItemAsync(MASTER_KEY_NAME);
  } catch {
    if (!ALLOW_INSECURE_FALLBACK) {
      throw new Error("Secure key store unavailable.");
    }
    warnInsecureFallback("secure key store unavailable");
  }

  if (existing) {
    return existing;
  }

  const fallbackExisting = await AsyncStorage.getItem(MASTER_KEY_FALLBACK_NAME);
  if (fallbackExisting) {
    if (!ALLOW_INSECURE_FALLBACK) {
      try {
        await SecureStore.setItemAsync(MASTER_KEY_NAME, fallbackExisting);
        await AsyncStorage.removeItem(MASTER_KEY_FALLBACK_NAME);
      } catch {
        throw new Error("Unable to migrate master key to secure storage.");
      }
    } else {
      warnInsecureFallback("using fallback key storage");
    }

    return fallbackExisting;
  }

  const nextKey = bytesToHex(getRandomBytes(32));

  try {
    await SecureStore.setItemAsync(MASTER_KEY_NAME, nextKey);
  } catch {
    if (!ALLOW_INSECURE_FALLBACK) {
      throw new Error("Unable to persist master key securely.");
    }
    warnInsecureFallback("storing key in async storage");
    await AsyncStorage.setItem(MASTER_KEY_FALLBACK_NAME, nextKey);
  }

  return nextKey;
}

function decryptLegacy<T>(cipherText: string, key: string): T | null {
  try {
    const legacyBytes = CryptoJS.AES.decrypt(cipherText, key);
    const legacyText = legacyBytes.toString(CryptoJS.enc.Utf8);
    if (!legacyText) {
      return null;
    }
    return JSON.parse(legacyText) as T;
  } catch {
    return null;
  }
}

export async function encryptPayload(payload: unknown): Promise<string> {
  const masterKey = await getOrCreateMasterKey();
  const aesKey = CryptoJS.SHA256(masterKey);
  const ivBytes = getRandomBytes(16);
  const ivHex = bytesToHex(ivBytes);
  const ivWordArray = CryptoJS.enc.Hex.parse(ivHex);
  const asJson = JSON.stringify(payload);

  const encrypted = CryptoJS.AES.encrypt(asJson, aesKey, {
    iv: ivWordArray,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  const wrapped: EncryptedPayloadV1 = {
    v: ENCRYPTION_VERSION,
    iv: ivHex,
    ct: encrypted.ciphertext.toString(CryptoJS.enc.Base64),
  };

  return JSON.stringify(wrapped);
}

export async function decryptPayload<T>(cipherText: string): Promise<T | null> {
  const masterKey = await getOrCreateMasterKey();
  const aesKey = CryptoJS.SHA256(masterKey);

  try {
    const parsed = JSON.parse(cipherText) as Partial<EncryptedPayloadV1>;
    if (parsed.v !== ENCRYPTION_VERSION || !parsed.iv || !parsed.ct) {
      return decryptLegacy<T>(cipherText, masterKey);
    }

    const iv = CryptoJS.enc.Hex.parse(parsed.iv);
    const encrypted = CryptoJS.lib.CipherParams.create({
      ciphertext: CryptoJS.enc.Base64.parse(parsed.ct),
    });

    const bytes = CryptoJS.AES.decrypt(encrypted, aesKey, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const plainText = bytes.toString(CryptoJS.enc.Utf8);
    if (!plainText) {
      return decryptLegacy<T>(cipherText, masterKey);
    }

    return JSON.parse(plainText) as T;
  } catch {
    return decryptLegacy<T>(cipherText, masterKey);
  }
}
