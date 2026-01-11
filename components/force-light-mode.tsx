"use client";

import { useEffect } from "react";

/**
 * Forces light mode on landing pages by adding the 'light' class
 * and removing 'dark' class from the document root.
 * This overrides user preferences for public-facing pages.
 */
export function ForceLightMode() {
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("dark");
    root.classList.add("light");

    // Observe for any changes and revert to light mode
    const observer = new MutationObserver(() => {
      if (root.classList.contains("dark")) {
        root.classList.remove("dark");
        root.classList.add("light");
      }
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}
