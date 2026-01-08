"use client";

import { motion } from "framer-motion";
import { Check, X, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ComparisonItemProps {
  before: string;
  after: string;
  index: number;
}

function ComparisonCard({ before, after, index }: ComparisonItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="bg-[#4A3728]/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm"
    >
      <div className="p-6 md:p-8 space-y-6">
        {/* After Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Check className="h-4 w-4 text-[#FFB347]" />
            <h3 className="text-xl font-bold text-white">{after}</h3>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-white/5" />

        {/* Before Section */}
        <div className="space-y-2 opacity-40 group">
          <div className="text-[10px] font-bold text-white/40 mb-1">Previously</div>
          <div className="flex items-center gap-3">
            <X className="h-4 w-4 text-white/40" />
            <span className="text-base text-white/60 line-through decoration-white/20">{before}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function ComparisonSection() {
  const comparisons = [
    { before: "Spreadsheets", after: "One dashboard" },
    { before: "Manual outreach", after: "Verified programs" },
    { before: "Missed payouts", after: "Clear tracking" },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="bg-[#3D2B1F] rounded-[2.5rem] p-8 md:p-16 relative overflow-hidden"
        >
          {/* Subtle Background Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFB347]/5 blur-[100px] -translate-y-1/2 translate-x-1/2 rounded-full" />

          <div className="relative z-10 max-w-3xl mx-auto text-center mb-16 space-y-6">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
              Stop the chase. <br />
              <span className="text-[#FFB347]">Scale the results.</span>
            </h2>
            <p className="text-white/60 text-base md:text-lg">
              Here&apos;s how RevShare transforms your daily workflow from chaos to clarity.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 relative z-10">
            {comparisons.map((item, i) => (
              <ComparisonCard key={i} {...item} index={i} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-16 text-center"
          >
            <div className="inline-flex items-center gap-2 text-[#FFB347]/60 text-sm font-medium">
              <span>Ready for the upgrade?</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
