import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { X } from "lucide-react";

export interface Toast {
  id: number;
  message: string;
  type: "error" | "success";
}

interface ToastContextValue {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  dismissToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let toastId = 0;

const showErrorRef = { current: ((_message: string) => {}) as (message: string) => void };

export function showErrorViaToast(message: string) {
  showErrorRef.current(message);
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showError = useCallback((message: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type: "error" }]);
  }, []);

  const showSuccess = useCallback((message: string) => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type: "success" }]);
  }, []);

  showErrorRef.current = showError;

  const value = { showError, showSuccess, dismissToast };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg min-w-72 max-w-96 ${
              toast.type === "error"
                ? "bg-red-500 text-white"
                : "bg-green-500 text-white"
            }`}
          >
            <span className="flex-1 text-sm">{toast.message}</span>
            <button
              onClick={() => dismissToast(toast.id)}
              className="p-1 hover:bg-white/20 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
