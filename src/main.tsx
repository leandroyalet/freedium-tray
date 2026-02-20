import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ToastProvider, showErrorViaToast } from "./contexts/ToastContext";
import { ErrorBoundary } from "./components/ErrorBoundary";

window.onerror = (message, _source, _lineno, _colno, error) => {
  const errorMessage = error?.message || String(message);
  showErrorViaToast(`Error: ${errorMessage}`);
  return false;
};

window.onunhandledrejection = (event) => {
  const errorMessage = event.reason?.message || String(event.reason);
  showErrorViaToast(`Unhandled error: ${errorMessage}`);
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
