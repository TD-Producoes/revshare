"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/data/store";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { PricingModel } from "@/lib/data/types";
import { Plus } from "lucide-react";

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
  const addProject = useAppStore((state) => state.addProject);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    pricingModel: "subscription" as PricingModel,
    price: "",
    revSharePercent: "20",
    cookieWindowDays: "30",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    addProject({
      name: formData.name,
      description: formData.description,
      category: formData.category,
      pricingModel: formData.pricingModel,
      price: Math.round(parseFloat(formData.price) * 100), // Convert to cents
      publicMetrics: {
        mrr: 0,
        activeSubscribers: 0,
      },
      revSharePercent: parseInt(formData.revSharePercent),
      cookieWindowDays: parseInt(formData.cookieWindowDays),
      creatorId: "", // Will be set by the store
    });

    setOpen(false);
    setFormData({
      name: "",
      description: "",
      category: "",
      pricingModel: "subscription",
      price: "",
      revSharePercent: "20",
      cookieWindowDays: "30",
    });

    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Add a new project and set up revenue sharing terms for affiliates.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
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

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your product..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value })
              }
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
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
              <Label htmlFor="revShare">Revenue Share (%)</Label>
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
              <Label htmlFor="cookieWindow">Cookie Window (days)</Label>
              <Input
                id="cookieWindow"
                type="number"
                min="1"
                max="365"
                value={formData.cookieWindowDays}
                onChange={(e) =>
                  setFormData({ ...formData, cookieWindowDays: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Create Project</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
