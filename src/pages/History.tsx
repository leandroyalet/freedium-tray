import { invoke } from "@tauri-apps/api/core";
import { Trash } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HistoryEntry } from "../types";

type GroupedHistory = {
  title: string;
  entries: HistoryEntry[];
};

const History = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await invoke<HistoryEntry[]>("get_reading_history");
      setHistory(data);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      await invoke("clear_history");
      setHistory([]);
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  const getGroupedHistory = (): GroupedHistory[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(thisWeekStart.getDate() - 7);

    const groups: { [key: string]: HistoryEntry[] } = {
      Today: [],
      Yesterday: [],
      "Earlier this week": [],
      Older: [],
    };

    history.forEach((entry) => {
      const entryDate = new Date(entry.visitedAt + "Z");
      if (entryDate >= today) {
        groups["Today"].push(entry);
      } else if (entryDate >= yesterday) {
        groups["Yesterday"].push(entry);
      } else if (entryDate >= thisWeekStart) {
        groups["Earlier this week"].push(entry);
      } else {
        groups["Older"].push(entry);
      }
    });

    return Object.entries(groups)
      .filter(([, entries]) => entries.length > 0)
      .map(([title, entries]) => ({ title, entries }));
  };

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr + "Z");
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleEntryClick = (entry: HistoryEntry) => {
    navigate(`/article/${entry.articleSlug}`);
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-4 dark:text-white">History</h1>
        <p className="text-neutral-600 dark:text-neutral-400">Loading...</p>
      </div>
    );
  }

  const groupedHistory = getGroupedHistory();

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold dark:text-white">History</h1>
        {history.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex gap-2 items-center text-sm text-neutral-500 hover:text-red-500 dark:text-neutral-400 dark:hover:text-red-400 transition-colors border p-2 rounded-md cursor-pointer"
          >
            <Trash size={16} />
            Clear history
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <p className="text-neutral-600 dark:text-neutral-400">
          Your reading history will appear here.
        </p>
      ) : (
        <div className="space-y-6">
          {groupedHistory.map((group) => (
            <div
              key={group.title}
              className="bg-neutral-100 dark:bg-neutral-900 rounded-2xl p-4 shadow-lg"
            >
              <h2 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 my-2">
                {group.title}
              </h2>
              <div className="space-y-1">
                {group.entries.map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => handleEntryClick(entry)}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 cursor-pointer transition-colors"
                  >
                    <span className="text-sm text-neutral-500 dark:text-neutral-400 w-25 shrink-0 whitespace-nowrap">
                      {formatTime(entry.visitedAt)}
                    </span>
                    <img
                      src={
                        entry.article?.author?.avatar ||
                        "https://via.placeholder.com/32"
                      }
                      alt=""
                      className="w-8 h-8 rounded-full shrink-0"
                    />
                    <span className="text-neutral-800 dark:text-neutral-200 truncate min-w-0 flex-1">
                      {entry.article?.title || "Unknown article"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
