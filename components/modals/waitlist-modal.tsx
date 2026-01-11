"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface WaitlistModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  source?: string;
}

export function WaitlistModal({ isOpen, onOpenChange, source = "landing" }: WaitlistModalProps) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          source,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          toast.error("You're already on the waitlist!");
        } else if (response.status === 400) {
          toast.error(data.error || "Please check your information");
        } else {
          toast.error(data.error || "Something went wrong. Please try again.");
        }
        setIsLoading(false);
        return;
      }

      setStep("success");
      toast.success("Welcome to the inner circle!");
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setStep("form");
    setFormData({ name: "", email: "" });
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Reset form when closing
      setTimeout(() => {
        setStep("form");
        setFormData({ name: "", email: "" });
      }, 200);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden border border-border/20 bg-white rounded-2xl">
        <AnimatePresence mode="wait">
          {step === "form" ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-8"
            >
              <DialogHeader className="mb-6 space-y-3">
                <div className="flex items-center gap-2.5 mb-2">
                  <span className="text-[11px] font-bold text-amber-600 uppercase tracking-widest">Early Access</span>
                </div>
                <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">Secure your spot.</DialogTitle>
                <DialogDescription className="text-base text-muted-foreground leading-relaxed">
                  Early adopters unlock exclusive perks: lower fees, priority support, and lifetime founder benefits.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wide text-foreground/60">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter your name"
                    className="h-12 bg-white border border-border/40 rounded-xl focus:border-amber-500 focus:ring-0 transition-colors font-medium placeholder:text-muted-foreground/50"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wide text-foreground/60">Work Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    className="h-12 bg-white border border-border/40 rounded-xl focus:border-amber-500 focus:ring-0 transition-colors font-medium placeholder:text-muted-foreground/50"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={isLoading}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-base mt-2 transition-colors"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      Join Waitlist <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="p-12 flex flex-col items-center text-center"
            >
              <div className="h-16 w-16 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
                <Check className="h-8 w-8 text-emerald-500" strokeWidth={2.5} />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">You're on the list!</h3>
              <p className="text-muted-foreground mb-8 max-w-[280px] leading-relaxed">
                Keep an eye on your inbox. We'll reach out when it's your turn.
              </p>
              <Button
                onClick={reset}
                variant="outline"
                className="rounded-full px-6 border-border/40 hover:bg-gray-50 font-semibold"
              >
                Close
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
