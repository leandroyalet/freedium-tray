import { useEffect, useState, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { listen } from "@tauri-apps/api/event";
import { Download, Upload } from "lucide-react";
import { getMirror } from "../utils/mirror";
import MirrorInput from "../components/mirror/MirrorInput";

const Settings: React.FC = () => {
  const [articleCount, setArticleCount] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const count = await invoke<number>("get_article_count");
        setArticleCount(count);
      } catch (err) {
        console.error("Failed to get article count:", err);
      }
    };
    fetchCount();
  }, []);

  const importFromPath = async (filePath: string) => {
    setImporting(true);
    setImportMessage("");

    try {
      const mirror = await getMirror();
      const count = await invoke<number>("import_article_urls", {
        filePath,
        mirror,
      });
      setImportMessage(`Imported ${count} articles`);
      const newCount = await invoke<number>("get_article_count");
      setArticleCount(newCount);
    } catch (err) {
      setImportMessage(`Import failed: ${err}`);
    } finally {
      setImporting(false);
    }
  };

  useEffect(() => {
    const unlisten = listen<{ paths: string[] }>("tauri://drag-drop", async (event) => {
      const paths = event.payload.paths;
      if (paths && paths.length > 0) {
        const filePath = paths[0];
        if (filePath.endsWith(".txt")) {
          await importFromPath(filePath);
        }
      }
      setIsDragging(false);
    });

    const unlistenDragEnter = listen("tauri://drag-enter", () => {
      setIsDragging(true);
    });

    const unlistenDragLeave = listen("tauri://drag-leave", () => {
      setIsDragging(false);
    });

    return () => {
      unlisten.then((fn) => fn());
      unlistenDragEnter.then((fn) => fn());
      unlistenDragLeave.then((fn) => fn());
    };
  }, []);

  const handleExport = async () => {
    setExporting(true);
    setExportMessage("");

    try {
      const filePath = await invoke<string>("export_article_urls");
      setExportMessage(`Exported to: ${filePath}`);
    } catch (err) {
      setExportMessage(`Export failed: ${err}`);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "Text Files", extensions: ["txt"] }],
      });

      if (selected) {
        await importFromPath(selected as string);
      }
    } catch (err) {
      console.error("Failed to open file picker:", err);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-2xl">
        <div className="space-y-6">
          <MirrorInput />

          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6">
            <h2 className="text-lg font-medium mb-2 dark:text-white">
              Export Article Links
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
              Export all saved article URLs to a text file. Currently saved:{" "}
              {articleCount} articles.
            </p>
            <button
              onClick={handleExport}
              disabled={exporting || articleCount === 0}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-200 dark:bg-neutral-700 rounded-md hover:bg-neutral-300 dark:hover:bg-neutral-600 transition text-neutral-900 dark:text-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={18} />
              {exporting ? "Exporting..." : "Export to Downloads"}
            </button>
            {exportMessage && (
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                {exportMessage}
              </p>
            )}
          </div>

          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-6">
            <h2 className="text-lg font-medium mb-2 dark:text-white">
              Import Article Links
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
              Import article URLs from a text file (one URL per line).
            </p>
            <div
              ref={dropRef}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-neutral-300 dark:border-neutral-600"
              }`}
            >
              <button
                onClick={handleImport}
                disabled={importing}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-200 dark:bg-neutral-700 rounded-md hover:bg-neutral-300 dark:hover:bg-neutral-600 transition text-neutral-900 dark:text-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed mx-auto"
              >
                <Upload size={18} />
                {importing ? "Importing..." : "Select File"}
              </button>
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                or drag and drop a .txt file here
              </p>
            </div>
            {importMessage && (
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                {importMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
