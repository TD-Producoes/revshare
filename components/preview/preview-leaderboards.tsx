"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowUp } from "lucide-react";
import { previewProjects, previewMarketers } from "@/lib/data/preview-data";

// Helper to get a consistent pastel color based on a string
const getPastelColor = (name: string) => {
  const colors = [
    { bg: 'bg-blue-50', text: 'text-blue-600' },
    { bg: 'bg-green-50', text: 'text-green-600' },
    { bg: 'bg-purple-50', text: 'text-purple-600' },
    { bg: 'bg-rose-50', text: 'text-rose-600' },
    { bg: 'bg-amber-50', text: 'text-amber-600' },
    { bg: 'bg-cyan-50', text: 'text-cyan-600' },
    { bg: 'bg-indigo-50', text: 'text-indigo-600' },
    { bg: 'bg-teal-50', text: 'text-teal-600' },
  ];
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
};

export function PreviewLeaderboards() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-12 px-4 flex items-center gap-4">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-black">Leaderboard</h2>
          <Badge className="bg-amber-100 text-amber-700 border-none font-bold text-[10px] uppercase tracking-widest">
            Preview
          </Badge>
        </div>

        {/* Side-by-side layout on large screens, stacked on smaller screens */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-4">
          {/* Projects Table Card */}
          <div className="bg-[#F9F8F6] rounded-[2.5rem] p-6 lg:p-8 flex-1 min-w-0">
            <div className="flex items-center justify-between px-2 mb-6">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Example Startups</div>
              <Link href="/projects" className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-bold text-xs transition-colors">
                Startup Directory <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-black/5">
                    <th className="text-left pb-4 px-2 text-xs font-bold text-black/60 w-10">#</th>
                    <th className="text-left pb-4 px-2 text-xs font-bold text-black/60">Startup</th>
                    <th className="text-right pb-4 px-2 text-xs font-bold text-black/60">Commission</th>
                    <th className="text-right pb-4 px-2 text-xs font-bold text-black/60 w-24">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.03]">
                  {previewProjects.slice(0, 5).map((project, i) => {
                    const colors = getPastelColor(project.name);
                    return (
                      <tr key={project.id} className="group hover:bg-white/50 transition-colors">
                        <td className="py-4 px-2">
                          <span className="text-[11px] font-bold text-gray-400">{i + 1}</span>
                        </td>
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-xl overflow-hidden flex items-center justify-center shrink-0 ${colors.bg}`}>
                              <span className={`text-sm font-bold ${colors.text}`}>
                                {project.name.charAt(0)}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-sm text-black truncate">{project.name}</div>
                              <div className="text-[10px] text-gray-500">{project.category}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-2 text-right">
                          <span className="text-sm font-bold text-amber-600">{project.commissionPercent}%</span>
                        </td>
                        <td className="py-4 px-2 text-right">
                          <Badge variant="outline" className="text-[9px] font-bold uppercase text-muted-foreground border-border/40">
                            Example
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Marketers Table Card */}
          <div className="bg-[#F9F8F6] rounded-[2.5rem] p-6 lg:p-8 flex-1 min-w-0">
            <div className="flex items-center justify-between px-2 mb-6">
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Example Marketers</div>
              <Link href="/marketers" className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-bold text-xs transition-colors">
                Marketer Directory <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-black/5">
                    <th className="text-left pb-4 px-2 text-xs font-bold text-black/60 w-10">#</th>
                    <th className="text-left pb-4 px-2 text-xs font-bold text-black/60">Marketer</th>
                    <th className="text-left pb-4 px-2 text-xs font-bold text-black/60">Speciality</th>
                    <th className="text-right pb-4 px-2 text-xs font-bold text-black/60 w-24">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.03]">
                  {previewMarketers.slice(0, 5).map((marketer, i) => {
                    const colors = getPastelColor(marketer.name);
                    return (
                      <tr key={marketer.id} className="group hover:bg-white/50 transition-colors">
                        <td className="py-4 px-2">
                          <span className="text-[11px] font-bold text-gray-400">{i + 1}</span>
                        </td>
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-xl overflow-hidden flex items-center justify-center shrink-0 ${colors.bg}`}>
                              <span className={`text-sm font-bold ${colors.text}`}>
                                {marketer.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-sm text-black truncate">{marketer.name}</div>
                              <div className="text-[10px] text-gray-500">{marketer.industries.join(', ')}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <span className="text-xs font-medium text-gray-600">{marketer.promotionTypes[0]}</span>
                        </td>
                        <td className="py-4 px-2 text-right">
                          <Badge variant="outline" className="text-[9px] font-bold uppercase text-muted-foreground border-border/40">
                            Example
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Note about preview */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Launching soon</span> — Real stats will be visible after launch
          </p>
        </div>
      </div>
    </section>
  );
}
