"use client";

import { useState, useEffect, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuthUserId } from "@/lib/hooks/auth";
import { useUser } from "@/lib/hooks/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ImageUpload } from "@/components/ui/image-upload";
import { MultiImageUpload } from "@/components/ui/multi-image-upload";
import { FeaturesInput } from "@/components/ui/features-input";
import { PricingModel } from "@/lib/data/types";
import { countries } from "@/lib/data/countries";
import { projectCategories } from "@/lib/data/categories";
import { Info, Plus, Loader2, Sparkles, CheckCircle2, CreditCard } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

// Helper function to map scraped category to form category
function mapCategoryToFormCategory(scrapedCategory: string | null): string {
  if (!scrapedCategory) return "";
  
  const lowerCategory = scrapedCategory.toLowerCase();
  
  // Map common categories to our project categories
  if (lowerCategory.includes("developer") || lowerCategory.includes("dev tool")) {
    return "Developer Tools";
  }
  if (lowerCategory.includes("productivity")) {
    return "Productivity";
  }
  if (lowerCategory.includes("marketing") || lowerCategory.includes("advertising")) {
    return "Marketing";
  }
  if (lowerCategory.includes("design") || lowerCategory.includes("creative")) {
    return "Design";
  }
  if (lowerCategory.includes("finance") || lowerCategory.includes("fintech") || lowerCategory.includes("payment")) {
    return "Finance & FinTech";
  }
  if (lowerCategory.includes("education") || lowerCategory.includes("edtech") || lowerCategory.includes("learning")) {
    return "Education & EdTech";
  }
  if (lowerCategory.includes("data") || lowerCategory.includes("analytics")) {
    return "Data & Analytics";
  }
  if (lowerCategory.includes("saas") || lowerCategory.includes("software as a service")) {
    return "SaaS";
  }
  if (lowerCategory.includes("ecommerce") || lowerCategory.includes("e-commerce") || lowerCategory.includes("online store")) {
    return "E-commerce";
  }
  if (lowerCategory.includes("health") && !lowerCategory.includes("healthcare")) {
    return "Health & Fitness";
  }
  if (lowerCategory.includes("healthcare") || lowerCategory.includes("healthtech")) {
    return "Healthcare & HealthTech";
  }
  if (lowerCategory.includes("ai") || lowerCategory.includes("artificial intelligence") || lowerCategory.includes("machine learning")) {
    return "AI & Machine Learning";
  }
  if (lowerCategory.includes("blockchain") || lowerCategory.includes("crypto") || lowerCategory.includes("cryptocurrency")) {
    return "Blockchain & Crypto";
  }
  
  // Check if it matches any existing category exactly
  const matchedCategory = projectCategories.find(
    (cat) => cat.toLowerCase() === lowerCategory
  );
  if (matchedCategory) return matchedCategory;
  
  return "";
}

// Helper function to map country name to country code
function mapCountryNameToCode(countryName: string | null): string {
  if (!countryName) return "";
  
  // Try exact match first
  const exactMatch = countries.find(
    (c) => c.name.toLowerCase() === countryName.toLowerCase()
  );
  if (exactMatch) return exactMatch.code;
  
  // Try partial match
  const partialMatch = countries.find((c) =>
    countryName.toLowerCase().includes(c.name.toLowerCase()) ||
    c.name.toLowerCase().includes(countryName.toLowerCase())
  );
  if (partialMatch) return partialMatch.code;
  
  // Try common country name variations
  const variations: Record<string, string> = {
    "usa": "US",
    "united states": "US",
    "uk": "GB",
    "united kingdom": "GB",
    "canada": "CA",
    "australia": "AU",
    "germany": "DE",
    "france": "FR",
    "netherlands": "NL",
    "sweden": "SE",
    "switzerland": "CH",
    "singapore": "SG",
  };
  
  const lowerName = countryName.toLowerCase();
  for (const [key, code] of Object.entries(variations)) {
    if (lowerName.includes(key)) {
      return code;
    }
  }
  
  return "";
}

// Helper function to format date from various formats to YYYY-MM-DD
function formatDateForInput(dateStr: string | null): string {
  if (!dateStr) return "";
  
  // If already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // If in YYYY format, use January 1st
  if (/^\d{4}$/.test(dateStr)) {
    return `${dateStr}-01-01`;
  }
  
  // Try to parse other formats
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split("T")[0];
  }
  
  return "";
}

