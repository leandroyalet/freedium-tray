import { useEffect, useState } from "react";
import {
  Navigate,
  Route,
  HashRouter as Router,
  Routes,
  useLocation,
} from "react-router-dom";
import "./App.css";
import Layout from "./components/layout/Layout";
import SetupModal from "./components/mirror/SetupModal";
import { ThemeProvider } from "./components/providers/ThemeProvider";
import { useWindowNavigation } from "./hooks/useWindowNavigation";
import About from "./pages/About";
import ArticleFromUrlPage from "./pages/ArticleFromUrlPage";
import ArticlePage from "./pages/ArticlePage";
import History from "./pages/History";
import Landing from "./pages/Landing";
import Settings from "./pages/Settings";
import { isMirrorConfigured } from "./utils/mirror";

function AppContent() {
  useWindowNavigation();
  const location = useLocation();
  const [needsConfig, setNeedsConfig] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkConfig = async () => {
      const configured = await isMirrorConfigured();
      setNeedsConfig(!configured);
      setIsReady(true);
    };
    checkConfig();
  }, [location.pathname]);

  if (!isReady) {
    return null;
  }

  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/explore" element={<Navigate to="/" replace />} />
          <Route path="/history" element={<History />} />
          <Route path="/article/:id" element={<ArticlePage />} />
          <Route path="/article" element={<ArticleFromUrlPage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/about" element={<About />} />
        </Route>
      </Routes>
      {needsConfig && <SetupModal onComplete={() => setNeedsConfig(false)} />}
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
