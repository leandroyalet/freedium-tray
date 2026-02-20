import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, X } from "lucide-react";
import ThemeToggle from "./ThemeToggle";

const Header: React.FC = () => {
  const [value, setValue] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    if (location.pathname === "/") {
      setValue(params.get("q") || "");
    }

    if (location.pathname === "/article") {
      setValue(params.get("url") || "");
    }
  }, [location]);

  const isValidHttpsUrl = (text: string) => {
    try {
      const parsed = new URL(text);
      return parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;

    if (isValidHttpsUrl(trimmed)) {
      const parsed = new URL(trimmed);
      parsed.search = "";
      parsed.hash = "";
      navigate(`/article?url=${encodeURIComponent(parsed.href)}`);
    } else {
      navigate(`/?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleClear = () => {
    setValue("");
  };

  return (
    <nav className="sticky top-0 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-background px-4 h-12 select-none">
      <div
        className="absolute top-0 left-0 right-0 h-full"
        style={{ zIndex: 5 }}
        data-tauri-drag-region
      />
      <div className="flex gap-3 cursor-default self-end pb-2">
        <div className="w-14"></div>
      </div>

      <div className="flex-1 max-w-2xl mx-4">
        <div className="relative flex items-center z-40">
          <div className="absolute left-3 flex items-center pointer-events-none">
            <Search size={16} className="text-neutral-400" />
          </div>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Paste link or search..."
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            className="w-full pl-10 pr-10 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 border-0 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 dark:focus:ring-neutral-600"
          />
          {value && (
            <button
              onClick={handleClear}
              className="absolute right-3 p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700"
            >
              <X size={14} className="text-neutral-500" />
            </button>
          )}
        </div>
      </div>

      <ThemeToggle />
    </nav>
  );
};

export default Header;
