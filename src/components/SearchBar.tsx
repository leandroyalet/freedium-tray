import React from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
}

const SearchBar: React.FC<Props> = ({ value, onChange }) => {
  return (
    <input
      autoFocus
      placeholder="Search articles..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-4 text-lg rounded-xl border 
                 bg-white dark:bg-zinc-900
                 border-neutral-200 dark:border-zinc-700
                 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
};

export default SearchBar;
