"use client";

import { motion } from "framer-motion";
import { Check, X, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ComparisonRow {
  feature: string;
  revShare: string | boolean;
  affiliate: string | boolean;
  tooltip?: string;
}

const comparisonData: ComparisonRow[] = [
  {
    feature: "Revenue tracking",
    revShare: "Net revenue (refund-aware)",
    affiliate: "Click / cookie-based",
    tooltip: "RevShare syncs with Stripe to verify actual cleared funds."
  },
  {
    feature: "Refund handling",
    revShare: true,
    affiliate: "Manual adjustments",
    tooltip: "Commissions only unlock after the refund window expires."
  },
  {
    feature: "Subscription revenue",
    revShare: "Native MRR support",
    affiliate: "Limited/Inconsistent",
    tooltip: "Track renewals and lifetime value automatically."
  },
  {
    feature: "Transparency",
    revShare: "Public directories",
    affiliate: "Closed networks",
  },
  {
    feature: "Commission visibility",
    revShare: "Real-time breakdown",
    affiliate: "Aggregated/Delayed",
  },
  {
    feature: "Performance rewards",
    revShare: true,
    affiliate: false,
    tooltip: "Milestone-based rewards beyond standard commission."
  },
  {
    feature: "Trust & Auditability",
    revShare: "Full immutable log",
    affiliate: "Opaque adjustments",
  },
  {
    feature: "Payout predictability",
    revShare: "Clear timelines & states",
    affiliate: "Variable / Network-dependent",
  },
  {
    feature: "Application flow",
    revShare: "Direct to program",
    affiliate: "Network, then brand",
  },
  {
    feature: "Who holds funds",
    revShare: "Stripe settlement",
    affiliate: "Network-managed balances",
  },
  {
    feature: "Built for SaaS",
    revShare: true,
    affiliate: false,
  }
];

export function ComparisonTable() {
  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-24">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">How RevShare compares</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          A side-by-side look at why modern businesses are switching from legacy affiliate networks.
        </p>
      </div>

      <div className="relative overflow-hidden rounded-[2rem] bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/50 bg-gray-50/50">
                <th className="py-6 px-8 text-sm font-bold uppercase tracking-widest text-muted-foreground">Feature</th>
                <th className="py-6 px-8 text-sm font-bold uppercase tracking-widest text-primary">RevShare</th>
                <th className="py-6 px-8 text-sm font-bold uppercase tracking-widest text-muted-foreground">Traditional Networks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {comparisonData.map((row, idx) => (
                <motion.tr
                  key={row.feature}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="group hover:bg-gray-50/30 transition-colors"
                >
                  <td className="py-6 px-8">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{row.feature}</span>
                      {row.tooltip && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="h-3.5 w-3.5 text-muted-foreground/50 hover:text-primary transition-colors" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{row.tooltip}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </td>
                  <td className="py-6 px-8">
                    {typeof row.revShare === "boolean" ? (
                      row.revShare ? (
                        <div className="flex items-center gap-2 text-emerald-600 font-bold">
                          <Check className="h-5 w-5" />
                          <span>Yes</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-500/50">
                          <X className="h-5 w-5" />
                          <span>No</span>
                        </div>
                      )
                    ) : (
                      <span className="text-primary font-bold">{row.revShare}</span>
                    )}
                  </td>
                  <td className="py-6 px-8">
                    {typeof row.affiliate === "boolean" ? (
                      row.affiliate ? (
                        <div className="flex items-center gap-2 text-muted-foreground/70">
                          <Check className="h-5 w-5" />
                          <span>Yes</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-500/50">
                          <X className="h-5 w-5" />
                          <span>No</span>
                        </div>
                      )
                    ) : (
                      <span className="text-muted-foreground">{row.affiliate}</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
