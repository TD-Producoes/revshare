"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { OnboardingLayout } from "@/components/onboarding/onboarding-layout";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { OnboardingNavigation } from "@/components/onboarding/onboarding-navigation";
import { OnboardingStepWrapper } from "@/components/onboarding/onboarding-step-wrapper";
import { SelectableCard } from "@/components/onboarding/selectable-card";
import { OnboardingInput } from "@/components/onboarding/onboarding-input";
import { BulletList } from "@/components/onboarding/bullet-list";
import { cn } from "@/lib/utils";

// Types for onboarding state
type Role = "founder" | "marketer" | null;

type FounderData = {
  projectName: string;
  website: string;
  businessType: string;
  isPublic: boolean;
  commissionPercentage: number;
  refundWindow: string;
  allowPerformanceRewards: boolean;
  listInDirectory: boolean;
  showRevenueStats: boolean;
  acceptApplicationsAuto: boolean;
};

type MarketerData = {
  displayName: string;
  country: string;
  promotionTypes: string[];
  isPublicProfile: boolean;
};

export default function OnboardingNewPage() {
  const [role, setRole] = useState<Role>(null);
  const [founderStep, setFounderStep] = useState(1);
  const [marketerStep, setMarketerStep] = useState(1);

  const [founderData, setFounderData] = useState<FounderData>({
    projectName: "",
    website: "",
    businessType: "",
    isPublic: true,
    commissionPercentage: 20,
    refundWindow: "30",
    allowPerformanceRewards: false,
    listInDirectory: true,
    showRevenueStats: false,
    acceptApplicationsAuto: false,
  });

  const [marketerData, setMarketerData] = useState<MarketerData>({
    displayName: "",
    country: "",
    promotionTypes: [],
    isPublicProfile: true,
  });

  // Founder flow constants
  const FOUNDER_STEPS_COUNT = 4; // Project basics → Commission → Publish → Connect revenue (skippable)

  // Marketer flow constants
  const MARKETER_STEPS_COUNT = 3; // Profile → Discover → Attribution

  const updateFounderData = (updates: Partial<FounderData>) => {
    setFounderData((prev) => ({ ...prev, ...updates }));
  };

  const updateMarketerData = (updates: Partial<MarketerData>) => {
    setMarketerData((prev) => ({ ...prev, ...updates }));
  };

  const toggleMarketerPromotionType = (type: string) => {
    setMarketerData((prev) => ({
      ...prev,
      promotionTypes: prev.promotionTypes.includes(type)
        ? prev.promotionTypes.filter((t) => t !== type)
        : [...prev.promotionTypes, type],
    }));
  };

  // Left panel content based on current step
  const renderLeftPanelContent = () => {
    // Role selection step
    if (!role) {
      return (
        <>
          <h2 className="mb-6 text-4xl font-black leading-tight tracking-tight">
            Welcome to RevShare.
          </h2>
          <p className="mb-8 text-lg text-muted-foreground tracking-tight font-bold">
            Choose your role to get started. You can switch roles later.
          </p>
        </>
      );
    }

    // Founder flow left panel
    if (role === "founder") {
      if (founderStep === 1) {
        return (
          <>
            <h2 className="mb-6 text-4xl font-black leading-tight tracking-tight">
              Create your first project.
            </h2>
            <p className="mb-8 text-lg text-muted-foreground tracking-tight font-bold">
              Start simple. No Stripe, no RevenueCat — just the basics.
            </p>
            <BulletList
              items={[
                "No technical setup required",
                "You can add integrations later",
                "Focus on defining your program",
              ]}
              className="space-y-4"
            />
          </>
        );
      }

      if (founderStep === 2) {
        return (
          <>
            <h2 className="mb-6 text-4xl font-black leading-tight tracking-tight">
              Define your revenue-share terms.
            </h2>
            <p className="mb-8 text-lg text-muted-foreground tracking-tight font-bold">
              This is the core of RevShare. Set fair commissions and protect yourself with refund windows.
            </p>
            <BulletList
              items={[
                "Commissions unlock after refund window",
                "Protects you from chargebacks",
                "Transparent for marketers",
              ]}
              className="space-y-4"
            />
          </>
        );
      }

      if (founderStep === 3) {
        return (
          <>
            <h2 className="mb-6 text-4xl font-black leading-tight tracking-tight">
              Make your program discoverable.
            </h2>
            <p className="mb-8 text-lg text-muted-foreground tracking-tight font-bold">
              Control how marketers find and join your program. You&apos;re always in control.
            </p>
            <BulletList
              items={[
                "You can pause or edit anytime",
                "Public directory increases visibility",
                "Manual approval gives you control",
              ]}
              className="space-y-4"
            />
          </>
        );
      }

      if (founderStep === 4) {
        return (
          <>
            <h2 className="mb-6 text-4xl font-black leading-tight tracking-tight">
              Connect your revenue source.
            </h2>
            <p className="mb-8 text-lg text-muted-foreground tracking-tight font-bold">
              Revenue tracking is required to pay commissions, but you can connect later.
            </p>
            <BulletList
              items={[
                "Skip for now if you&apos;re not ready",
                "Required before first payout",
                "Supports Stripe and RevenueCat",
              ]}
              className="space-y-4"
            />
          </>
        );
      }
    }

    // Marketer flow left panel
    if (role === "marketer") {
      if (marketerStep === 1) {
        return (
          <>
            <h2 className="mb-6 text-4xl font-black leading-tight tracking-tight">
              Create your marketer profile.
            </h2>
            <p className="mb-8 text-lg text-muted-foreground tracking-tight font-bold">
              Your profile helps founders understand who you are and why they should work with you.
            </p>
            <BulletList
              items={[
                "Enables discovery by founders",
                "Sets clear expectations",
                "Builds trust early",
              ]}
              className="space-y-4"
            />
          </>
        );
      }

      if (marketerStep === 2) {
        return (
          <>
            <h2 className="mb-6 text-4xl font-black leading-tight tracking-tight">
              Find programs to promote.
            </h2>
            <p className="mb-8 text-lg text-muted-foreground tracking-tight font-bold">
              Browse the directory, save programs you like, and apply to start earning.
            </p>
            <BulletList
              items={[
                "Browse by commission, category, revenue",
                "Save programs for later",
                "Apply instantly or request access",
              ]}
              className="space-y-4"
            />
          </>
        );
      }

      if (marketerStep === 3) {
        return (
          <>
            <h2 className="mb-6 text-4xl font-black leading-tight tracking-tight">
              How you earn commissions.
            </h2>
            <p className="mb-8 text-lg text-muted-foreground tracking-tight font-bold">
              Understanding the flow builds trust. Here&apos;s exactly how earnings work.
            </p>
            <BulletList
              items={[
                "Your link → customer → revenue → commission",
                "Refund windows protect founders",
                "Earnings unlock after refund period",
              ]}
              className="space-y-4"
            />
          </>
        );
      }
    }
  };

  // Right panel content (form steps)
  const renderRightPanelContent = () => {
    // Step 0: Role selection
    if (!role) {
      return (
        <>
          <OnboardingProgress currentStep={0} totalSteps={1} />
          <OnboardingStepWrapper currentStep={0}>
            <div className="space-y-5">
              <div className="space-y-1.5 text-center lg:text-left">
                <h1 className="text-3xl font-black tracking-tight">
                  What brings you to RevShare?
                </h1>
                <p className="text-base text-muted-foreground tracking-tight font-bold">
                  Choose your role to personalize your experience.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-1 pt-4">
                <SelectableCard
                  selected={role === "founder"}
                  onClick={() => setRole("founder")}
                  color="bg-blue-50/50"
                  className="p-6"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <p className="font-black text-xl tracking-tight">I&apos;m a Founder</p>
                    </div>
                    <p className="text-sm text-muted-foreground font-bold">
                      I want marketers to promote my product
                    </p>
                  </div>
                </SelectableCard>

                <SelectableCard
                  selected={role === "marketer"}
                  onClick={() => setRole("marketer")}
                  color="bg-green-50/50"
                  className="p-6"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <p className="font-black text-xl tracking-tight">I&apos;m a Marketer</p>
                    </div>
                    <p className="text-sm text-muted-foreground font-bold">
                      I want to promote products and earn commissions
                    </p>
                  </div>
                </SelectableCard>
              </div>

              <div className="pt-6">
                <Button
                  size="lg"
                  onClick={() => {
                    if (role === "founder") setFounderStep(1);
                    if (role === "marketer") setMarketerStep(1);
                  }}
                  disabled={!role}
                  className="w-full px-10 h-12 rounded-2xl bg-primary text-primary-foreground text-[11px] font-black border-none transition-all hover:scale-105 active:scale-95 shadow-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </Button>
              </div>
            </div>
          </OnboardingStepWrapper>
        </>
      );
    }

    // Founder flow
    if (role === "founder") {
      return (
        <>
          <OnboardingProgress currentStep={founderStep} totalSteps={FOUNDER_STEPS_COUNT} />

          <OnboardingStepWrapper currentStep={founderStep}>
            {/* Founder Step 1: Project basics */}
            {founderStep === 1 && (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <h1 className="text-2xl font-black tracking-tight">Create your first project</h1>
                  <p className="text-sm text-muted-foreground tracking-tight font-bold">
                    Start with the basics. No technical setup required.
                  </p>
                </div>

                <div className="space-y-4">
                  <OnboardingInput
                    id="projectName"
                    label="Project name"
                    value={founderData.projectName}
                    onChange={(value) => updateFounderData({ projectName: value })}
                    placeholder="Acme Analytics"
                    autoFocus
                  />

                  <OnboardingInput
                    id="website"
                    label="Website / app URL"
                    value={founderData.website}
                    onChange={(value) => updateFounderData({ website: value })}
                    placeholder="https://..."
                  />

                  <div className="space-y-2">
                    <p className="ml-3 text-[11px] font-black text-muted-foreground">
                      Business type
                    </p>
                    <div className="grid gap-2.5 sm:grid-cols-1">
                      {[
                        { id: "saas", label: "SaaS", color: "bg-blue-50/50" },
                        { id: "ecommerce", label: "Shopify / Ecommerce", color: "bg-green-50/50" },
                        { id: "mobile", label: "Mobile app", color: "bg-orange-50/50" },
                      ].map((item) => (
                        <SelectableCard
                          key={item.id}
                          selected={founderData.businessType === item.id}
                          onClick={() => updateFounderData({ businessType: item.id })}
                          color={item.color}
                          className="p-4"
                        >
                          <p className="font-black text-base tracking-tight">{item.label}</p>
                        </SelectableCard>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-5 bg-secondary/30 rounded-2xl">
                    <div className="space-y-0.5">
                      <p className="font-black tracking-tight text-sm">Public project</p>
                      <p className="text-[11px] text-muted-foreground font-bold">
                        Visible in public directory
                      </p>
                    </div>
                    <Checkbox
                      checked={founderData.isPublic}
                      onCheckedChange={(checked) =>
                        updateFounderData({ isPublic: checked as boolean })
                      }
                      className="size-6 rounded-md bg-background data-[state=checked]:bg-primary shadow-none"
                    />
                  </div>
                </div>

                <OnboardingNavigation
                  currentStep={founderStep}
                  totalSteps={FOUNDER_STEPS_COUNT}
                  onBack={() => {
                    if (founderStep === 1) {
                      setRole(null);
                    } else {
                      setFounderStep((prev) => Math.max(prev - 1, 1));
                    }
                  }}
                  onNext={() => setFounderStep((prev) => Math.min(prev + 1, FOUNDER_STEPS_COUNT))}
                  disableNext={!founderData.projectName || !founderData.businessType}
                  allowBackOnFirstStep={true}
                />
              </div>
            )}

            {/* Founder Step 2: Commission & rules */}
            {founderStep === 2 && (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <h1 className="text-2xl font-black tracking-tight">
                    Define your revenue-share terms
                  </h1>
                  <p className="text-sm text-muted-foreground tracking-tight font-bold">
                    Set fair commissions and protect yourself with refund windows.
                  </p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <p className="ml-3 text-[11px] font-black text-muted-foreground">
                      Commission percentage
                    </p>
                    <div className="flex items-center justify-between px-2 text-2xl font-black tracking-tight">
                      <span>Reward</span>
                      <span className="text-primary tabular-nums">
                        {founderData.commissionPercentage}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="50"
                      step="5"
                      value={founderData.commissionPercentage}
                      onChange={(e) =>
                        updateFounderData({ commissionPercentage: parseInt(e.target.value) })
                      }
                      className="w-full h-2 bg-secondary rounded-full appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground font-black px-2">
                      <span>5%</span>
                      <span>50%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="ml-3 text-[11px] font-black text-muted-foreground">
                      Refund window
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {["7", "14", "30", "60"].map((days) => (
                        <SelectableCard
                          key={days}
                          selected={founderData.refundWindow === days}
                          onClick={() => updateFounderData({ refundWindow: days })}
                          color={
                            founderData.refundWindow === days
                              ? "bg-primary"
                              : "bg-secondary/20"
                          }
                          height="h-20"
                          className="flex flex-col items-center justify-center"
                        >
                          <p className="text-3xl font-black tabular-nums">{days}</p>
                          <p className="text-[11px] font-black opacity-80">Days</p>
                        </SelectableCard>
                      ))}
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-secondary/10 space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="size-1.5 rounded-full bg-primary" />
                      <p className="text-xs font-black text-muted-foreground">
                        Commissions unlock only after the refund window ends. This protects you
                        from chargebacks.
                      </p>
                    </div>
                  </div>

                    <div className="flex items-center justify-between p-5 bg-secondary/20 rounded-2xl">
                    <div className="space-y-0.5">
                      <p className="font-black tracking-tight text-sm">
                        Allow performance rewards
                      </p>
                      <p className="text-[11px] text-muted-foreground font-bold">Optional</p>
                    </div>
                    <Checkbox
                      checked={founderData.allowPerformanceRewards}
                      onCheckedChange={(checked) =>
                        updateFounderData({ allowPerformanceRewards: checked as boolean })
                      }
                      className="size-6 rounded-md bg-background data-[state=checked]:bg-primary shadow-none"
                    />
                  </div>
                </div>

                <OnboardingNavigation
                  currentStep={founderStep}
                  totalSteps={FOUNDER_STEPS_COUNT}
                  onBack={() => setFounderStep((prev) => Math.max(prev - 1, 1))}
                  onNext={() => setFounderStep((prev) => Math.min(prev + 1, FOUNDER_STEPS_COUNT))}
                  nextButtonText="Preview program"
                />
              </div>
            )}

            {/* Founder Step 3: Publish & discovery */}
            {founderStep === 3 && (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <h1 className="text-2xl font-black tracking-tight">
                    Make your program discoverable
                  </h1>
                  <p className="text-sm text-muted-foreground tracking-tight font-bold">
                    Control how marketers find and join your program.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-5 bg-secondary/20 rounded-2xl">
                    <div className="space-y-0.5">
                      <p className="font-black tracking-tight text-sm">
                        List in public directory
                      </p>
                      <p className="text-[11px] text-muted-foreground font-bold">
                        Makes your program discoverable
                      </p>
                    </div>
                    <Checkbox
                      checked={founderData.listInDirectory}
                      onCheckedChange={(checked) =>
                        updateFounderData({ listInDirectory: checked as boolean })
                      }
                      className="size-6 rounded-md bg-background data-[state=checked]:bg-primary shadow-none"
                    />
                  </div>

                  <div className="flex items-center justify-between p-5 bg-secondary/20 rounded-2xl">
                    <div className="space-y-0.5">
                      <p className="font-black tracking-tight text-sm">
                        Show revenue stats publicly
                      </p>
                      <p className="text-[11px] text-muted-foreground font-bold">Optional</p>
                    </div>
                    <Checkbox
                      checked={founderData.showRevenueStats}
                      onCheckedChange={(checked) =>
                        updateFounderData({ showRevenueStats: checked as boolean })
                      }
                      className="size-6 rounded-md bg-background data-[state=checked]:bg-primary shadow-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="ml-3 text-[11px] font-black text-muted-foreground">
                      Application approval
                    </p>
                    <div className="space-y-2.5">
                      <SelectableCard
                        selected={founderData.acceptApplicationsAuto}
                        onClick={() => updateFounderData({ acceptApplicationsAuto: true })}
                        color={
                          founderData.acceptApplicationsAuto ? "bg-green-50/50" : "bg-secondary/20"
                        }
                        className="p-4"
                      >
                        <p className="text-base font-black tracking-tight">Automatic</p>
                        <p className="text-[11px] text-muted-foreground font-bold mt-0.5">
                          Accept applications immediately
                        </p>
                      </SelectableCard>

                      <SelectableCard
                        selected={!founderData.acceptApplicationsAuto}
                        onClick={() => updateFounderData({ acceptApplicationsAuto: false })}
                        color={
                          !founderData.acceptApplicationsAuto ? "bg-blue-50/50" : "bg-secondary/20"
                        }
                        className="p-4"
                      >
                        <p className="text-base font-black tracking-tight">Manual</p>
                        <p className="text-[11px] text-muted-foreground font-bold mt-0.5">
                          Review every application
                        </p>
                      </SelectableCard>
                    </div>
                  </div>

                  <div className="p-5 rounded-2xl bg-secondary/10">
                    <p className="text-xs font-black text-muted-foreground">
                      You&apos;re always in control. You can pause or edit anytime.
                    </p>
                  </div>
                </div>

                <OnboardingNavigation
                  currentStep={founderStep}
                  totalSteps={FOUNDER_STEPS_COUNT}
                  onBack={() => setFounderStep((prev) => Math.max(prev - 1, 1))}
                  onNext={() => setFounderStep((prev) => Math.min(prev + 1, FOUNDER_STEPS_COUNT))}
                  nextButtonText="Publish project"
                />
              </div>
            )}

            {/* Founder Step 4: Connect revenue source (skippable) */}
            {founderStep === 4 && (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <h1 className="text-2xl font-black tracking-tight">
                    Connect your revenue source
                  </h1>
                  <p className="text-sm text-muted-foreground tracking-tight font-bold">
                    Revenue tracking is required to pay commissions, but you can connect later.
                  </p>
                </div>

                <div className="space-y-3">
                  <SelectableCard
                    selected={false}
                    onClick={() => {
                      // TODO: Connect Stripe
                      console.log("Connect Stripe");
                    }}
                    color="bg-blue-50/50"
                    className="p-5"
                  >
                    <div className="space-y-1">
                      <p className="text-base font-black tracking-tight">Connect Stripe</p>
                      <p className="text-[11px] text-muted-foreground font-bold">
                        Track revenue from Stripe payments
                      </p>
                    </div>
                  </SelectableCard>

                  <SelectableCard
                    selected={false}
                    onClick={() => {
                      // TODO: Connect RevenueCat
                      console.log("Connect RevenueCat");
                    }}
                    color="bg-green-50/50"
                    className="p-5"
                  >
                    <div className="space-y-1">
                      <p className="text-base font-black tracking-tight">Connect RevenueCat</p>
                      <p className="text-[11px] text-muted-foreground font-bold">
                        Track revenue from mobile subscriptions
                      </p>
                    </div>
                  </SelectableCard>
                </div>

                <div className="p-5 rounded-2xl bg-secondary/10">
                  <p className="text-xs font-black text-muted-foreground">
                    You can connect later, but revenue tracking is required to pay commissions.
                  </p>
                </div>

                <OnboardingNavigation
                  currentStep={founderStep}
                  totalSteps={FOUNDER_STEPS_COUNT}
                  onBack={() => setFounderStep((prev) => Math.max(prev - 1, 1))}
                  onNext={() => {
                    // Navigate to dashboard or next step
                    console.log("Onboarding complete");
                  }}
                  nextButtonText="Skip for now"
                  finalButtonText="Go to dashboard"
                />
              </div>
            )}
          </OnboardingStepWrapper>
        </>
      );
    }

    // Marketer flow
    if (role === "marketer") {
      return (
        <>
          <OnboardingProgress currentStep={marketerStep} totalSteps={MARKETER_STEPS_COUNT} />

          <OnboardingStepWrapper currentStep={marketerStep}>
            {/* Marketer Step 1: Profile basics */}
            {marketerStep === 1 && (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <h1 className="text-2xl font-black tracking-tight">
                    Create your marketer profile
                  </h1>
                  <p className="text-sm text-muted-foreground tracking-tight font-bold">
                    Help founders understand who you are and why they should work with you.
                  </p>
                </div>

                <div className="space-y-4">
                  <OnboardingInput
                    id="displayName"
                    label="Display name"
                    value={marketerData.displayName}
                    onChange={(value) => updateMarketerData({ displayName: value })}
                    placeholder="Your name or brand"
                    autoFocus
                  />

                  <OnboardingInput
                    id="country"
                    label="Country"
                    value={marketerData.country}
                    onChange={(value) => updateMarketerData({ country: value })}
                    placeholder="United States"
                  />

                  <div className="space-y-2">
                    <p className="ml-3 text-[11px] font-black text-muted-foreground">
                      Promotion type
                    </p>
                    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
                      {[
                        { id: "content", label: "Content", color: "bg-blue-50/50" },
                        { id: "ads", label: "Ads", color: "bg-green-50/50" },
                        { id: "email", label: "Email", color: "bg-orange-50/50" },
                        { id: "social", label: "Social", color: "bg-purple-50/50" },
                      ].map((item) => (
                        <SelectableCard
                          key={item.id}
                          selected={marketerData.promotionTypes.includes(item.id)}
                          onClick={() => toggleMarketerPromotionType(item.id)}
                          color={item.color}
                          className="p-4"
                        >
                          <p className="font-black text-base tracking-tight">{item.label}</p>
                        </SelectableCard>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-5 bg-secondary/30 rounded-2xl">
                    <div className="space-y-0.5">
                      <p className="font-black tracking-tight text-sm">Public profile</p>
                      <p className="text-[11px] text-muted-foreground font-bold">
                        Visible to founders
                      </p>
                    </div>
                    <Checkbox
                      checked={marketerData.isPublicProfile}
                      onCheckedChange={(checked) =>
                        updateMarketerData({ isPublicProfile: checked as boolean })
                      }
                      className="size-6 rounded-md bg-background data-[state=checked]:bg-primary shadow-none"
                    />
                  </div>
                </div>

                <OnboardingNavigation
                  currentStep={marketerStep}
                  totalSteps={MARKETER_STEPS_COUNT}
                  onBack={() => {
                    if (marketerStep === 1) {
                      setRole(null);
                    } else {
                      setMarketerStep((prev) => Math.max(prev - 1, 1));
                    }
                  }}
                  onNext={() => setMarketerStep((prev) => Math.min(prev + 1, MARKETER_STEPS_COUNT))}
                  disableNext={!marketerData.displayName || marketerData.promotionTypes.length === 0}
                  allowBackOnFirstStep={true}
                />
              </div>
            )}

            {/* Marketer Step 2: Discover programs */}
            {marketerStep === 2 && (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <h1 className="text-2xl font-black tracking-tight">Find programs to promote</h1>
                  <p className="text-sm text-muted-foreground tracking-tight font-bold">
                    Browse the directory, save programs you like, and apply to start earning.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-6 rounded-2xl bg-secondary/10 space-y-4">
                    <p className="text-sm font-black text-muted-foreground">
                      Public project directory
                    </p>
                    <p className="text-xs text-muted-foreground font-bold">
                      Browse by commission, category, revenue. Save programs for later or apply
                      instantly.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Mock program cards */}
                    {[
                      {
                        name: "Acme Analytics",
                        commission: "20%",
                        category: "SaaS",
                        color: "bg-blue-50/50",
                      },
                      {
                        name: "ShopFlow",
                        commission: "15%",
                        category: "Ecommerce",
                        color: "bg-green-50/50",
                      },
                      {
                        name: "TaskMaster Pro",
                        commission: "25%",
                        category: "SaaS",
                        color: "bg-purple-50/50",
                      },
                    ].map((program, i) => (
                      <Card
                        key={i}
                        className={cn(
                          "p-5 flex justify-between ring-0 border-none rounded-2xl transition-all shadow-none outline-none",
                          program.color
                        )}
                      >
                        <div>
                          <p className="font-black text-base tracking-tight">{program.name}</p>
                          <p className="text-[11px] font-black text-muted-foreground">
                            {program.commission} • {program.category}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="rounded-2xl px-5 h-9 font-black text-[11px] shadow-none"
                        >
                          Apply
                        </Button>
                      </Card>
                    ))}
                  </div>
                </div>

                <OnboardingNavigation
                  currentStep={marketerStep}
                  totalSteps={MARKETER_STEPS_COUNT}
                  onBack={() => setMarketerStep((prev) => Math.max(prev - 1, 1))}
                  onNext={() => setMarketerStep((prev) => Math.min(prev + 1, MARKETER_STEPS_COUNT))}
                  nextButtonText="Save & continue"
                />
              </div>
            )}

            {/* Marketer Step 3: Attribution explained */}
            {marketerStep === 3 && (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <h1 className="text-2xl font-black tracking-tight">How you earn commissions</h1>
                  <p className="text-sm text-muted-foreground tracking-tight font-bold">
                    Understanding the flow builds trust. Here&apos;s exactly how earnings work.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-6 rounded-2xl bg-secondary/10 space-y-4">
                    <div className="flex items-center gap-3 text-sm font-black">
                      <span className="text-primary">Your link</span>
                      <span>→</span>
                      <span>customer</span>
                      <span>→</span>
                      <span>revenue</span>
                      <span>→</span>
                      <span className="text-primary">commission</span>
                      <span>→</span>
                      <span className="text-primary">payout</span>
                    </div>
                  </div>

                  <BulletList
                    items={[
                      "First-touch attribution: first link that converts gets credit",
                      "Refund windows: commissions unlock after refund period ends",
                      "Earnings become available once refund window closes",
                      "Payouts processed via Stripe (connect when ready)",
                    ]}
                    className="space-y-3"
                    animate
                  />
                </div>

                <OnboardingNavigation
                  currentStep={marketerStep}
                  totalSteps={MARKETER_STEPS_COUNT}
                  onBack={() => setMarketerStep((prev) => Math.max(prev - 1, 1))}
                  onNext={() => {
                    // Navigate to dashboard
                    console.log("Onboarding complete");
                  }}
                  nextButtonText="Got it"
                  finalButtonText="Go to dashboard"
                />
              </div>
            )}
          </OnboardingStepWrapper>
        </>
      );
    }
  };

  return (
    <OnboardingLayout
      currentStep={role === "founder" ? founderStep : role === "marketer" ? marketerStep : 0}
      leftPanelContent={renderLeftPanelContent()}
      rightPanelContent={renderRightPanelContent()}
    />
  );
}

