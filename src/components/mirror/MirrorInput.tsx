import { useEffect, useState } from "react";
import { load, Store } from "@tauri-apps/plugin-store";

const STORE_KEY = "mirror";

const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

interface MirrorInputProps {
  onSave?: () => void;
}

const MirrorInput: React.FC<MirrorInputProps> = ({ onSave }) => {
  const [mirror, setMirror] = useState("");
  const [store, setStore] = useState<Store | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const initStore = async () => {
      const storeInstance = await load("settings.json", {
        autoSave: true,
        defaults: {},
      });
      setStore(storeInstance);

      const savedMirror = await storeInstance.get<string>(STORE_KEY);
      if (savedMirror) {
        setMirror(savedMirror);
      }
    };

    initStore();
  }, []);

  useEffect(() => {
    if (mirror && !isValidUrl(mirror)) {
      setError("URL must start with http:// or https://");
    } else {
      setError("");
    }
  }, [mirror]);

  const handleSave = async () => {
    if (!store || !isValidUrl(mirror)) {
      return;
    }

    await store.set(STORE_KEY, mirror);
    await store.save();

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSave?.();
  };

  const isValid = mirror.trim() !== "" && isValidUrl(mirror);

  return (
    <div>
      <label className="block text-sm font-medium mb-2 dark:text-neutral-300">
        Freedium Mirror URL
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={mirror}
          onChange={(e) => setMirror(e.target.value)}
          placeholder="https://mirror.example.com/"
          className={`flex-1 px-4 py-2 rounded-md border bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200 ${
            error
              ? "border-red-500 dark:border-red-500"
              : "border-neutral-200 dark:border-neutral-700"
          }`}
        />
        <button
          onClick={handleSave}
          disabled={!isValid}
          className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 rounded-md hover:bg-neutral-300 dark:hover:bg-neutral-600 transition text-neutral-900 dark:text-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saved ? "Saved!" : "Save"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        The mirror URL used to fetch articles from Medium.
      </p>
    </div>
  );
};

export default MirrorInput;
