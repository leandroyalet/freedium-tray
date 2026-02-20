import { useEffect, useRef, useState, useCallback } from "react";
import { Search, X, ChevronUp, ChevronDown } from "lucide-react";

const SearchInPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryRef = useRef(query);
  const matchElementsRef = useRef<HTMLElement[]>([]);
  const lastSearchQueryRef = useRef("");

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  const clearHighlights = useCallback(() => {
    const articleEl = document.querySelector(".article");
    if (!articleEl) return;

    const marks = articleEl.querySelectorAll("mark");
    marks.forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(
          document.createTextNode(mark.textContent || ""),
          mark,
        );
        parent.normalize();
      }
    });
    matchElementsRef.current = [];
  }, []);

  const countMatches = useCallback(() => {
    const searchQuery = queryRef.current;
    if (!searchQuery) return 0;

    const articleEl = document.querySelector(".article");
    if (!articleEl) return 0;

    clearHighlights();

    try {
      const regex = new RegExp(
        searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "gi",
      );

      const walker = document.createTreeWalker(
        articleEl as Node,
        NodeFilter.SHOW_TEXT,
        null,
      );

      let count = 0;
      const nodesToReplace: { node: Text; regex: RegExp }[] = [];

      let node: Text | null;
      while ((node = walker.nextNode() as Text | null)) {
        const text = node.textContent || "";
        const matches = text.match(regex);
        if (matches) {
          count += matches.length;
          nodesToReplace.push({ node, regex });
        }
      }

      nodesToReplace.forEach(({ node, regex }) => {
        const fragment = document.createDocumentFragment();
        let lastIndex = 0;
        const text = node.textContent || "";

        text.replace(regex, (match, index) => {
          if (index > lastIndex) {
            fragment.appendChild(
              document.createTextNode(text.slice(lastIndex, index)),
            );
          }
          const mark = document.createElement("mark");
          mark.className =
            "search-highlight bg-yellow-200 dark:bg-yellow-500/50";
          mark.textContent = match;
          fragment.appendChild(mark);
          lastIndex = index + match.length;
          return match;
        });

        if (lastIndex < text.length) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
        }

        node.parentNode?.replaceChild(fragment, node);
      });

      const marks = articleEl.querySelectorAll("mark");
      matchElementsRef.current = Array.from(marks);

      return count;
    } catch {
      return 0;
    }
  }, [clearHighlights]);

  const setActiveMatch = useCallback((activeIndex: number) => {
    const marks = matchElementsRef.current;
    marks.forEach((mark, index) => {
      if (index === activeIndex) {
        mark.className = "search-highlight bg-orange-300 dark:bg-orange-500/60";
      } else {
        mark.className = "search-highlight bg-yellow-200 dark:bg-yellow-500/50";
      }
    });
  }, []);

  const navigateMatch = useCallback(
    (forward: boolean) => {
      if (!query || matchCount === 0) return;

      let newIndex: number;
      if (forward) {
        newIndex = currentMatch < matchCount ? currentMatch : 0;
      } else {
        newIndex = currentMatch > 1 ? currentMatch - 2 : matchCount - 1;
      }

      const targetMark = matchElementsRef.current[newIndex];
      if (targetMark) {
        targetMark.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        setCurrentMatch(newIndex + 1);
        setActiveMatch(newIndex);
      }
    },
    [query, matchCount, currentMatch, setActiveMatch],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setIsOpen(true);
      }

      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();

    if (e.key === "Enter") {
      e.preventDefault();

      if (query && query !== lastSearchQueryRef.current) {
        lastSearchQueryRef.current = query;
        const count = countMatches();
        setMatchCount(count);
        if (count > 0) {
          setCurrentMatch(1);
          setActiveMatch(0);
          matchElementsRef.current[0]?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      } else if (matchCount > 0) {
        if (e.shiftKey) {
          navigateMatch(false);
        } else {
          navigateMatch(true);
        }
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleClose = () => {
    setIsOpen(false);
    setQuery("");
    setMatchCount(0);
    setCurrentMatch(0);
    lastSearchQueryRef.current = "";
    clearHighlights();
    window.getSelection()?.removeAllRanges();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex items-center gap-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg px-3 py-2">
      <Search size={16} className="text-neutral-500 shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Find in page..."
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        className="w-48 px-2 py-1 text-sm bg-transparent border-none outline-none dark:text-neutral-200"
      />
      {query && matchCount > 0 && (
        <span className="text-xs text-neutral-500 shrink-0">
          {currentMatch}/{matchCount}
        </span>
      )}
      {query && matchCount === 0 && (
        <span className="text-xs text-neutral-400 shrink-0">No results</span>
      )}
      <div className="flex items-center gap-1">
        <button
          onClick={() => navigateMatch(false)}
          disabled={!query || matchCount === 0}
          className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded disabled:opacity-50"
          title="Previous (Shift+Enter)"
        >
          <ChevronUp size={16} className="dark:text-white" />
        </button>
        <button
          onClick={() => navigateMatch(true)}
          disabled={!query || matchCount === 0}
          className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded disabled:opacity-50"
          title="Next (Enter)"
        >
          <ChevronDown size={16} className="dark:text-white" />
        </button>
      </div>
      <button
        onClick={handleClose}
        className="p-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded shrink-0"
      >
        <X size={16} className="dark:text-white" />
      </button>
    </div>
  );
};

export default SearchInPage;
