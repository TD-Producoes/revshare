"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";

export function SmoothScroll() {
  const pathname = usePathname();
  const lenisRef = useRef<Lenis | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const shouldDisable =
    pathname.startsWith("/founder") ||
    pathname.startsWith("/marketer") ||
    pathname.startsWith("/onboarding-new") ||
    pathname.startsWith("/onboarding");

  useEffect(() => {
    if (shouldDisable) {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
      return;
    }

    if (!lenisRef.current) {
      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential easing for "smooth" feel
        orientation: "vertical",
        gestureOrientation: "vertical",
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
      });
      lenisRef.current = lenis;

      const raf = (time: number) => {
        lenis.raf(time);
        rafIdRef.current = requestAnimationFrame(raf);
      };
      rafIdRef.current = requestAnimationFrame(raf);
    }

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      if (lenisRef.current) {
        lenisRef.current.destroy();
        lenisRef.current = null;
      }
    };
  }, [shouldDisable]);

  return null;
}
