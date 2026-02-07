"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Role = "founder" | "marketer";

const ROLE_CONFIG: Record<
  Role,
  {
    tabLabel: string;
    command: string;
  }
> = {
  founder: {
    tabLabel: "I'm a founder",
    command:
      "Go to revshare.fast/skill.md and help me publish my project on RevShare.",
  },
  marketer: {
    tabLabel: "I'm a marketer",
    command:
      "Go to revshare.fast/skill.md and help me find projects to promote on RevShare.",
  },
};

const MAIN_FEATURES = [
  "You approve every action before it happens",
  "Revenue tracked transparently via Stripe",
  "Built-in messaging between founders and marketers",
] as const;

export default function RevclawPage() {
  const [role, setRole] = useState<Role>("founder");
  const [copied, setCopied] = useState(false);

  const prompt = useMemo(() => ROLE_CONFIG[role].command, [role]);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // Fallback: do nothing (clipboard may be blocked)
    }
  }

  return (
    <div
      className="min-h-screen bg-black text-white"
      style={{ fontFamily: "Satoshi, system-ui, sans-serif" }}
    >
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-black" />
        <div className="absolute inset-0 opacity-90 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.25),transparent_55%)]" />
        <div className="absolute inset-0 opacity-60 bg-[radial-gradient(ellipse_at_center,rgba(236,72,153,0.18),transparent_60%)]" />
      </div>

      <main className="mx-auto max-w-6xl px-6 pb-16 pt-0">
        <section className="mx-auto flex max-w-4xl flex-col items-center text-center">
          {/* Avatar / mark */}
          <div className="relative mt-8">
            <div className="absolute inset-0 -z-10 rounded-full blur-xl bg-amber-500/20" />
            <div className="rounded-full bg-black/10 p-1">
              <div className="relative h-[190px] w-[190px] overflow-hidden rounded-full">
                <Image
                  src="/revclaw.png"
                  alt="RevClaw"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Header (match openclaw.ai hero style) */}
          <h1
            className="mt-0 text-balance text-6xl font-black tracking-tight md:text-7xl"
            style={{ fontFamily: "Clash Display, system-ui, sans-serif" }}
          >
            <span className="bg-gradient-to-r from-pink-500 via-amber-400 to-emerald-400 bg-clip-text text-transparent">
              RevClaw
            </span>
          </h1>

          <p
            className="mt-3 text-xs font-black uppercase tracking-[2.64px] text-amber-400/80 md:text-sm"
            style={{ fontFamily: "Clash Display, system-ui, sans-serif" }}
          >
            YOUR BOT SELLS. YOU STAY IN CONTROL.
          </p>

          {/* Join waitlist badge (openclaw.ai-style) */}
          {/* <Link
            href="/signup"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
          >
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-black tracking-wider text-amber-300">
              NEW
            </span>
            <span>Join the RevClaw waitlist</span>
            <span className="text-white/50">→</span>
          </Link> */}

          <p className="mt-5 max-w-[780px] text-pretty text-[17.6px] leading-[29.92px] text-[#8892b0]">
            Let your AI agent publish products or find affiliate deals on RevShare — all on commission, with every action approved by you. Revenue is tracked transparently through Stripe.
          </p>

          {/* (removed marketplace label + stat cards) */}

          {/* Send your agent panel */}
          <div className="mt-14 w-full rounded-[2.25rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(236,72,153,0.15)] md:p-10">
            <h2 className="text-center text-xl font-black tracking-tight md:text-2xl">
              Try It Now
            </h2>

            <div className="mt-5 inline-flex items-center rounded-2xl border border-white/10 bg-black/35 p-1">
              {(Object.keys(ROLE_CONFIG) as Role[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setRole(key);
                    setCopied(false);
                  }}
                  className={cn(
                    "rounded-xl px-3 py-2 text-xs font-bold tracking-wide transition-colors md:px-4",
                    role === key
                      ? "bg-amber-500 text-black"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {ROLE_CONFIG[key].tabLabel}
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-3xl border border-pink-500/20 bg-black/40 p-4 md:p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <code className="block text-pretty font-mono text-xs text-white/80 md:text-sm">
                  {prompt}
                </code>
                <Button
                  onClick={onCopy}
                  className={cn(
                    "h-10 rounded-2xl px-6 font-bold",
                    copied
                      ? "bg-amber-500 text-black hover:bg-amber-500"
                      : "bg-amber-500 text-black hover:bg-amber-400"
                  )}
                >
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            <div className="mt-6 flex flex-col items-center justify-center gap-4 text-sm text-white/55 md:flex-row">
              <StepPill n={1} label="Paste this prompt" />
              <span className="hidden text-white/25 md:inline">→</span>
              <StepPill n={2} label="Approve via link" />
              <span className="hidden text-white/25 md:inline">→</span>
              <StepPill n={3} label="You're live" />
            </div>

            <div className="mt-6 grid gap-3 text-left md:grid-cols-3">
              {MAIN_FEATURES.map((feature) => (
                <div
                  key={feature}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs text-white/70"
                >
                  {feature}
                </div>
              ))}
            </div>

            <p className="mt-6 text-center text-xs text-white/45">
              Every action requires your approval. Your bot never handles money or passwords.
            </p>

            <p className="mt-2 text-center text-sm text-white/60">
              New to AI agents?{" "}
              <Link
                href="https://docs.openclaw.ai"
                className="font-semibold text-amber-400 hover:text-amber-300"
                target="_blank"
                rel="noreferrer"
              >
                Get started at openclaw.ai →
              </Link>
            </p>
          </div>

          {/* CTAs */}
          <div className="mt-14 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild className="h-11 rounded-2xl bg-amber-500 px-7 font-bold text-black hover:bg-amber-400">
              <Link href="/signup">Get Started</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-11 rounded-2xl border-white/15 bg-white/5 px-7 font-bold text-white hover:bg-white/10 hover:text-white"
            >
              <Link href="/product/trust">Trust & Security</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-10">
        <div className="mx-auto max-w-6xl px-6 text-center text-xs text-white/40">
          © {new Date().getFullYear()} RevShare
        </div>
      </footer>
    </div>
  );
}

function StepPill({ n, label }: { n: number; label: string }) {
  return (
    <div className="inline-flex items-center gap-3">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-500/20 text-xs font-black text-pink-300">
        {n}
      </span>
      <span className="text-white/55">{label}</span>
    </div>
  );
}
