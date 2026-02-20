import React from "react";

interface UrlInputProps {
  value: string;
  setValue: (value: string) => void;
  onLoadUrl: (url: string) => void;
}

const UrlInput: React.FC<UrlInputProps> = ({ value, setValue, onLoadUrl }) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && value.trim()) {
      onLoadUrl(value.trim());
    }

    if (e.key === "Escape") {
      setValue("");
    }
  };

  const clearInput = () => {
    setValue("");
  };

  return (
    <div className="relative w-full">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <svg
          className="w-3 h-3 text-gray-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 20 20"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
          />
        </svg>
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Medium link..."
        className="rounded-full w-full text-neutral-700 dark:text-neutral-500 dark:bg-black pl-8 pr-8 h-6 outline-none shadow-sm focus:ring-2 focus:ring-neutral-500 z-50"
      />

      {value && (
        <button
          onClick={clearInput}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-700 transition-colors"
        >
          <svg
            className="w-4 h-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 20"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 6l8 8M6 14L14 6"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default UrlInput;
