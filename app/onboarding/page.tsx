"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Globe, 
  MapPin, 
  Briefcase, 
  BarChart3, 
  ShieldCheck, 
  UserCircle 
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types for onboarding state
type OnboardingData = {
  intent: string;
  promotionMethods: string[];
  location: string;
  language: string;
  experience: string;
  productTypes: string[];
  earningGoal: string;
  displayName: string;
  bio: string;
  website: string;
  agreedToTerms: boolean;
};

const STEPS_COUNT = 9;

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({
    intent: "",
    promotionMethods: [],
    location: "",
    language: "English",
    experience: "",
    productTypes: [],
    earningGoal: "",
    displayName: "",
    bio: "",
    website: "",
    agreedToTerms: false,
  });

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, STEPS_COUNT));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const togglePromotionMethod = (method: string) => {
    setData((prev) => ({
      ...prev,
      promotionMethods: prev.promotionMethods.includes(method)
        ? prev.promotionMethods.filter((m) => m !== method)
        : [...prev.promotionMethods, method],
    }));
  };

  const toggleProductType = (type: string) => {
    setData((prev) => ({
      ...prev,
      productTypes: prev.productTypes.includes(type)
        ? prev.productTypes.filter((t) => t !== type)
        : [...prev.productTypes, type],
    }));
  };

  const progress = (currentStep / STEPS_COUNT) * 100;

  return (
    <div className="flex min-h-screen bg-background font-sans selection:bg-primary/20">
      {/* Left Panel: Value Prop / Illustration */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary/5 p-12 lg:flex">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-12">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold italic">R</div>
            <span className="text-xl font-bold tracking-tight">RevShare</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="max-w-md"
            >
              {currentStep === 1 && (
                <>
                  <h2 className="mb-6 text-4xl font-bold leading-tight">Earn from real products, transparently.</h2>
                  <p className="mb-8 text-lg text-muted-foreground">Promote SaaS, ecommerce, and apps. Get paid based on real revenue — not clicks.</p>
                  <ul className="space-y-4">
                    {[
                      "Real revenue commissions",
                      "Clear payout timelines",
                      "No fees for marketers"
                    ].map((bullet, i) => (
                      <li key={i} className="flex items-center gap-3 text-sm font-medium">
                        <CheckCircle2 className="size-5 text-primary" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {currentStep > 1 && currentStep < 9 && (
                <div className="space-y-6">
                  {/* <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    {currentStep === 2 && <Globe className="size-8 text-primary" />}
                    {currentStep === 3 && <MapPin className="size-8 text-primary" />}
                    {currentStep === 4 && <Briefcase className="size-8 text-primary" />}
                    {currentStep === 5 && <BarChart3 className="size-8 text-primary" />}
                    {currentStep === 6 && <ShieldCheck className="size-8 text-primary" />}
                    {currentStep === 7 && <ShieldCheck className="size-8 text-primary" />}
                    {currentStep === 8 && <UserCircle className="size-8 text-primary" />}
                  </div> */}
                  <h2 className="text-3xl font-bold leading-tight">
                    {currentStep === 2 && "Personalizing your experience."}
                    {currentStep === 3 && "Reaching the right world."}
                    {currentStep === 4 && "Respecting your craft."}
                    {currentStep === 5 && "Curating your catalog."}
                    {currentStep === 6 && "Anchoring your success."}
                    {currentStep === 7 && "Trust is our currency."}
                    {currentStep === 8 && "Building your profile."}
                  </h2>
                  <p className="text-lg text-muted-foreground">
                    {currentStep === 2 && "Tell us how you grow products so we can match you with the best programs."}
                    {currentStep === 3 && "Location helps us filter programs that work best for your specific audience."}
                    {currentStep === 4 && "Whether you're starting out or a seasoned pro, we have opportunities for you."}
                    {currentStep === 5 && "Choose the niches you're most passionate about to boost your conversion."}
                    {currentStep === 6 && "Setting a goal helps us recommend programs that can realistically get you there."}
                    {currentStep === 7 && "Transparency is at the core of RevShare. Here is how we ensure fairness."}
                    {currentStep === 8 && "Your profile helps creators understand who you are and why they should work with you."}
                  </p>
                </div>
              )}
              {currentStep === 9 && (
                <>
                  <h2 className="mb-6 text-4xl font-bold leading-tight italic line-through decoration-primary decoration-4">You&apos;re ready.</h2>
                  <h2 className="mb-6 text-4xl font-bold leading-tight">Start earning today.</h2>
                  <p className="text-lg text-muted-foreground">Welcome to the RevShare community. Your dashboard is now tailored to your goals.</p>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Decorative elements */}
        <div className="absolute -bottom-24 -left-24 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      {/* Right Panel: Content */}
      <div className="flex w-full flex-col">
        {/* Header/Progress */}
        <div className="flex h-16 items-center justify-between px-8">
          <div className="lg:hidden flex items-center gap-2">
            <div className="size-6 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold italic text-xs">R</div>
            <span className="font-bold tracking-tight text-sm">RevShare</span>
          </div>
          <div className="hidden lg:flex flex-1 items-center justify-end gap-4 max-w-sm m-auto">
             <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary/50">
               <motion.div 
                 className="h-full bg-primary"
                 initial={{ width: 0 }}
                 animate={{ width: `${progress}%` }}
               />
             </div>
             {/* <span className="text-xs font-semibold tabular-nums text-muted-foreground">
               {currentStep}/{STEPS_COUNT}
             </span> */}
          </div>
        </div>

        {/* Form Area */}
        <div className="flex flex-1 flex-col justify-center px-8 py-12 lg:px-24">
          <div className="mx-auto w-full max-w-xl">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.02, y: -10 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                {/* Step 1: Welcome */}
                {currentStep === 1 && (
                  <div className="space-y-8">
                    <div className="space-y-2 text-center lg:text-left">
                      <h1 className="text-4xl font-bold tracking-tight">Welcome to RevShare.</h1>
                      <p className="text-lg text-muted-foreground">Let&apos;s set up your earning profile.</p>
                    </div>
                    <div className="lg:hidden space-y-4 py-6">
                       <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Why join?</p>
                       <ul className="space-y-4">
                        {[
                          "Real revenue commissions",
                          "Clear payout timelines",
                          "No fees for marketers"
                        ].map((bullet, i) => (
                          <li key={i} className="flex items-center gap-3 text-sm font-medium">
                            <CheckCircle2 className="size-5 text-primary" />
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Step 2: Promotion Methods */}
                {currentStep === 2 && (
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <h1 className="text-3xl font-bold tracking-tight">How do you usually promote products?</h1>
                      <p className="text-muted-foreground">Select all that apply.</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        { id: "content", label: "Content", sub: "YouTube, TikTok, Instagram", icon: "🎥", color: "bg-blue-50/80" },
                        { id: "seo", label: "Blog / SEO", sub: "Websites and articles", icon: "✍️", color: "bg-green-50/80" },
                        { id: "newsletter", label: "Newsletter", sub: "Email lists", icon: "📧", color: "bg-orange-50/80" },
                        { id: "community", label: "Community", sub: "Discord, Slack, etc.", icon: "🤝", color: "bg-purple-50/80" },
                        { id: "outreach", label: "Direct outreach", sub: "B2B / 1:1 sales", icon: "💼", color: "bg-pink-50/80" },
                        { id: "exploring", label: "Still exploring", sub: "New to the game", icon: "🧪", color: "bg-amber-50/80" },
                      ].map((item) => (
                        <Card
                          key={item.id}
                          className={cn(
                            "cursor-pointer p-4 transition-all duration-300 border-none rounded-3xl shadow-none",
                            item.color,
                            `ring-0`,
                            data.promotionMethods.includes(item.id) 
                              ? "ring-4 ring-primary/40 bg-primary/10" 
                              : "hover:bg-primary/5"
                          )}
                          onClick={() => togglePromotionMethod(item.id)}
                        >
                          <div className="flex items-start gap-3">
                            {/* <span className="text-2xl">{item.icon}</span> */}
                            <div>
                              <p className="font-semibold">{item.label}</p>
                              <p className="text-xs text-muted-foreground">{item.sub}</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Audience Reach */}
                {currentStep === 3 && (
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <h1 className="text-3xl font-bold tracking-tight">Where is your audience mostly located?</h1>
                      <p className="text-muted-foreground">This helps us show you relevant regional programs.</p>
                    </div>
                    <div className="space-y-6">
                      <div className="grid gap-3">
                        {[
                          { id: "worldwide", label: "Worldwide" },
                          { id: "north-america", label: "North America" },
                          { id: "europe", label: "Europe" },
                          { id: "other", label: "Other regions" },
                        ].map((item) => (
                          <Button
                            key={item.id}
                            variant="ghost"
                            className={cn(
                              "h-16 justify-start text-lg px-6 border-none rounded-3xl transition-all cursor-pointer",
                              data.location === item.id
                                ? "bg-primary text-primary-foreground hover:bg-primary/80" 
                                : "bg-secondary/30 hover:bg-primary/50"
                            )}
                            onClick={() => updateData({ location: item.id })}
                          >
                            {item.label}
                          </Button>
                        ))}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="language" className="text-sm font-medium text-muted-foreground ml-2">Primary language (optional)</Label>
                        <Input 
                          id="language"
                          placeholder="e.g. English, Portuguese..."
                          value={data.language}
                          onChange={(e) => updateData({ language: e.target.value })}
                          className="h-14 border-none bg-secondary/30 rounded-3xl px-6 focus-visible:ring-primary/30"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Experience Level */}
                {currentStep === 4 && (
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <h1 className="text-3xl font-bold tracking-tight">What best describes your experience?</h1>
                      <p className="text-muted-foreground">This helps us recommend programs that fit you.</p>
                    </div>
                    <div className="space-y-3">
                      {[
                        { id: "beginner", title: "Just getting started", desc: "I'm looking for my first win.", color: "bg-indigo-50/50" },
                        { id: "intermediate", title: "Some experience", desc: "I've earned commissions before.", color: "bg-cyan-50/50" },
                        { id: "pro", title: "Professional / full-time", desc: "This is my primary income source.", color: "bg-rose-50/50" },
                        { id: "agency", title: "Agency / team", desc: "We manage multiple accounts/brands.", color: "bg-teal-50/50" },
                      ].map((item) => (
                        <Card
                          key={item.id}
                          className={cn(
                            "cursor-pointer p-6 transition-all duration-300 border-none rounded-3xl shadow-none",
                            item.color,
                            "ring-0",
                            data.experience === item.id 
                              ? "ring-4 ring-primary/40 bg-primary/10" 
                              : "hover:bg-primary/5"
                          )}
                          onClick={() => updateData({ experience: item.id })}
                        >
                          <div className="space-y-1">
                            <p className="text-lg font-bold">{item.title}</p>
                            <p className="text-sm text-muted-foreground">{item.desc}</p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 5: Product Types */}
                {currentStep === 5 && (
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <h1 className="text-3xl font-bold tracking-tight">What do you want to promote?</h1>
                      <p className="text-muted-foreground">Your marketplace will be tailored to these choices.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "SaaS & subscriptions",
                        "Ecommerce / DTC",
                        "Mobile apps",
                        "Digital products",
                        "Education / Courses",
                        "Fintech",
                        "Health & Wellness",
                        "Open to anything"
                      ].map((type) => (
                        <Badge
                          key={type}
                          variant="secondary"
                          className={cn(
                            "cursor-pointer px-6 py-3 mx-3 h-10 text-sm transition-all duration-300 select-none border-none rounded-full",
                            data.productTypes.includes(type) 
                              ? "bg-primary text-primary-foreground scale-105" 
                              : "bg-secondary/40 hover:bg-secondary/60 text-secondary-foreground"
                          )}
                          onClick={() => toggleProductType(type)}
                        >
                          {type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 6: Earning Goals */}
                {currentStep === 6 && (
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <h1 className="text-3xl font-bold tracking-tight">What&apos;s your monthly earning goal?</h1>
                      <p className="text-muted-foreground">No pressure — this helps us tailor opportunities.</p>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {[
                        "$100–$500",
                        "$500–$2,000",
                        "$2,000–$10,000",
                        "$10,000+"
                      ].map((goal, i) => (
                        <Card
                          key={goal}
                          className={cn(
                            "flex h-24 cursor-pointer items-center justify-center text-xl font-bold transition-all duration-300 border-none rounded-3xl shadow-none",
                            [
                              "bg-red-50/50",
                              "bg-blue-50/50",
                              "bg-green-50/50",
                              "bg-purple-50/50"
                            ][i],
                            "ring-0",
                            data.earningGoal === goal 
                              ? "ring-4 ring-primary/40 bg-primary/10" 
                              : "hover:bg-primary/5"
                          )}
                          onClick={() => updateData({ earningGoal: goal })}
                        >
                          {goal}
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 7: Transparency & Rules */}
                {currentStep === 7 && (
                  <div className="space-y-8">
                    <div className="space-y-2 text-center text-balance">
                      <h1 className="text-3xl font-bold tracking-tight">How earnings work on RevShare.</h1>
                    </div>
                    <div className="space-y-6 rounded-3xl bg-secondary/20 p-8 border-none">
                      <ul className="space-y-6">
                        {[
                          "Commissions are based on real revenue",
                          "Refund windows apply before payouts",
                          "Payout timing is shown upfront per program",
                          "Payments are handled via Stripe"
                        ].map((rule, i) => (
                          <motion.li 
                            key={i} 
                            className="flex items-center gap-4 text-base font-medium"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                          >
                            <div className="size-6 rounded-full bg-primary/20 flex items-center justify-center">
                               <CheckCircle2 className="size-4 text-primary" />
                            </div>
                            {rule}
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex items-center space-x-3 rounded-3xl border-none p-5 bg-secondary/20">
                      <Checkbox 
                        id="terms" 
                        checked={data.agreedToTerms}
                        onCheckedChange={(checked) => updateData({ agreedToTerms: checked as boolean })}
                        className="rounded-md bg-background data-[state=checked]:bg-primary"
                      />
                      <label 
                        htmlFor="terms" 
                        className="text-sm font-medium leading-none cursor-pointer select-none"
                      >
                        I understand and agree to the marketplace rules.
                      </label>
                    </div>
                  </div>
                )}

                {/* Step 8: Profile Signal */}
                {currentStep === 8 && (
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <h1 className="text-3xl font-bold tracking-tight">How should creators see you?</h1>
                      <p className="text-muted-foreground">Give brands confidence in your partnership.</p>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="displayName" className="ml-2">Display Name</Label>
                        <Input 
                           id="displayName"
                           placeholder="Your full name or brand name"
                           value={data.displayName}
                           autoFocus
                           onChange={(e) => updateData({ displayName: e.target.value })}
                           className="h-14 border-none bg-secondary/30 rounded-3xl px-6 focus-visible:ring-primary/30"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bio" className="ml-2">Short bio (1–2 lines)</Label>
                        <Input 
                           id="bio"
                           placeholder="e.g. I create content about AI tools and SaaS."
                           value={data.bio}
                           onChange={(e) => updateData({ bio: e.target.value })}
                           className="h-14 border-none bg-secondary/30 rounded-3xl px-6 focus-visible:ring-primary/30"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="website" className="ml-2">𝕏 handle</Label>
                        <Input 
                           id="website"
                           placeholder="@..."
                           value={data.website}
                           onChange={(e) => updateData({ website: e.target.value })}
                           className="h-14 border-none bg-secondary/30 rounded-3xl px-6 focus-visible:ring-primary/30"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 9: Done */}
                {currentStep === 9 && (
                  <div className="space-y-8 text-center">
                    <div className="space-y-2">
                      <h1 className="text-4xl font-bold tracking-tight">You&apos;re ready to earn.</h1>
                      <p className="text-muted-foreground text-lg">Welcome to the RevShare network.</p>
                    </div>
                    <div className="space-y-4 py-8">
                      <div className="flex flex-col gap-3">
                         {[
                           "Browse available programs instantly",
                           "Apply instantly or request special access",
                           "Track conversions in real time"
                         ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 text-sm font-medium text-left bg-secondary/20 p-5 rounded-3xl border-none">
                              <div className="size-2 rounded-full bg-primary animate-pulse" />
                              {item}
                            </div>
                         ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Navigation Buttons - Integrated inline */}
                <div className="mt-12 flex items-center justify-between pt-8 border-t border-transparent">
                  <Button
                    variant="ghost"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                    className={cn(
                      "rounded-3xl h-12 px-6",
                      currentStep === 1 && "invisible"
                    )}
                  >
                    <ArrowLeft className="mr-2 size-4" />
                    Back
                  </Button>

                  {currentStep < 9 ? (
                    <Button 
                      size="lg" 
                      onClick={nextStep}
                      className="px-10 h-14 rounded-3xl border-none transition-all hover:scale-105 active:scale-95"
                      disabled={currentStep === 7 && !data.agreedToTerms}
                    >
                      Continue
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                  ) : (
                    <Button size="lg" className="px-10 h-14 rounded-3xl border-none transition-all hover:scale-105 active:scale-95">
                      Browse programs
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
