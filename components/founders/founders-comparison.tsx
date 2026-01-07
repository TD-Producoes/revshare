"use client";

import { motion } from "framer-motion";
import { Check, X, ArrowRight } from "lucide-react";

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
      className="bg-[#11241A]/50 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm"
    >
      <div className="p-6 md:p-8 space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Check className="h-4 w-4 text-[#BFF2A0]" />
            <h3 className="text-xl font-bold text-white">{after}</h3>
          </div>
        </div>
        <div className="h-px w-full bg-white/5" />
        <div className="space-y-2 opacity-40 group">
          <div className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-1">Previously</div>
          <div className="flex items-center gap-3">
            <X className="h-4 w-4 text-white/40" />
            <span className="text-base text-white/70 line-through decoration-white/20">{before}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function FoundersComparison() {
  const comparisons = [
    { before: "Expensive Ads", after: "Commission-only" },
    { before: "Complex Tracking", after: "Native Attribution" },
    { before: "Opaque Affiliates", after: "Verified Marketers" },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="bg-[#0B1710] rounded-[2.5rem] p-8 md:p-16 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#BFF2A0]/5 blur-[100px] -translate-y-1/2 translate-x-1/2 rounded-full" />

          <div className="relative z-10 max-w-3xl mx-auto text-center mb-16 space-y-6">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
              Pay for growth, <br />
              <span className="text-[#BFF2A0]">not for clicks.</span>
            </h2>
            <p className="text-white/70 text-base md:text-lg text-balance">
              RevShare eliminates the risk of traditional marketing by aligning your costs directly with your success.
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
            <div className="inline-flex items-center gap-2 text-[#BFF2A0]/60 text-sm font-medium">
              <span>Ready to scale your SaaS?</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
