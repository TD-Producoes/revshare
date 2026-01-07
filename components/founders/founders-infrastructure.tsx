"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";

export function FoundersInfrastructure() {
  return (
    <section className="py-24 bg-white border-t border-gray-50">
      <div className="mx-auto max-w-5xl px-6">
        <div className="mb-16 max-w-2xl">
          <Badge variant="outline" className="rounded-full border-[#128045]/10 bg-[#128045]/5 px-3 py-1 text-[11px] font-bold text-[#128045] tracking-wide uppercase mb-4">
            Security First
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-black mb-4">
            Built for enterprise <span className="text-[#128045]">reliability</span>
          </h2>
          <p className="text-black text-lg leading-relaxed">
            Audit logs, automated compliance, and encrypted payouts mean you can focus on building your product while we handle the distribution complexity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1: Negotiable Contracts */}
          <div className="rounded-[2rem] bg-[#F9FAF9] overflow-hidden flex flex-col h-full">
            <div className="p-6">
              <div className="h-[200px] shrink-0 relative p-8 flex items-center justify-center bg-white rounded-[1.5rem] overflow-hidden border border-black/5">
                <div className="relative w-full h-full">
                  <Image
                    src="/audit-log-light.png"
                    alt="Negotiable Contracts"
                    fill
                    className="object-contain drop-shadow-md grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all"
                  />
                </div>
              </div>
            </div>
            <div className="px-8 pb-8 flex flex-col flex-1">
              <h3 className="font-bold text-[17px] text-black mb-2">Immutable Audit Trail</h3>
              <p className="text-[13px] text-black/40 leading-relaxed">
                Track every commission change, refund, and payment. Fully transparent for both makers and marketers.
              </p>
            </div>
          </div>

          {/* Card 2: Refund Windows */}
          <div className="rounded-[2rem] bg-[#F9FAF9] overflow-hidden flex flex-col h-full">
            <div className="p-6">
              <div className="h-[200px] shrink-0 relative p-8 flex items-center justify-center bg-white rounded-[1.5rem] overflow-hidden border border-black/5">
                <div className="relative w-full h-full">
                  <Image
                    src="/approved-afil.png"
                    alt="Refund Windows"
                    fill
                    className="object-contain drop-shadow-md grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all"
                  />
                </div>
              </div>
            </div>
            <div className="px-8 pb-8 flex flex-col flex-1">
              <h3 className="font-bold text-[17px] text-black mb-2">Automated Compliance</h3>
              <p className="text-[13px] text-black/40 leading-relaxed">
                Configure custom refund windows and escrow periods to protect your cash flow from fraudulent activities.
              </p>
            </div>
          </div>

          {/* Card 3: Marketer Metrics */}
          <div className="rounded-[2rem] bg-[#F9FAF9] overflow-hidden flex flex-col h-full">
            <div className="p-6">
              <div className="h-[200px] shrink-0 relative p-8 flex items-center justify-center bg-white rounded-[1.5rem] overflow-hidden border border-black/5">
                <div className="relative w-full h-full">
                  <Image
                    src="/dash-stats-light.png"
                    alt="Marketer Metrics"
                    fill
                    className="object-contain drop-shadow-md grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all"
                  />
                </div>
              </div>
            </div>
            <div className="px-8 pb-8 flex flex-col flex-1">
              <h3 className="font-bold text-[17px] text-black mb-2">Deep Marketer Intelligence</h3>
              <p className="text-[13px] text-black/40 leading-relaxed">
                Identify your top-performing partners and reward them with higher tiers automatically based on revenue milestones.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
