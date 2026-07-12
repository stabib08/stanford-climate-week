import "react-native-url-polyfill/auto";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { createClient, processLock } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env.",
  );
}

/**
 * Encrypted, size-safe session storage.
 * - Native: expo-secure-store (Keychain / Keystore). SecureStore caps values at 2KB,
 *   so we chunk the session JSON across keys.
 * - Web: falls back to localStorage via AsyncStorage shim (no SecureStore on web).
 */
const CHUNK_SIZE = 1800;

const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const head = await SecureStore.getItemAsync(`${key}__0`);
    if (head === null) return null;
    let value = head;
    let i = 1;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const next = await SecureStore.getItemAsync(`${key}__${i}`);
      if (next === null) break;
      value += next;
      i += 1;
    }
    return value;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    const chunks = value.match(new RegExp(`.{1,${CHUNK_SIZE}}`, "gs")) ?? [""];
    await Promise.all(
      chunks.map((chunk, i) => SecureStore.setItemAsync(`${key}__${i}`, chunk)),
    );
    // Clean any stale trailing chunks from a previously longer session.
    let i = chunks.length;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const stale = await SecureStore.getItemAsync(`${key}__${i}`);
      if (stale === null) break;
      await SecureStore.deleteItemAsync(`${key}__${i}`);
      i += 1;
    }
  },
  removeItem: async (key: string): Promise<void> => {
    let i = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const existing = await SecureStore.getItemAsync(`${key}__${i}`);
      if (existing === null) break;
      await SecureStore.deleteItemAsync(`${key}__${i}`);
      i += 1;
    }
  },
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === "web" ? AsyncStorage : SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web", // needed for magic-link / OAuth on web
    lock: processLock,
  },
});
