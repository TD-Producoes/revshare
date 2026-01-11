"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { OnboardingNavigation } from "@/components/onboarding/onboarding-navigation";
import { OnboardingStepWrapper } from "@/components/onboarding/onboarding-step-wrapper";
import { SelectableCard } from "@/components/onboarding/selectable-card";
import { OnboardingInput } from "@/components/onboarding/onboarding-input";
import { BulletList } from "@/components/onboarding/bullet-list";
import { SelectableBadge } from "@/components/onboarding/selectable-badge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Types for creator onboarding state
type CreatorOnboardingData = {
  productType: string;
  projectName: string;
  tagline: string;
  website: string;
  targetMarketers: string[];
  audienceFocus: string;
  industryTags: string[];
  commissionType: "percentage" | "flat";
  commissionValue: number;
  recurring: boolean;
  productAccess: string;
  refundWindow: string;
  approvalType: "instant" | "request";
  limitMarketers: boolean;
};

const STEPS_COUNT = 11;

export default function CreatorOnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<CreatorOnboardingData>({
    productType: "",
    projectName: "",
    tagline: "",
    website: "",
    targetMarketers: [],
    audienceFocus: "",
    industryTags: [],
    commissionType: "percentage",
    commissionValue: 20,
    recurring: true,
    productAccess: "Demo",
    refundWindow: "30",
    approvalType: "request",
    limitMarketers: false,
  });

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, STEPS_COUNT));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const updateData = (updates: Partial<CreatorOnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const toggleTargetMarketer = (method: string) => {
    setData((prev) => ({
      ...prev,
      targetMarketers: prev.targetMarketers.includes(method)
        ? prev.targetMarketers.filter((m) => m !== method)
        : [...prev.targetMarketers, method],
    }));
  };

  const toggleIndustryTag = (tag: string) => {
    setData((prev) => ({
      ...prev,
      industryTags: prev.industryTags.includes(tag)
        ? prev.industryTags.filter((t) => t !== tag)
        : [...prev.industryTags, tag],
    }));
  };

  // Mock matched marketers for Step 10
  const matchedMarketers = [
    {
      name: "Alex Rivers",
      style: "YouTube / SaaS",
      region: "North America",
      color: "bg-blue-50/50",
    },
    {
      name: "Sarah Chen",
      style: "Blog / SEO",
      region: "Worldwide",
      color: "bg-green-50/50",
    },
    {
      name: "David Miller",
      style: "Newsletter",
      region: "Europe",
      color: "bg-purple-50/50",
    },
  ];

  // Left panel content based on current step
  const renderLeftPanelContent = () => {
    if (currentStep === 1) {
      return (
        <>
          <h2 className="mb-6 text-4xl font-black leading-tight tracking-tight">
            Turn revenue into a growth engine.
          </h2>
          <p className="mb-8 text-lg text-muted-foreground font-bold tracking-tight">
            Launch an affiliate program where marketers earn from real revenue —
            transparently and fairly.
          </p>
          <BulletList
            items={[
              "Revenue-based commissions",
              "Refund-aware payouts",
              "No upfront costs",
            ]}
            className="space-y-4"
          />
        </>
      );
    }

    if (currentStep === 3 && data.projectName) {
      return (
        <div className="space-y-6">
          <p className="text-[12px] font-black text-primary/60">Live Preview</p>
          <Card className="p-8 border-none rounded-3xl bg-background shadow-none space-y-4">
            <div className="flex items-start justify-between">
              <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center text-4xl font-black">
                {data.projectName.charAt(0) || "P"}
              </div>
              <Badge
                variant="secondary"
                className="rounded-full px-4 py-1 font-black text-[12px]"
              >
                New Program
              </Badge>
            </div>
            <div>
              <p className="text-2xl font-black tracking-tight">
                {data.projectName || "Your Project Name"}
              </p>
              <p className="text-muted-foreground text-[12px] line-clamp-2 font-black">
                {data.tagline || "Your awesome tagline goes here..."}
              </p>
            </div>
            <div className="pt-4 flex items-center gap-8 border-t border-dashed">
              <div>
                <p className="text-[12px] text-muted-foreground font-black">Commission</p>
                <p className="font-black text-primary text-xl">
                  {data.commissionValue}
                  {data.commissionType === "percentage" ? "%" : "$"}
                </p>
              </div>
              <div>
                <p className="text-[12px] text-muted-foreground font-black">Refund Window</p>
                <p className="font-black text-xl">{data.refundWindow} Days</p>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    if (currentStep !== 1 && currentStep !== 3 && currentStep < 10) {
      return (
        <div className="space-y-6">
          <h2 className="text-4xl font-black leading-tight tracking-tight">
            {currentStep === 2 && "Defining your project."}
            {currentStep === 4 && "Finding your partners."}
            {currentStep === 5 && "Incentivizing growth."}
            {currentStep === 6 && "Enabling success."}
            {currentStep === 7 && "Setting trust rules."}
            {currentStep === 8 && "Maintaining control."}
            {currentStep === 9 && "Everything looks perfect."}
          </h2>
          <p className="text-lg text-muted-foreground tracking-tight text-balance font-bold">
            {currentStep === 2 &&
              "The type of product helps us suggest the best default settings for your program."}
            {currentStep === 4 &&
              "Targeting the right marketers ensures your product is promoted to the right audience."}
            {currentStep === 5 &&
              "Higher commissions generally attract more experienced and high-capacity marketers."}
            {currentStep === 6 &&
              "Giving marketers access to your product helps them create high-quality, authentic content."}
            {currentStep === 7 &&
              "Refund windows protect your business while maintaining transparency with partners."}
            {currentStep === 8 &&
              "Flexible approval options let you decide who represents your brand."}
            {currentStep === 9 &&
              "Review your program details before we go live. You can always change these later."}
          </p>
        </div>
      );
    }

    if (currentStep === 10) {
      return (
        <div className="space-y-8">
          <h2 className="text-4xl font-black leading-tight tracking-tight">Instant magic.</h2>
          <p className="text-lg text-muted-foreground tracking-tight font-bold">
            Based on your program settings, these marketers are a perfect match.
          </p>
          <div className="space-y-4">
            {matchedMarketers.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/10 p-4 rounded-3xl flex items-center justify-between border-none"
              >
                <div className="flex items-center gap-4">
                  <div className={cn("size-10 rounded-full", m.color)} />
                  <div>
                    <p className="text-sm font-black tracking-tight">{m.name}</p>
                    <p className="text-[12px] text-muted-foreground font-bold">{m.style}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="text-[12px] font-black">
                  Match
                </Badge>
              </motion.div>
            ))}
          </div>
        </div>
      );
    }

    if (currentStep === 11) {
      return (
        <div className="space-y-6">
          <h2 className="text-4xl font-black leading-tight tracking-tight">Launch ready.</h2>
          <p className="text-lg text-muted-foreground tracking-tight font-bold">
            Your program is defined. Now let&apos;s connect the tech and start growing.
          </p>
        </div>
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
                <h1 className="text-3xl font-black tracking-tight">Create your program.</h1>
                <p className="text-base text-muted-foreground tracking-tight font-bold">
                  Let&apos;s define how marketers will grow your business.
                </p>
              </div>
              <div className="lg:hidden space-y-3 py-4">
                <BulletList
                  items={[
                    "Revenue-based commissions",
                    "Refund-aware payouts",
                    "No upfront costs",
                  ]}
                  className="space-y-3"
                />
              </div>
            </div>
          )}

          {/* Step 2: Product Type */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-black tracking-tight">
                  What type of product are you promoting?
                </h1>
                <p className="text-sm text-muted-foreground tracking-tight font-bold">
                  This helps us suggest optimized program settings for your niche.
                </p>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-1">
                {[
                  { id: "saas", label: "SaaS / Subscription", color: "bg-blue-50/50" },
                  { id: "ecommerce", label: "Ecommerce / DTC", color: "bg-green-50/50" },
                  { id: "mobile", label: "Mobile app", color: "bg-orange-50/50" },
                  { id: "digital", label: "Digital product", color: "bg-purple-50/50" },
                  { id: "other", label: "Other", color: "bg-amber-50/50" },
                ].map((item) => (
                  <SelectableCard
                    key={item.id}
                    selected={data.productType === item.id}
                    onClick={() => updateData({ productType: item.id })}
                    color={item.color}
                    className="flex items-center px-6 p-4"
                  >
                    <p className="text-base font-black tracking-tight">{item.label}</p>
                  </SelectableCard>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Project Basics */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-black tracking-tight">Project basics.</h1>
                <p className="text-sm text-muted-foreground tracking-tight font-bold">
                  How should marketers discover and identify you?
                </p>
              </div>
              <div className="space-y-4">
                <OnboardingInput
                  id="pName"
                  label="Project Name"
                  value={data.projectName}
                  onChange={(value) => updateData({ projectName: value })}
                  placeholder="Acme Analytics"
                  autoFocus
                />
                <OnboardingInput
                  id="tagline"
                  label="Short tagline"
                  value={data.tagline}
                  onChange={(value) => updateData({ tagline: value })}
                  placeholder="AI-powered insights"
                />
                <OnboardingInput
                  id="url"
                  label="Website URL"
                  value={data.website}
                  onChange={(value) => updateData({ website: value })}
                  placeholder="https://..."
                />
              </div>
            </div>
          )}

          {/* Step 4: Marketer Targets */}
          {currentStep === 4 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-black tracking-tight">Who should promote this?</h1>
                <p className="text-sm text-muted-foreground tracking-tight font-bold">
                  Targeting specific promotion styles improves quality.
                </p>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
                {[
                  { id: "creators", label: "Content creators", color: "bg-blue-50/50" },
                  { id: "seo", label: "SEO / bloggers", color: "bg-green-50/50" },
                  { id: "newsletter", label: "Newsletter owners", color: "bg-orange-50/50" },
                  { id: "communities", label: "Communities", color: "bg-purple-50/50" },
                  { id: "agencies", label: "Agencies", color: "bg-pink-50/50" },
                  { id: "beginners", label: "Beginners welcome", color: "bg-amber-50/50" },
                  ].map((item) => (
                  <SelectableCard
                    key={item.id}
                    selected={data.targetMarketers.includes(item.id)}
                    onClick={() => toggleTargetMarketer(item.id)}
                    color={item.color}
                    className="p-4"
                  >
                    <p className="font-black tracking-tight text-center text-sm">{item.label}</p>
                  </SelectableCard>
                ))}
              </div>
              <div className="space-y-3 pt-3">
                <p className="ml-3 text-[11px] font-black text-muted-foreground">
                  Industry focus
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {["B2B", "B2C", "SaaS", "AI", "Fintech", "Health", "Social"].map((tag) => (
                    <SelectableBadge
                      key={tag}
                      label={tag}
                      selected={data.industryTags.includes(tag)}
                      onClick={() => toggleIndustryTag(tag)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Commission Structure */}
          {currentStep === 5 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-black tracking-tight">
                  How do you want to reward partners?
                </h1>
                <p className="text-sm text-muted-foreground tracking-tight font-bold">
                  Fair incentives attract the best marketers.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <SelectableCard
                  selected={data.commissionType === "percentage"}
                  onClick={() => updateData({ commissionType: "percentage" })}
                  color={
                    data.commissionType === "percentage"
                      ? "bg-primary"
                      : "bg-secondary/20"
                  }
                  className="p-5"
                >
                  <p className="text-center font-black tracking-tight text-[11px]">
                    % of revenue
                  </p>
                </SelectableCard>
                <SelectableCard
                  selected={data.commissionType === "flat"}
                  onClick={() => updateData({ commissionType: "flat" })}
                  color={data.commissionType === "flat" ? "bg-primary" : "bg-secondary/20"}
                  className="p-5"
                >
                  <p className="text-center font-black tracking-tight text-[11px]">
                    Flat fee per sale
                  </p>
                </SelectableCard>
              </div>

              <div className="space-y-5 pt-4">
                <div className="flex items-center justify-between px-2 text-2xl font-black tracking-tight">
                  <span>Reward</span>
                  <span className="text-primary tabular-nums">
                    {data.commissionValue}
                    {data.commissionType === "percentage" ? "%" : "$"}
                  </span>
                </div>

                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={data.commissionValue}
                  onChange={(e) =>
                    updateData({ commissionValue: parseInt(e.target.value) })
                  }
                  className="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer accent-primary"
                />

                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-black px-2">
                  <span>5%</span>
                  <span>60%</span>
                </div>

                <div className="p-5 rounded-2xl bg-blue-50/50 text-center">
                  <p className="text-[11px] font-black text-blue-800">
                    Similar products usually offer 20–30%
                  </p>
                </div>

                <div className="flex items-center justify-between p-5 bg-secondary/20 rounded-2xl">
                  <div className="space-y-1">
                    <p className="font-black tracking-tight text-sm">Recurring commissions</p>
                    <p className="text-[12px] text-muted-foreground font-black">
                      Apply to all future payments
                    </p>
                  </div>
                  <Checkbox
                    checked={data.recurring}
                    onCheckedChange={(checked) => updateData({ recurring: checked as boolean })}
                    className="size-6 rounded-md border-none bg-background data-[state=checked]:bg-primary shadow-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Product Access */}
          {currentStep === 6 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-black tracking-tight">
                  Do marketers get access to your product?
                </h1>
                <p className="text-sm text-muted-foreground tracking-tight font-bold">
                  Access helps partners create authentic reviews.
                </p>
              </div>
              <div className="space-y-2.5">
                {[
                  { id: "none", label: "No access", color: "bg-red-50/50" },
                  {
                    id: "demo",
                    label: "Demo / limited access",
                    color: "bg-blue-50/50",
                  },
                  {
                    id: "after-approval",
                    label: "Full access after approval",
                    color: "bg-purple-50/50",
                  },
                  {
                    id: "after-conversion",
                    label: "Full access after first conversion",
                    color: "bg-green-50/50",
                  },
                ].map((item) => (
                  <SelectableCard
                    key={item.id}
                    selected={data.productAccess === item.id}
                    onClick={() => updateData({ productAccess: item.id })}
                    color={item.color}
                    className="flex items-center px-6 p-4"
                  >
                    <p className="text-sm font-black tracking-tight">{item.label}</p>
                  </SelectableCard>
                ))}
              </div>
            </div>
          )}

          {/* Step 7: Refund & Payout */}
          {currentStep === 7 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-black tracking-tight">
                  When should commissions become payable?
                </h1>
                <p className="text-sm text-muted-foreground tracking-tight font-bold">
                  Commissions stay pending until the refund window closes.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {["7", "14", "30", "60"].map((days) => (
                  <SelectableCard
                    key={days}
                    selected={data.refundWindow === days}
                    onClick={() => updateData({ refundWindow: days })}
                    color={
                      data.refundWindow === days ? "bg-primary" : "bg-secondary/20"
                    }
                    height="h-20"
                    className="flex flex-col items-center justify-center"
                  >
                    <p className="text-3xl font-black tabular-nums">{days}</p>
                    <p className="text-[11px] font-black opacity-80">Days</p>
                  </SelectableCard>
                ))}
              </div>
              <div className="p-6 rounded-2xl bg-secondary/10 space-y-3">
                <BulletList
                  items={[
                    "Directly maps to payout scheduling",
                    "Mitigates loss from refunds",
                    "Sets professional expectations",
                  ]}
                  className="space-y-4"
                />
              </div>
            </div>
          )}

          {/* Step 8: Approval & Control */}
          {currentStep === 8 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-black tracking-tight">How do partners join?</h1>
                <p className="text-sm text-muted-foreground tracking-tight font-bold">
                  Choose between ease of growth and tight control.
                </p>
              </div>
              <div className="space-y-3">
                <SelectableCard
                  selected={data.approvalType === "instant"}
                  onClick={() => updateData({ approvalType: "instant" })}
                  color={
                    data.approvalType === "instant" ? "bg-green-50/50" : "bg-secondary/20"
                  }
                  className="p-5"
                >
                  <p className="text-base font-black tracking-tight">Instant access</p>
                  <p className="text-[11px] text-muted-foreground font-black mt-0.5">
                    Any marketer can start immediately
                  </p>
                </SelectableCard>

                <SelectableCard
                  selected={data.approvalType === "request"}
                  onClick={() => updateData({ approvalType: "request" })}
                  color={
                    data.approvalType === "request" ? "bg-blue-50/50" : "bg-secondary/20"
                  }
                  className="p-5"
                >
                  <p className="text-base font-black tracking-tight">Request approval</p>
                  <p className="text-[11px] text-muted-foreground font-black mt-0.5">
                    Review every application manually
                  </p>
                </SelectableCard>

                <div className="flex items-center justify-between p-5 bg-secondary/30 rounded-2xl">
                  <p className="font-black tracking-tight text-xs">Limit max marketers</p>
                  <Checkbox
                    checked={data.limitMarketers}
                    onCheckedChange={(checked) =>
                      updateData({ limitMarketers: checked as boolean })
                    }
                    className="size-6 rounded-md bg-background data-[state=checked]:bg-primary shadow-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 9: Program Summary */}
          {currentStep === 9 && (
            <div className="space-y-5">
              <div className="space-y-1.5 text-center text-balance">
                <h1 className="text-3xl font-black tracking-tight">Review and launch.</h1>
              </div>
              <div className="p-6 rounded-2xl bg-primary/5 space-y-6">
                <div className="grid grid-cols-2 gap-y-8 gap-x-12">
                  <div>
                    <p className="text-[12px] font-black text-muted-foreground mb-2">Product</p>
                    <p className="font-black text-xl tracking-tight">
                      {data.projectName || "Unnamed"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] font-black text-muted-foreground mb-2">Commission</p>
                    <p className="font-black text-xl text-primary tracking-tight">
                      {data.commissionValue}
                      {data.commissionType === "percentage" ? "%" : "$"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[12px] font-black text-muted-foreground mb-2">
                      Refund Window
                    </p>
                    <p className="font-black text-xl tracking-tight">{data.refundWindow} Days</p>
                  </div>
                  <div>
                    <p className="text-[12px] font-black text-muted-foreground mb-2">Access</p>
                    <p className="font-black text-xl tracking-tight">
                      {data.productAccess === "NONE" ? "None" : data.productAccess}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 10: Recommended partners */}
          {currentStep === 10 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <h1 className="text-2xl font-black tracking-tight">Recommended partners.</h1>
                <p className="text-sm text-muted-foreground tracking-tight font-bold">
                  We found marketers who match your program setup.
                </p>
              </div>
              <div className="space-y-3">
                {matchedMarketers.map((m, i) => (
                  <Card
                    key={i}
                    className={cn(
                      "p-5 flex justify-between ring-0 border-none rounded-2xl transition-all shadow-none outline-none",
                      m.color
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="size-12 rounded-full bg-background" />
                      <div>
                        <p className="font-black text-base tracking-tight">{m.name}</p>
                        <p className="text-[11px] font-black text-muted-foreground">
                          {m.style} • {m.region}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="lg"
                      className="rounded-2xl px-6 h-10 font-black text-[11px] shadow-none"
                    >
                      Invite
                    </Button>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 11: Next Steps */}
          {currentStep === 11 && (
            <div className="space-y-6 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-black tracking-tight">Program created.</h1>
                <p className="text-muted-foreground text-base tracking-tight font-bold">
                  Your dashboard is ready for launch.
                </p>
              </div>
              <div className="space-y-3 py-4">
                <div className="flex flex-col gap-3">
                  {[
                    "Connect Stripe to pay partners",
                    "Add tracking snippet to your landing page",
                    "Send invites to matched marketers",
                    "Personalize your public dashboard",
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
            nextButtonText={currentStep === 9 ? "Publish program" : "Continue"}
            finalButtonText="Go to dashboard"
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