export function CreateProjectForm() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | "loading" | 2 | "success">(1); // Step 1: URL input, loading: scraping, Step 2: Form, success: success message
  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState("");
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);
  const queryClient = useQueryClient();
  const [tempProjectId] = useState(() => `temp-${Date.now()}`);
  const [userId, setUserId] = useState<string | null>(null);
  const { data: authUserId } = useAuthUserId();
  const { data: currentUser } = useUser(authUserId);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    pricingModel: "subscription" as PricingModel,
    price: "",
    revSharePercent: "20",
    refundWindowDays: "30",
    country: "",
    website: "",
    foundationDate: "",
    about: "",
    features: [] as string[],
    logoUrl: null as string | null,
    imageUrls: [] as string[],
  });

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserId(data.user.id);
      }
    };
    fetchUser();
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      name: "",
      description: "",
      category: "",
      pricingModel: "subscription",
      price: "",
      revSharePercent: "20",
      refundWindowDays: "30",
      country: "",
      website: "",
      foundationDate: "",
      about: "",
      features: [],
      logoUrl: null,
      imageUrls: [],
    });
  }, []);

  // Reset form and step when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setStep(1);
      setUrlInput("");
      resetForm();
      setError("");
      setIsConnectingStripe(false);
    }
  };

  // Mutation to scrape website
  const scrapeWebsite = useMutation({
    mutationFn: async (url: string) => {
      const response = await fetch("/api/projects/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Failed to scrape website");
      }

      const result = await response.json();
      return result.data;
    },
    onSuccess: (scrapedData) => {
      // Populate form with scraped data
      setFormData((prev) => ({
        ...prev,
        name: scrapedData.projectName || prev.name,
        description: scrapedData.shortDescription || prev.description,
        category: mapCategoryToFormCategory(scrapedData.category) || prev.category,
        country: mapCountryNameToCode(scrapedData.country) || prev.country,
        website: scrapedData.websiteUrl || prev.website,
        foundationDate: formatDateForInput(scrapedData.foundedAt) || prev.foundationDate,
        about: scrapedData.about || prev.about,
        features: scrapedData.keyFeatures || prev.features,
        logoUrl: scrapedData.logoUrl || prev.logoUrl,
        // Add scraped images (og:image, etc.) to imageUrls
        imageUrls: scrapedData.images || prev.imageUrls,
      }));
      
      // Move to step 2 after successful scraping
      setStep(2);
      setError("");
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to scrape website");
    },
  });

  const handleGenerate = async () => {
    if (!urlInput.trim()) {
      setError("Please enter a website URL");
      return;
    }

    setError("");
    setStep("loading");
    try {
      await scrapeWebsite.mutateAsync(urlInput.trim());
    } catch {
      // Error is handled by scrapeWebsite mutation
      setStep(1);
    }
  };

  const handleSkip = () => {
    // Set the URL if provided, then move to step 2
    if (urlInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        website: urlInput.trim(),
      }));
    }
    setStep(2);
    setError("");
  };

  const createProject = useMutation({
    mutationFn: async () => {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.getUser();
      if (authError || !data.user) {
        throw new Error("You must be logged in to create a project.");
      }

      const description = formData.description.trim();
      const marketerCommissionPercent = Number(formData.revSharePercent);
      const refundWindowDays = Number(formData.refundWindowDays);
      const payload = {
        userId: data.user.id,
        name: formData.name.trim(),
        ...(description ? { description } : {}),
        ...(formData.category ? { category: formData.category } : {}),
        ...(Number.isFinite(marketerCommissionPercent)
          ? { marketerCommissionPercent }
          : {}),
        ...(Number.isFinite(refundWindowDays) ? { refundWindowDays } : {}),
        ...(formData.country ? { country: formData.country } : {}),
        ...(formData.website.trim() ? { website: formData.website.trim() } : {}),
        ...(formData.foundationDate
          ? { foundationDate: new Date(formData.foundationDate).toISOString() }
          : {}),
        ...(formData.about.trim() ? { about: formData.about.trim() } : {}),
        ...(formData.features.length > 0 ? { features: formData.features } : {}),
        ...(formData.logoUrl ? { logoUrl: formData.logoUrl } : {}),
        ...(formData.imageUrls.length > 0 ? { imageUrls: formData.imageUrls } : {}),
      };

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Unable to create project.");
      }

      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
      // Move to success step
      setStep("success");
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Unable to create project.");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.country) {
      setError("Please select a country.");
      return;
    }

    await createProject.mutateAsync();
  };

  const handleConnectStripe = async () => {
    if (!userId) return;
    
    setIsConnectingStripe(true);
    setError("");
    
    try {
      const origin = window.location.origin;
      const response = await fetch("/api/connect/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          email: currentUser?.email || "",
          name: currentUser?.name || "",
          role: "creator",
          returnUrl: `${origin}/creator/settings`,
          refreshUrl: `${origin}/creator/settings`,
        }),
      });
      
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Failed to connect Stripe.");
      }
      
      if (payload?.data?.onboardingUrl) {
        window.location.href = payload.data.onboardingUrl;
        return;
      }
      
      throw new Error("Missing onboarding URL.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to connect Stripe.";
      setError(message);
    } finally {
      setIsConnectingStripe(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className={`sm:max-w-[600px] flex flex-col p-0 overflow-hidden ${
        step === 1 || step === "loading" || step === "success" ? "max-h-[400px]" : "h-[90vh]"
      }`}>
        {/* Header - Fixed */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
          <DialogTitle>
            {step === 1
              ? "Generate project details from website URL"
              : step === "loading"
              ? "Scraping website..."
              : step === "success"
              ? "Project Created Successfully!"
              : "Create New Project"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Provide your project's website URL to automatically fill in the form, or skip to fill it manually."
              : step === "loading"
              ? "Please wait while we analyze your website..."
              : step === "success"
              ? "Your project has been created. Connect Stripe to start receiving payments."
              : "Add a new project and set up revenue sharing terms for affiliates."}
          </DialogDescription>
        </DialogHeader>

        {/* Content - Scrollable */}
        <div className={step === 1 || step === "loading" || step === "success" ? "max-h-[200px] overflow-hidden" : "flex-1 min-h-0 overflow-hidden"}>
          <ScrollArea className={step === 1 || step === "loading" || step === "success" ? "max-h-[200px] px-6" : "h-full px-6"}>
            <div className="py-4">
            {step === "loading" ? (
              // Loading Step: Scraping website
              <div className="flex flex-col items-center justify-center gap-4 py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium">Scraping website...</p>
                  <p className="text-xs text-muted-foreground">Please wait</p>
                </div>
              </div>
            ) : step === "success" ? (
              // Success Step: Project created
              <div className="flex flex-col items-center justify-center gap-4 py-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <CheckCircle2 className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium">Project created successfully!</p>
                  <p className="text-xs text-muted-foreground">
                    Connect your Stripe account to start receiving payments from marketers.
                  </p>
                </div>
                {error && <p className="text-sm text-destructive mt-2">{error}</p>}
              </div>
            ) : step === 1 ? (
              // Step 1: URL Input
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="website-url">Website URL</Label>
                  <Input
                    id="website-url"
                    type="url"
                    placeholder="https://myproduct.com"
                    value={urlInput}
                    onChange={(e) => {
                      setUrlInput(e.target.value);
                      setError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleGenerate();
                      }
                    }}
                    disabled={scrapeWebsite.isPending}
                  />
                  <p className="text-sm text-muted-foreground">
                    We&apos;ll analyze your website and automatically fill in project details.
                  </p>
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
            ) : (
              // Step 2: Form
              <form onSubmit={handleSubmit} id="create-project-form" className="space-y-6">
              {/* Basic Info Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Basic Information
                </h3>

                <div className="grid grid-cols-[96px_1fr] gap-4 items-start">
                  <div className="space-y-2">
                    <Label>Logo</Label>
                    {userId && (
                      <ImageUpload
                        value={formData.logoUrl}
                        onChange={(url) =>
                          setFormData({ ...formData, logoUrl: url })
                        }
                        userId={userId}
                        projectId={tempProjectId}
                        type="logo"
                        placeholder="Logo"
                      />
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Project Name *</Label>
                      <Input
                        id="name"
                        placeholder="My Awesome SaaS"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) =>
                            setFormData({ ...formData, category: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {projectCategories.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="country">Country *</Label>
                        <Select
                          value={formData.country}
                          onValueChange={(value) =>
                            setFormData({ ...formData, country: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map((c) => (
                              <SelectItem key={c.code} value={c.code}>
                                {c.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Short Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="A brief tagline for your product..."
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={2}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      type="url"
                      placeholder="https://myproduct.com"
                      value={formData.website}
                      onChange={(e) =>
                        setFormData({ ...formData, website: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="foundationDate">Founded</Label>
                    <Input
                      id="foundationDate"
                      type="date"
                      value={formData.foundationDate}
                      onChange={(e) =>
                        setFormData({ ...formData, foundationDate: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Revenue Sharing Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Revenue Sharing
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pricingModel">Pricing Model</Label>
                    <Select
                      value={formData.pricingModel}
                      onValueChange={(value: PricingModel) =>
                        setFormData({ ...formData, pricingModel: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="subscription">Subscription</SelectItem>
                        <SelectItem value="one-time">One-time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="price">
                      Price ({formData.pricingModel === "subscription" ? "/mo" : ""})
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="29.00"
                        className="pl-7"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({ ...formData, price: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="revShare" className="flex items-center gap-2">
                      Revenue Share (%)
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex h-4 w-4 items-center justify-center text-muted-foreground"
                            aria-label="Revenue share default info"
                          >
                            <Info className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          Default commission for new contracts. You can override it per
                          contract when reviewing applications.
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <div className="relative">
                      <Input
                        id="revShare"
                        type="number"
                        min="1"
                        max="100"
                        value={formData.revSharePercent}
                        onChange={(e) =>
                          setFormData({ ...formData, revSharePercent: e.target.value })
                        }
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        %
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="refundWindow" className="flex items-center gap-2">
                      Refund Window (days)
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            className="inline-flex h-4 w-4 items-center justify-center text-muted-foreground"
                            aria-label="Refund window default info"
                          >
                            <Info className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          Default refund window for new contracts. Commissions become
                          payable only after this period passes without a refund. Each
                          contract can override it without changing existing purchases.
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input
                      id="refundWindow"
                      type="number"
                      min="1"
                      max="365"
                      value={formData.refundWindowDays}
                      onChange={(e) =>
                        setFormData({ ...formData, refundWindowDays: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Additional Details Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Additional Details (Optional)
                </h3>

                <div className="space-y-2">
                  <Label htmlFor="about">About</Label>
                  <Textarea
                    id="about"
                    placeholder="Detailed description of your project, ideal customer, and what makes it unique..."
                    value={formData.about}
                    onChange={(e) =>
                      setFormData({ ...formData, about: e.target.value })
                    }
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Key Features</Label>
                  <FeaturesInput
                    value={formData.features}
                    onChange={(features) =>
                      setFormData({ ...formData, features })
                    }
                    placeholder="e.g., Real-time analytics"
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Gallery Images</Label>
                  {userId && (
                    <MultiImageUpload
                      value={formData.imageUrls}
                      onChange={(urls) =>
                        setFormData({ ...formData, imageUrls: urls })
                      }
                      userId={userId}
                      projectId={tempProjectId}
                      maxImages={6}
                    />
                  )}
                  <p className="text-xs text-muted-foreground">
                    Add up to 6 images to showcase your project. The first image from your website (og:image) has been automatically added.
                  </p>
                </div>
              </div>

                {error && <p className="text-sm text-destructive">{error}</p>}
              </form>
            )}
            </div>
          </ScrollArea>
        </div>

        {/* Footer - Fixed */}
        <div className="px-6 py-4 border-t flex justify-end gap-2 flex-shrink-0">
          {step === 1 ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={scrapeWebsite.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                disabled={scrapeWebsite.isPending}
              >
                Skip
              </Button>
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={scrapeWebsite.isPending || !urlInput.trim()}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate
              </Button>
            </>
          ) : step === "loading" ? (
            // Loading step - no buttons, just wait
            null
          ) : step === "success" ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  resetForm();
                  setStep(1);
                }}
              >
                Skip
              </Button>
              <Button
                type="button"
                onClick={handleConnectStripe}
                disabled={isConnectingStripe || !currentUser}
              >
                {isConnectingStripe ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Connect Stripe
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                form="create-project-form"
                disabled={createProject.isPending}
              >
                {createProject.isPending ? "Creating..." : "Create Project"}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
