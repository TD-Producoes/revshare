"use client";

import { motion } from "framer-motion";

interface LifecycleStepProps {
  number: string;
  title: string;
  description: string;
  delay: number;
}

function LifecycleStep({ number, title, description, delay }: LifecycleStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col gap-3 p-6 rounded-2xl bg-[#4A3728]/40 border border-white/5 backdrop-blur-sm"
    >
      <div className="text-[11px] font-bold text-white/40 font-mono tracking-widest">{number}</div>
      <div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-base text-white/60 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

export function LifecycleSection() {
  const steps = [
    {
      number: "01",
      title: "Connect & Define",
      description: "Founder connects Stripe and sets commission rules (e.g. 20%) in minutes. No code required.",
    },
    {
      number: "02",
      title: "Distribute",
      description: "Marketers grab unique tracking links and smart coupons to promote your product to their audience.",
    },
    {
      number: "03",
      title: "Automated Split",
      description: "When a sale happens, funds are held during the refund window, then automatically split via Stripe Connect.",
    },
  ];

  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-[#3D2B1F] rounded-[2.5rem] p-8 md:p-16 relative overflow-hidden"
        >
          {/* Clean background without glows */}

          <div className="relative z-10 mb-16 text-center max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
              Complex payouts.<br />
              <span className="text-[#FFB347]">Simplified.</span>
            </h2>
            <p className="text-lg text-white/60 max-w-md mx-auto leading-relaxed">
              We built the infrastructure so you don&apos;t have to. From first click to final deposit, the funds move automatically.
            </p>
          </div>

          <div className="relative z-10 grid md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <LifecycleStep
                key={i}
                {...step}
                delay={0.2 + (i * 0.1)}
              />
            ))}
          </div>

          <div className="mt-16 text-center">
            <div className="inline-flex gap-6 text-xs text-white/40 font-medium tracking-wide uppercase justify-center">
              <span>Stripe Verified</span>
              <span className="text-white/20">•</span>
              <span>Refund Protected</span>
            </div>
          </div>

        </motion.div>
      </div>
    </section>
  );
}
