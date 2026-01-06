"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function RouteChangeTransition() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // We set it to true immediately to catch the change as fast as React allows
    setIsVisible(true);

    // Smooth disappearance after the navigation has likely finished
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key="route-overlay-v3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.6, // Longer, smoother disappearing
            ease: [0.22, 1, 0.36, 1] // Exponential out easing for premium feel
          }}
          className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center bg-[#FFB938]"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.05, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-col items-center gap-4"
          >
            <div className="h-14 w-14 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 flex items-center justify-center">
              <div className="h-5 w-5 bg-white rounded-md animate-pulse" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
