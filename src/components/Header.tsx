import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Search, X } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import ThemeToggle from "./ThemeToggle";

const Header: React.FC = () => {
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const navigate = useNavigate();
  const location = useLocation();
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    if (location.pathname === "/") {
      setValue(params.get("q") || "");
    }

    if (location.pathname === "/article") {
      setValue(params.get("url") || "");
    }
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionRef.current &&
        !suggestionRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const tagMatch = value.match(/^#(\w*)$/);
    if (tagMatch) {
      const prefix = tagMatch[1];
      if (prefix.length > 0) {
        const timer = setTimeout(async () => {
          try {
            const tags = await invoke<string[]>("search_tags", {
              prefix,
              limit: 6,
            });
            setSuggestions(tags);
            setShowSuggestions(tags.length > 0);
            setSelectedIndex(-1);
          } catch (err) {
            console.error("Failed to fetch tag suggestions:", err);
          }
        }, 200);
        return () => clearTimeout(timer);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  }, [value]);

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
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (tag: string) => {
    setValue(`#${tag}`);
    setShowSuggestions(false);
    navigate(`/?q=%23${tag}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) {
      if (e.key === "Enter") {
        handleSubmit();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          handleSubmit();
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        break;
      case "Tab":
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          e.preventDefault();
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
    }
  };

  return (
    <nav className="sticky top-0 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 bg-background px-4 h-12 select-none z-50">
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
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
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
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionRef}
              className="absolute top-full left-0 right-0 mt-1 py-1 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden z-50"
            >
              {suggestions.map((tag, index) => (
                <button
                  key={tag}
                  onClick={() => handleSuggestionClick(tag)}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors ${
                    index === selectedIndex
                      ? "bg-neutral-100 dark:bg-neutral-700"
                      : "bg-transparent"
                  }`}
                >
                  <span className="text-neutral-900 dark:text-neutral-100">
                    #{tag}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <ThemeToggle />
    </nav>
  );
};

export default Header;
