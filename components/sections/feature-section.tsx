"use client";

import * as React from "react";
import { motion, useScroll } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FeatureSectionProps {
  badge?: string;
  title: string;
  description: string;
  items?: string[];
  visual: (progress: any) => React.ReactNode;
  reversed?: boolean;
}

export function FeatureSection({
  badge,
  title,
  description,
  items,
  visual,
  reversed = false,
}: FeatureSectionProps) {
  const sectionRef = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  return (
    <section
      ref={sectionRef}
      className="relative z-10 py-10 overflow-hidden bg-white"
    >
      <div className="mx-auto max-w-5xl px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className={cn(
            "space-y-6",
            reversed ? "lg:order-2" : "lg:order-1"
          )}>
            <h2 className="text-[28px] md:text-[32px] font-semibold tracking-tight leading-tight text-black text-balance">
              {title}
            </h2>

            <p className="text-base text-black leading-relaxed max-w-lg">
              {description}
            </p>
          </div>
          <div className={cn(
            "relative flex items-center",
            reversed ? "lg:order-1 justify-start" : "lg:order-2 justify-end"
          )}>
            {visual(scrollYProgress)}
          </div>
        </div>
      </div>
    </section>
  );
}
