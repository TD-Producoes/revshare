"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
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
import { FeaturesInput } from "@/components/ui/features-input";
import { PricingModel } from "@/lib/data/types";
import { countries } from "@/lib/data/countries";
import { Info, Plus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const categories = [
  "Productivity",
  "Developer Tools",
  "Data",
  "Marketing",
  "Design",
  "Finance",
  "Education",
  "Other",
];

export function CreateProjectForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();
  const [tempProjectId] = useState(() => `temp-${Date.now()}`);
  const [userId, setUserId] = useState<string | null>(null);

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

  const resetForm = () => {
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
    });
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
      setOpen(false);
      resetForm();
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Add a new project and set up revenue sharing terms for affiliates.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 pr-4">
          <form onSubmit={handleSubmit} className="space-y-6 pb-4">
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
                          {categories.map((cat) => (
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
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createProject.isPending}>
                {createProject.isPending ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
