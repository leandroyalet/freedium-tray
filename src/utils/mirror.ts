import { load } from "@tauri-apps/plugin-store";

const STORE_KEY = "mirror";

export const getMirror = async (): Promise<string> => {
  const store = await load("settings.json", { autoSave: true, defaults: {} });
  const mirror = await store.get<string>(STORE_KEY);
  if (!mirror || mirror.trim() === "") {
    throw new Error("Mirror not configured. Please configure in Settings.");
  }
  return mirror;
};

export const isMirrorConfigured = async (): Promise<boolean> => {
  try {
    const store = await load("settings.json", { autoSave: true, defaults: {} });
    const mirror = await store.get<string>(STORE_KEY);
    return mirror !== undefined && mirror !== null && mirror.trim() !== "";
  } catch {
    return false;
  }
};
