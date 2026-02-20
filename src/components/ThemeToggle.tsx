import { Moon, Sun } from "lucide-react";
import { useTheme } from "./providers/ThemeProvider";

const ThemeToggle = () => {
  const { resolvedTheme: theme, toggleTheme } = useTheme();

  return (
    <div className="relative inline-block w-10 h-4 cursor-pointer">
      <span className="sr-only">
        {theme === "dark" ? "Enable Light Mode" : "Enable Dark Mode"}
      </span>
      <div
        className={`relative h-full w-full rounded-full p-2 transition-colors duration-300 bg-neutral-700 dark:bg-neutral-100`}
        onClick={toggleTheme}
      >
        <div
          className={`
            absolute -top-0.5 -left-0.5 z-50
             h-5 w-5 rounded-full
             border border-white
            bg-neutral-200 dark:bg-neutral-800
            transition-transform duration-300
            ${theme === "dark" ? "translate-x-6" : ""}
          `}
        />
        <div className="relative z-40 flex h-full items-center justify-between p-0 gap-0.5">
          <Sun
            height="16"
            className="h-4 w-4 text-neutral-100 dark:text-neutral-900"
          />
          <Moon
            height="16"
            className="h-4 w-4 text-neutral-100 dark:text-neutral-900"
          />
        </div>
      </div>
    </div>
  );
};

export default ThemeToggle;
