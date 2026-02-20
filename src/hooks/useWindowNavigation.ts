import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function useWindowNavigation() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

      const isBack = (isMac && e.metaKey && e.key === "[") || (!isMac && e.altKey && e.key === "ArrowLeft");
      const isForward = (isMac && e.metaKey && e.key === "]") || (!isMac && e.altKey && e.key === "ArrowRight");

      if (isBack) {
        e.preventDefault();
        navigate(-1);
      } else if (isForward) {
        e.preventDefault();
        navigate(1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);
}
