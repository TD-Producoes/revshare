"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { OnboardingNavigation } from "@/components/onboarding/onboarding-navigation";
import { OnboardingStepWrapper } from "@/components/onboarding/onboarding-step-wrapper";
import { SelectableCard } from "@/components/onboarding/selectable-card";
import { OnboardingInput } from "@/components/onboarding/onboarding-input";
import { BulletList } from "@/components/onboarding/bullet-list";
import { SelectableBadge } from "@/components/onboarding/selectable-badge";
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

  // Left panel content based on current step
  const renderLeftPanelContent = () => {
    if (currentStep === 1) {
      return (
        <>
          <h2 className="mb-6 text-4xl font-black leading-tight tracking-tight">
            Earn from real products.
          </h2>
          <p className="mb-8 text-lg text-muted-foreground tracking-tight">
            Promote SaaS, ecommerce, and apps. Get paid based on real revenue — not clicks.
          </p>
          <BulletList
            items={[
              "Real revenue commissions",
              "Clear payout timelines",
              "No fees for marketers",
            ]}
            className="space-y-4"
          />
        </>
      );
    }

    if (currentStep > 1 && currentStep < 9) {
      return (
        <div className="space-y-6">
          <h2 className="text-4xl font-black leading-tight tracking-tight">
            {currentStep === 2 && "Personalizing your experience."}
            {currentStep === 3 && "Reaching the right world."}
            {currentStep === 4 && "Respecting your craft."}
            {currentStep === 5 && "Curating your catalog."}
            {currentStep === 6 && "Anchoring your success."}
            {currentStep === 7 && "Trust is our currency."}
            {currentStep === 8 && "Building your profile."}
          </h2>
          <p className="text-lg text-muted-foreground tracking-tight text-balance font-bold">
            {currentStep === 2 &&
              "Tell us how you grow products so we can match you with the best programs."}
            {currentStep === 3 &&
              "Location helps us filter programs that work best for your specific audience."}
            {currentStep === 4 &&
              "Whether you&apos;re starting out or a seasoned pro, we have opportunities for you."}
            {currentStep === 5 &&
              "Choose the niches you're most passionate about to boost your conversion."}
            {currentStep === 6 &&
              "Setting a goal helps us recommend programs that can realistically get you there."}
            {currentStep === 7 &&
              "Transparency is at the core of RevShare. Here is how we ensure fairness."}
            {currentStep === 8 &&
              "Your profile helps founders understand who you are and why they should work with you."}
          </p>
        </div>
      );
    }

    if (currentStep === 9) {
      return (
        <>
          <h2 className="mb-6 text-4xl font-black leading-tight tracking-tight">
            You&apos;re ready.
          </h2>
          <h2 className="mb-6 text-4xl font-black leading-tight tracking-tight">
            Start earning.
          </h2>
          <p className="text-lg text-muted-foreground tracking-tight font-bold">
            Welcome to the RevShare community. Your dashboard is now tailored to your goals.
          </p>
        </>
      );
    }
  };

  // Right panel content (form steps)
  const renderRightPanelContent = () => {
    return (
      <>
        <OnboardingProgress currentStep={currentStep} totalSteps={STEPS_COUNT} />

        <OnboardingStepWrapper currentStep={currentStep}>
          {/* Step 1: Welcome */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <div className="space-y-1.5 text-center lg:text-left">
                <h1 className="text-3xl font-black tracking-tight">Welcome to RevShare.</h1>
                <p className="text-base text-muted-foreground tracking-tight font-bold">
                  Let&apos;s set up your earning profile.
                </p>
              </div>
              <div className="lg:hidden space-y-3 py-4">
                <BulletList
                  items={[
                    "Real revenue commissions",
                    "Clear payout timelines",
                    "No fees for marketers",
                  ]}
                  className="space-y-3"
                />
              </div>
            </div>
          )}

          {/* Step 2: Promotion Methods */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-black tracking-tight">
                  How do you usually promote products?
                </h1>
                <p className="text-sm text-muted-foreground tracking-tight font-bold">
                  Select all that apply.
                </p>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
                {[
                  {
                    id: "content",
                    label: "Content",
                    sub: "YouTube, TikTok, Instagram",
                    color: "bg-blue-50/50",
                  },
                  {
                    id: "seo",
                    label: "Blog / SEO",
                    sub: "Websites and articles",
                    color: "bg-green-50/50",
                  },
                  {
                    id: "newsletter",
                    label: "Newsletter",
                    sub: "Email lists",
                    color: "bg-orange-50/50",
                  },
                  {
                    id: "community",
                    label: "Community",
                    sub: "Discord, Slack, etc.",
                    color: "bg-purple-50/50",
                  },
                  {
                    id: "outreach",
                    label: "Direct outreach",
                    sub: "B2B / 1:1 sales",
                    color: "bg-pink-50/50",
                  },
                  {
                    id: "exploring",
                    label: "Still exploring",
                    sub: "New to the game",
                    color: "bg-amber-50/50",
                  },
                ].map((item) => (
                  <SelectableCard
                    key={item.id}
                    selected={data.promotionMethods.includes(item.id)}
                    onClick={() => togglePromotionMethod(item.id)}
                    color={item.color}
                    className="p-4"
                  >
                    <div>
                      <p className="font-black text-base tracking-tight">{item.label}</p>
                      <p
                        className={cn(
                          "text-[11px] font-bold mt-0.5",
                          data.promotionMethods.includes(item.id)
                            ? "text-primary-foreground/80"
                            : "text-muted-foreground"
                        )}
                      >
                        {item.sub}
                      </p>
                    </div>
                  </SelectableCard>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Audience Reach */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-black tracking-tight">
                  Where is your audience mostly located?
                </h1>
                <p className="text-sm text-muted-foreground tracking-tight font-bold">
                  This helps us show you relevant regional programs.
                </p>
              </div>
              <div className="space-y-4">
                <div className="grid gap-2.5">
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
                        "h-12 justify-start text-base px-6 border-none rounded-2xl transition-all font-black tracking-tight shadow-none cursor-pointer",
                        data.location === item.id
                          ? "bg-primary hover:bg-primary/70 text-primary-foreground"
                          : "bg-secondary/30 hover:bg-primary/50"
                      )}
                      onClick={() => updateData({ location: item.id })}
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
                <OnboardingInput
                  id="language"
                  label="Primary language (optional)"
                  value={data.language}
                  onChange={(value) => updateData({ language: value })}
                  placeholder="English"
                />
              </div>
            </div>
          )}

          {/* Step 4: Experience Level */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-black tracking-tight">
                  What best describes your experience?
                </h1>
                <p className="text-sm text-muted-foreground tracking-tight font-bold">
                  This helps us recommend programs that fit you.
                </p>
              </div>
              <div className="space-y-2.5">
                {[
                  {
                    id: "beginner",
                    title: "Just getting started",
                    desc: "I'm looking for my first win.",
                    color: "bg-indigo-50/50",
                  },
                  {
                    id: "intermediate",
                    title: "Some experience",
                    desc: "I've earned commissions before.",
                    color: "bg-cyan-50/50",
                  },
                  {
                    id: "pro",
                    title: "Professional / full-time",
                    desc: "This is my primary income source.",
                    color: "bg-rose-50/50",
                  },
                  {
                    id: "agency",
                    title: "Agency / team",
                    desc: "We manage multiple accounts/brands.",
                    color: "bg-teal-50/50",
                  },
                  ].map((item) => (
                  <SelectableCard
                    key={item.id}
                    selected={data.experience === item.id}
                    onClick={() => updateData({ experience: item.id })}
                    color={item.color}
                    className="p-4"
                  >
                    <div className="space-y-0.5">
                      <p className="text-base font-black tracking-tight">{item.title}</p>
                      <p
                        className={cn(
                          "text-[11px] font-bold",
                          data.experience === item.id
                            ? "text-primary-foreground/80"
                            : "text-muted-foreground"
                        )}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </SelectableCard>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Product Types */}
          {currentStep === 5 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-black tracking-tight">What do you want to promote?</h1>
                <p className="text-sm text-muted-foreground tracking-tight font-bold">
                  Your marketplace will be tailored to these choices.
                </p>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {[
                  "SaaS & subscriptions",
                  "Ecommerce / DTC",
                  "Mobile apps",
                  "Digital products",
                  "Education / Courses",
                  "Fintech",
                  "Health & Wellness",
                  "Open to anything",
                ].map((type) => (
                  <SelectableBadge
                    key={type}
                    label={type}
                    selected={data.productTypes.includes(type)}
                    onClick={() => toggleProductType(type)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Step 6: Earning Goals */}
          {currentStep === 6 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-black tracking-tight">
                  What&apos;s your monthly earning goal?
                </h1>
                <p className="text-sm text-muted-foreground tracking-tight font-bold">
                  No pressure — this helps us tailor opportunities.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  "$100–$500",
                  "$500–$2,000",
                  "$2,000–$10,000",
                  "$10,000+",
                ].map((goal, i) => (
                  <SelectableCard
                    key={goal}
                    selected={data.earningGoal === goal}
                    onClick={() => updateData({ earningGoal: goal })}
                    color={[
                      "bg-red-50/50",
                      "bg-blue-50/50",
                      "bg-green-50/50",
                      "bg-purple-50/50",
                    ][i]}
                    height="h-20"
                    className="flex items-center justify-center text-xl font-black"
                  >
                    {goal}
                  </SelectableCard>
                ))}
              </div>
            </div>
          )}

          {/* Step 7: Transparency & Rules */}
          {currentStep === 7 && (
            <div className="space-y-5">
              <div className="space-y-1.5 text-center text-balance border-none">
                <h1 className="text-2xl font-black tracking-tight">
                  How earnings work on RevShare.
                </h1>
              </div>
              <div className="space-y-4 rounded-2xl bg-secondary/20 p-6 border-none">
                <BulletList
                  items={[
                    "Commissions are based on real revenue",
                    "Refund windows apply before payouts",
                    "Payout timing is shown upfront per program",
                    "Payments are handled via Stripe",
                  ]}
                  className="space-y-3"
                  animate
                />
              </div>
              <div className="flex items-center space-x-3 rounded-2xl border-none p-4 bg-secondary/30">
                <Checkbox
                  id="terms"
                  checked={data.agreedToTerms}
                  onCheckedChange={(checked) =>
                    updateData({ agreedToTerms: checked as boolean })
                  }
                  className="size-6 rounded-md bg-background data-[state=checked]:bg-primary shadow-none"
                />
                <label
                  htmlFor="terms"
                  className="text-[12px] font-black leading-none cursor-pointer select-none"
                >
                  I understand and agree to the rules.
                </label>
              </div>
            </div>
          )}

          {/* Step 8: Profile Signal */}
          {currentStep === 8 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-black tracking-tight">
                  How should founders see you?
                </h1>
                <p className="text-sm text-muted-foreground tracking-tight font-bold">
                  Give brands confidence in your partnership.
                </p>
              </div>
              <div className="space-y-4">
                <OnboardingInput
                  id="displayName"
                  label="Display Name"
                  value={data.displayName}
                  onChange={(value) => updateData({ displayName: value })}
                  placeholder="Your full name"
                  autoFocus
                />
                <OnboardingInput
                  id="bio"
                  label="Short bio (1–2 lines)"
                  value={data.bio}
                  onChange={(value) => updateData({ bio: value })}
                  placeholder="I create content about AI tools"
                />
                <OnboardingInput
                  id="website"
                  label="Social link (optional)"
                  value={data.website}
                  onChange={(value) => updateData({ website: value })}
                  placeholder="https://..."
                />
              </div>
            </div>
          )}

          {/* Step 9: Done */}
          {currentStep === 9 && (
            <div className="space-y-6 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-black tracking-tight">
                  You&apos;re ready to earn.
                </h1>
                <p className="text-muted-foreground text-base tracking-tight font-bold">
                  Welcome to the RevShare network.
                </p>
              </div>
              <div className="space-y-3">
                <div className="flex flex-col gap-3">
                  {[
                    "Browse available programs instantly",
                    "Apply instantly or request special access",
                    "Track conversions in real time",
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 text-sm font-bold text-left bg-secondary/20 p-3 rounded-2xl border-none text-muted-foreground"
                    >
                      <div className="size-1.5 rounded-full bg-primary" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <OnboardingNavigation
            currentStep={currentStep}
            totalSteps={STEPS_COUNT}
            onBack={prevStep}
            onNext={nextStep}
            finalButtonText="Browse programs"
            disableNext={currentStep === 7 && !data.agreedToTerms}
          />
        </OnboardingStepWrapper>
      </>
    );
  };

  return (
    <OnboardingLayout
      currentStep={currentStep}
      leftPanelContent={renderLeftPanelContent()}
      rightPanelContent={renderRightPanelContent()}
    />
  );
}
