"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type SetupGuideState = {
  isDismissed: boolean;
  isCollapsed: boolean;
  openGuide: () => void;
  closeGuide: () => void;
  toggleCollapsed: () => void;
};

const SetupGuideContext = createContext<SetupGuideState | null>(null);

const STORAGE_KEY = "revshare.setup-guide";

export function SetupGuideProvider({ children }: { children: React.ReactNode }) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as {
        isDismissed?: boolean;
        isCollapsed?: boolean;
      };
      setIsDismissed(Boolean(parsed.isDismissed));
      setIsCollapsed(Boolean(parsed.isCollapsed));
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ isDismissed, isCollapsed })
    );
  }, [isDismissed, isCollapsed]);

  const value = useMemo<SetupGuideState>(
    () => ({
      isDismissed,
      isCollapsed,
      openGuide: () => {
        setIsDismissed(false);
        setIsCollapsed(false);
      },
      closeGuide: () => setIsDismissed(true),
      toggleCollapsed: () => setIsCollapsed((prev) => !prev),
    }),
    [isDismissed, isCollapsed]
  );

  return (
    <SetupGuideContext.Provider value={value}>
      {children}
    </SetupGuideContext.Provider>
  );
}

export function useSetupGuide() {
  const context = useContext(SetupGuideContext);
  if (!context) {
    throw new Error("useSetupGuide must be used within SetupGuideProvider");
  }
  return context;
}
