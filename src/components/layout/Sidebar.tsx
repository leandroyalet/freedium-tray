import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Compass, History, Settings } from "lucide-react";

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { path: "/explore", label: "Explore", icon: <Compass size={20} /> },
  { path: "/history", label: "History", icon: <History size={20} /> },
  { path: "/settings", label: "Config", icon: <Settings size={20} /> },
];

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={`fixed left-0 top-12 bottom-0 z-20 flex flex-col border-r border-neutral-200 dark:border-neutral-800 bg-background transition-all duration-300 select-none ${
        isExpanded ? "w-52" : "w-16"
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <nav className="flex flex-col gap-1 p-2">
        <NavLink
          key="/"
          to="/"
          onClick={() => setIsExpanded(false)}
          className={`flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors ${
            location.pathname === "/"
              ? ""
              : `  ${!isExpanded ? "px-0 py-0 " : ""}`
          }`}
        >
          <span className="shrink-0 h-5 flex items-center justify-center">
            {isExpanded ? (
              <img
                src="/freedium.svg"
                alt="Freedium"
                style={{ width: "80%" }}
                className="dark:invert"
              />
            ) : (
              <img
                src="/freedium-app-icon-tray.svg"
                alt="Freedium"
                className="w-full h-full object-contain invert dark:invert-0"
              />
            )}
          </span>
        </NavLink>

        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsExpanded(false)}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors ${
                isActive
                  ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  : `text-neutral-600 dark:text-neutral-400 ${!isExpanded ? "hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100" : ""}`
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              <span
                className={`whitespace-nowrap overflow-hidden transition-opacity duration-200 ${
                  isExpanded ? "opacity-100" : "opacity-0 w-0"
                }`}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
