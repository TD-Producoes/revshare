"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FeaturesInput } from "@/components/ui/features-input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthUserId } from "@/lib/hooks/auth";
import { countries } from "@/lib/data/countries";
import {
  isValidCategory,
  projectCategories,
} from "@/lib/data/categories";
import type { WebsiteScrapeResult } from "@/lib/services/website-scraper";

// Types for onboarding state
type Role = "founder" | "marketer" | null;

type FounderData = {
  projectName: string;
  projectDescription: string;
  projectIcon: string | null;
  website: string;
  category: string;
  country: string;
  foundedAt: string;
  keyFeatures: string[];
  about: string;
  isPublic: boolean;
  commissionPercentage: number;
  refundWindow: string;
  allowPerformanceRewards: boolean;
  listInDirectory: boolean;
  showRevenueStats: boolean;
  autoApproveApplications: boolean;
  autoApproveMatchTerms: boolean;
  autoApproveVerifiedOnly: boolean;
};

type MarketerData = {
  displayName: string;
  country: string;
  promotionTypes: string[];
  isPublicProfile: boolean;
};

export default function OnboardingNewPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>(null);
  const [founderStep, setFounderStep] = useState(1);
  const [marketerStep, setMarketerStep] = useState(1);
  const { data: authUserId } = useAuthUserId();

  const [founderData, setFounderData] = useState<FounderData>({
    projectName: "",
    projectDescription: "",
    projectIcon: null,
    website: "",
    category: "",
    country: "",
    foundedAt: "",
    keyFeatures: [],
    about: "",
    isPublic: true,
    commissionPercentage: 20,
    refundWindow: "30",
    allowPerformanceRewards: false,
    listInDirectory: true,
    showRevenueStats: false,
    autoApproveApplications: false,
    autoApproveMatchTerms: true,
    autoApproveVerifiedOnly: true,
  });

  const [marketerData, setMarketerData] = useState<MarketerData>({
    displayName: "",
    country: "",
    promotionTypes: [],
    isPublicProfile: true,
  });
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [createProjectError, setCreateProjectError] = useState<string | null>(
    null
  );
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  // Founder flow constants
  const FOUNDER_STEPS_COUNT = 5; // Project website (optional) → Project details → Commission → Publish → Connect revenue (skippable)

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

  const countryOptions = useMemo(() => countries, []);

  const normalizeDateInput = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "";
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const applyScrapeData = (data: WebsiteScrapeResult) => {
    const nextUpdates: Partial<FounderData> = {};
    const normalizedCategory =
      data.category && isValidCategory(data.category) ? data.category : "";
    const normalizedCountry = data.country ?? "";
    const normalizedFoundedAt = data.foundedAt
      ? normalizeDateInput(data.foundedAt)
      : "";

    if (!founderData.projectName && data.projectName) {
      nextUpdates.projectName = data.projectName;
    }
    if (!founderData.projectDescription && data.shortDescription) {
      nextUpdates.projectDescription = data.shortDescription;
    }
    if (!founderData.projectIcon && data.logoUrl) {
      nextUpdates.projectIcon = data.logoUrl;
    }
    if (!founderData.category && normalizedCategory) {
      nextUpdates.category = normalizedCategory;
    }
    if (
      !founderData.country &&
      normalizedCountry &&
      countryOptions.some((country) => country.code === normalizedCountry)
    ) {
      nextUpdates.country = normalizedCountry;
    }
    if (!founderData.foundedAt && normalizedFoundedAt) {
      nextUpdates.foundedAt = normalizedFoundedAt;
    }
    if (founderData.keyFeatures.length === 0 && data.keyFeatures.length > 0) {
      nextUpdates.keyFeatures = data.keyFeatures;
    }
    if (!founderData.about && data.about) {
      nextUpdates.about = data.about;
    }

    if (Object.keys(nextUpdates).length > 0) {
      updateFounderData(nextUpdates);
    }
  };

  const handleWebsiteContinue = async () => {
    const website = founderData.website.trim();
    if (!website) {
      setFounderStep((prev) => Math.min(prev + 1, FOUNDER_STEPS_COUNT));
      return;
    }

    setIsScraping(true);
    setScrapeError(null);
    try {
      const response = await fetch("/api/projects/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: website }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to scrape website");
      }

      applyScrapeData(payload.data as WebsiteScrapeResult);
      setFounderStep((prev) => Math.min(prev + 1, FOUNDER_STEPS_COUNT));
    } catch (error) {
      setScrapeError(
        error instanceof Error ? error.message : "Failed to scrape website"
      );
    } finally {
      setIsScraping(false);
    }
  };

  const formatScrapeError = (message: string, website: string) => {
    const trimmed = website.trim();
    if (message.toLowerCase().includes("invalid url")) {
      return {
        title: "Please enter a valid website URL.",
        detail: "Try including the full domain, like example.com.",
      };
    }
    if (message.toLowerCase().includes("err_name_not_resolved")) {
      return {
        title: "We couldn’t find that website.",
        detail: `Double-check the spelling${trimmed ? ` of ${trimmed}` : ""}.`,
      };
    }
    if (message.toLowerCase().includes("timeout")) {
      return {
        title: "That site is taking too long to respond.",
        detail: "Try again in a moment, or skip and add details later.",
      };
    }
    if (message.toLowerCase().includes("failed to load website")) {
      return {
        title: "We couldn’t load that website.",
        detail: "Check the URL or try again later.",
      };
    }
    return {
      title: "We couldn’t fetch details from that website.",
      detail: "Check the URL or skip this step and fill it in later.",
    };
  };

  const formattedScrapeError = scrapeError
    ? formatScrapeError(scrapeError, founderData.website)
    : null;

  const normalizeWebsiteUrl = (value: string) => {
    if (!value) return "";
    return value.startsWith("http") ? value : `https://${value}`;
  };

  const handlePublishProject = async () => {
    if (createdProjectId) {
      setFounderStep((prev) => Math.min(prev + 1, FOUNDER_STEPS_COUNT));
      return;
    }
    if (!authUserId) {
      setCreateProjectError("You need to be logged in to publish a project.");
      return;
    }
    if (!founderData.projectName.trim()) {
      setCreateProjectError("Project name is required before publishing.");
      return;
    }

    setIsCreatingProject(true);
    setCreateProjectError(null);
    try {
      const refundWindowDays = Number(founderData.refundWindow);
      const marketerCommissionPercent = Number(founderData.commissionPercentage);
      const website = normalizeWebsiteUrl(founderData.website.trim());
      const foundationDate = founderData.foundedAt
        ? new Date(founderData.foundedAt).toISOString()
        : "";
      const payload = {
        userId: authUserId,
        name: founderData.projectName.trim(),
        ...(founderData.projectDescription.trim()
          ? { description: founderData.projectDescription.trim() }
          : {}),
        ...(founderData.category ? { category: founderData.category } : {}),
        ...(Number.isFinite(marketerCommissionPercent)
          ? { marketerCommissionPercent }
          : {}),
        ...(Number.isFinite(refundWindowDays) ? { refundWindowDays } : {}),
        ...(founderData.country ? { country: founderData.country } : {}),
        ...(website ? { website } : {}),
        ...(foundationDate ? { foundationDate } : {}),
        ...(founderData.about.trim() ? { about: founderData.about.trim() } : {}),
        ...(founderData.keyFeatures.length > 0
          ? { features: founderData.keyFeatures }
          : {}),
        ...(founderData.projectIcon?.startsWith("http")
          ? { logoUrl: founderData.projectIcon }
          : {}),
        visibility: founderData.listInDirectory ? "PUBLIC" : "PRIVATE",
        showMrr: founderData.showRevenueStats,
        showRevenue: founderData.showRevenueStats,
        showStats: founderData.showRevenueStats,
        autoApproveApplications: founderData.autoApproveApplications,
        autoApproveMatchTerms: founderData.autoApproveMatchTerms,
        autoApproveVerifiedOnly: founderData.autoApproveVerifiedOnly,
      };

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to publish project.");
      }

      setCreatedProjectId(data?.data?.id ?? null);
      router.push("/founder");
    } catch (error) {
      setCreateProjectError(
        error instanceof Error ? error.message : "Unable to publish project."
      );
    } finally {
      setIsCreatingProject(false);
    }
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
              Set up your first project.
            </h2>
            <p className="mb-8 text-lg text-muted-foreground tracking-tight font-bold">
              Start with just your website. We&apos;ll help you retrieve the rest later.
            </p>
            <BulletList
              items={[
                "Just your website URL",
                "We&apos;ll fetch details automatically",
                "You can skip and add later",
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
              Project details.
            </h2>
            <p className="mb-8 text-lg text-muted-foreground tracking-tight font-bold">
              Add basic information about your project. All fields are editable.
            </p>
            <BulletList
              items={[
                "Icon helps with recognition",
                "Name and description are editable",
                "You can update these anytime",
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

      if (founderStep === 4) {
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

      if (founderStep === 5) {
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
                  <div className="space-y-2 pt-2">
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
          <div className="flex items-center gap-4 w-full px-4">
            <div className="flex-1">
              <OnboardingProgress currentStep={founderStep} totalSteps={FOUNDER_STEPS_COUNT} />
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-[11px] font-black"
              onClick={() => router.push("/founder")}
            >
              Skip to dashboard
            </Button>
          </div>

          <OnboardingStepWrapper currentStep={founderStep}>
            {/* Founder Step 1: Project website (optional) */}
            {founderStep === 1 && (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <h1 className="text-2xl font-black tracking-tight">Set up your first project</h1>
                  <p className="text-sm text-muted-foreground tracking-tight font-bold">
                    Just your website URL. We&apos;ll retrieve the remaining info later. You can skip this step.
                  </p>
                </div>

                <div className="space-y-4">
                  <OnboardingInput
                    id="website"
                    label="Website / app URL"
                    value={founderData.website}
                    onChange={(value) => {
                      updateFounderData({ website: value });
                      if (scrapeError) setScrapeError(null);
                    }}
                    placeholder="https://..."
                    autoFocus
                  />
                </div>

                {formattedScrapeError && (
                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    <p className="font-semibold">{formattedScrapeError.title}</p>
                    <p className="text-xs text-destructive/80">
                      {formattedScrapeError.detail}
                    </p>
                  </div>
                )}

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
                  onNext={handleWebsiteContinue}
                  disableNext={isScraping}
                  nextButtonText={isScraping ? "Fetching details..." : "Continue"}
                  allowBackOnFirstStep={true}
                />
              </div>
            )}

            {/* Founder Step 2: Project details */}
            {founderStep === 2 && (
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <h1 className="text-2xl font-black tracking-tight">Project details</h1>
                  <p className="text-sm text-muted-foreground tracking-tight font-bold">
                    Add basic information about your project. All fields are editable.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="icon" className="text-sm font-semibold text-black">
                      Project icon
                    </Label>
                    <div className="flex items-start gap-4">
                      {founderData.projectIcon ? (
                        <div className="relative group">
                          <img
                            src={founderData.projectIcon}
                            alt="Project icon"
                            className="h-20 w-20 rounded-xl object-cover border-2 border-black/10"
                          />
                          <button
                            type="button"
                            onClick={() => updateFounderData({ projectIcon: null })}
                            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <label
                          htmlFor="icon-upload"
                          className="h-20 w-20 rounded-xl border-2 border-dashed border-black/10 bg-white flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
                        >
                          <ImageIcon className="h-6 w-6 text-muted-foreground mb-1" />
                          <span className="text-xs text-muted-foreground">Upload</span>
                          <input
                            id="icon-upload"
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  updateFounderData({
                                    projectIcon: reader.result as string,
                                  });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <OnboardingInput
                    id="projectName"
                    label="Project name"
                    value={founderData.projectName}
                    onChange={(value) => updateFounderData({ projectName: value })}
                    placeholder="Acme Analytics"
                    autoFocus={!founderData.projectIcon}
                  />

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-semibold text-black">
                      Short description
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="A brief description of your project..."
                      value={founderData.projectDescription}
                      onChange={(e) =>
                        updateFounderData({ projectDescription: e.target.value })
                      }
                      className="min-h-[100px] rounded-xl border-2 border-black/10 bg-white focus:border-primary/50 focus:ring-0 text-black placeholder:text-black/40 resize-none"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="projectCategory" className="text-sm font-semibold text-black">
                        Category
                      </Label>
                      <Select
                        value={founderData.category}
                        onValueChange={(value) => updateFounderData({ category: value })}
                      >
                        <SelectTrigger id="projectCategory">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {projectCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="projectCountry" className="text-sm font-semibold text-black">
                        Country
                      </Label>
                      <Select
                        value={founderData.country}
                        onValueChange={(value) => updateFounderData({ country: value })}
                      >
                        <SelectTrigger id="projectCountry">
                          <SelectValue placeholder="Select country" />
                        </SelectTrigger>
                        <SelectContent>
                          {countryOptions.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <OnboardingInput
                    id="foundedAt"
                    label="Founded"
                    type="date"
                    value={founderData.foundedAt}
                    onChange={(value) => updateFounderData({ foundedAt: value })}
                  />

                  <div className="space-y-2">
                    <Label htmlFor="keyFeatures" className="text-sm font-semibold text-black">
                      Key features
                    </Label>
                    <FeaturesInput
                      value={founderData.keyFeatures}
                      onChange={(features) => updateFounderData({ keyFeatures: features })}
                      placeholder="Add a feature"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="about" className="text-sm font-semibold text-black">
                      About
                    </Label>
                    <Textarea
                      id="about"
                      placeholder="Share more details about your project..."
                      value={founderData.about}
                      onChange={(e) => updateFounderData({ about: e.target.value })}
                      className="min-h-[140px] rounded-xl border-2 border-black/10 bg-white focus:border-primary/50 focus:ring-0 text-black placeholder:text-black/40 resize-none"
                    />
                  </div>
                </div>

                <OnboardingNavigation
                  currentStep={founderStep}
                  totalSteps={FOUNDER_STEPS_COUNT}
                  onBack={() => setFounderStep((prev) => Math.max(prev - 1, 1))}
                  onNext={() => setFounderStep((prev) => Math.min(prev + 1, FOUNDER_STEPS_COUNT))}
                  nextButtonText="Continue"
                />
              </div>
            )}

            {/* Founder Step 3: Commission & rules */}
            {founderStep === 3 && (
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
                    <Label htmlFor="commission" className="text-sm font-semibold text-black">
                      Commission percentage
                    </Label>
                    <div className="flex items-center justify-between px-2 text-xl font-black tracking-tight">
                      <span className="text-primary tabular-nums">
                        {founderData.commissionPercentage}%
                      </span>
                    </div>
                    <input
                      id="commission"
                      type="range"
                      min="5"
                      max="90"
                      step="5"
                      value={founderData.commissionPercentage}
                      onChange={(e) =>
                        updateFounderData({ commissionPercentage: parseInt(e.target.value) })
                      }
                      className="w-full h-1 bg-secondary rounded-full appearance-none cursor-pointer accent-primary"
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold px-2">
                      <span>5%</span>
                      <span>50%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="refundWindow" className="text-sm font-semibold text-black">
                      Refund window
                    </Label>
                    <div className="grid grid-cols-4 gap-2.5">
                      {["7", "14", "30", "60"].map((days) => (
                        <SelectableCard
                          key={days}
                          selected={founderData.refundWindow === days}
                          onClick={() => updateFounderData({ refundWindow: days })}
                          height="h-16"
                          className="flex flex-col items-center justify-center"
                        >
                          <p className="text-xl font-black tabular-nums">{days}</p>
                          <p className="text-[10px] font-black opacity-80">Days</p>
                        </SelectableCard>
                      ))}
                    </div>
                  </div>

                  <div className="py-5 rounded-2xl bg-secondary/10 space-y-3">
                      <p className="text-xs font-black text-muted-foreground">
                        Commissions unlock only after the refund window ends. This protects you
                        from chargebacks.
                      </p>
                  </div>

                  {/* <div className="flex items-center justify-between p-5 bg-secondary/20 rounded-2xl">
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
                  </div> */}
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

            {/* Founder Step 4: Publish & discovery */}
            {founderStep === 4 && (
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
                  <div
                    className="flex items-center justify-between p-5 bg-secondary/20 rounded-2xl cursor-pointer transition-all duration-300 hover:bg-primary/10"
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      updateFounderData({ listInDirectory: !founderData.listInDirectory })
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        updateFounderData({ listInDirectory: !founderData.listInDirectory });
                      }
                    }}
                  >
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
                      onClick={(event) => event.stopPropagation()}
                      className="size-6 rounded-md bg-background data-[state=checked]:bg-primary shadow-none"
                    />
                  </div>

                  <div
                    className="flex items-center justify-between p-5 bg-secondary/20 rounded-2xl cursor-pointer transition-all duration-300 hover:bg-primary/10"
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      updateFounderData({ showRevenueStats: !founderData.showRevenueStats })
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        updateFounderData({ showRevenueStats: !founderData.showRevenueStats });
                      }
                    }}
                  >
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
                      onClick={(event) => event.stopPropagation()}
                      className="size-6 rounded-md bg-background data-[state=checked]:bg-primary shadow-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <div
                      className="flex items-center justify-between gap-4 pt-2 cursor-pointer transition-all duration-300 hover:bg-primary/10 rounded-2xl px-2 py-2"
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        updateFounderData({
                          autoApproveApplications: !founderData.autoApproveApplications,
                        })
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          updateFounderData({
                            autoApproveApplications: !founderData.autoApproveApplications,
                          });
                        }
                      }}
                    >
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="autoApproveToggle"
                          className="text-sm font-black tracking-tight text-black"
                        >
                          Auto-approve applications
                        </Label>
                        <p className="text-[11px] text-muted-foreground font-bold">
                          Approve marketers automatically when they apply.
                        </p>
                      </div>
                      <Switch
                        id="autoApproveToggle"
                        checked={founderData.autoApproveApplications}
                        onCheckedChange={(checked) =>
                          updateFounderData({ autoApproveApplications: checked })
                        }
                        onClick={(event) => event.stopPropagation()}
                      />
                    </div>

                    {founderData.autoApproveApplications && (
                      <div className="space-y-3 pt-2">
                        <div
                          className="flex items-center justify-between p-5 bg-secondary/20 rounded-2xl cursor-pointer transition-all duration-300 hover:bg-primary/10"
                          role="button"
                          tabIndex={0}
                          onClick={() =>
                            updateFounderData({
                              autoApproveMatchTerms: !founderData.autoApproveMatchTerms,
                            })
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              updateFounderData({
                                autoApproveMatchTerms: !founderData.autoApproveMatchTerms,
                              });
                            }
                          }}
                        >
                          <div className="space-y-0.5">
                            <Label
                              htmlFor="autoApproveRequirements"
                              className="text-sm font-semibold text-black"
                            >
                              Application matches project requirements
                            </Label>
                            <p className="text-[11px] text-muted-foreground font-bold">
                              Commission and refund window
                            </p>
                          </div>
                          <Checkbox
                            id="autoApproveRequirements"
                            checked={founderData.autoApproveMatchTerms}
                            onCheckedChange={(checked) =>
                              updateFounderData({
                                autoApproveMatchTerms: Boolean(checked),
                              })
                            }
                            onClick={(event) => event.stopPropagation()}
                            className="size-6 rounded-md bg-background data-[state=checked]:bg-primary shadow-none"
                          />
                        </div>
                        <div
                          className="flex items-center justify-between p-5 bg-secondary/20 rounded-2xl cursor-pointer transition-all duration-300 hover:bg-primary/10"
                          role="button"
                          tabIndex={0}
                          onClick={() =>
                            updateFounderData({
                              autoApproveVerifiedOnly: !founderData.autoApproveVerifiedOnly,
                            })
                          }
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              updateFounderData({
                                autoApproveVerifiedOnly: !founderData.autoApproveVerifiedOnly,
                              });
                            }
                          }}
                        >
                          <div className="space-y-0.5">
                            <Label
                              htmlFor="autoApproveVerified"
                              className="text-sm font-semibold text-black"
                            >
                              Marketer is verified
                            </Label>
                            <p className="text-[11px] text-muted-foreground font-bold">
                              Stripe connected
                            </p>
                          </div>
                          <Checkbox
                            id="autoApproveVerified"
                            checked={founderData.autoApproveVerifiedOnly}
                            onCheckedChange={(checked) =>
                              updateFounderData({
                                autoApproveVerifiedOnly: Boolean(checked),
                              })
                            }
                            onClick={(event) => event.stopPropagation()}
                            className="size-6 rounded-md bg-background data-[state=checked]:bg-primary shadow-none"
                          />
                        </div>
                        {!founderData.autoApproveMatchTerms &&
                          !founderData.autoApproveVerifiedOnly && (
                            <p className="text-xs text-muted-foreground font-semibold">
                              No conditions selected. Applications will auto-approve immediately.
                            </p>
                          )}
                      </div>
                    )}
                  </div>

                  <div className="py-5 rounded-2xl bg-secondary/10">
                    <p className="text-xs font-black text-muted-foreground">
                      You&apos;re always in control. You can pause or edit anytime.
                    </p>
                  </div>
                </div>

                {createProjectError && (
                  <p className="text-sm text-destructive font-semibold">
                    {createProjectError}
                  </p>
                )}

                <OnboardingNavigation
                  currentStep={founderStep}
                  totalSteps={FOUNDER_STEPS_COUNT}
                  onBack={() => setFounderStep((prev) => Math.max(prev - 1, 1))}
                  onNext={handlePublishProject}
                  disableNext={isCreatingProject}
                  nextButtonText={isCreatingProject ? "Publishing..." : "Publish project"}
                />
              </div>
            )}

            {/* Founder Step 5: Connect revenue source (skippable) */}
            {founderStep === 5 && (
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
          <div className="flex items-center gap-4 w-full">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-[11px] font-black"
              onClick={() => router.push("/marketer")}
            >
              Skip to dashboard
            </Button>
            <div className="flex-1">
              <OnboardingProgress currentStep={marketerStep} totalSteps={MARKETER_STEPS_COUNT} />
            </div>
          </div>

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

                  <div className="space-y-2">
                    <Label htmlFor="promotionType" className="text-sm font-semibold text-black">
                      Promotion type
                    </Label>
                    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
                      {[
                        { id: "content", label: "Content" },
                        { id: "ads", label: "Ads" },
                        { id: "email", label: "Email" },
                        { id: "social", label: "Social" },
                      ].map((item) => (
                        <SelectableCard
                          key={item.id}
                          selected={marketerData.promotionTypes.includes(item.id)}
                          onClick={() => toggleMarketerPromotionType(item.id)}
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
