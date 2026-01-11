"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { useCreateTestimonial } from "@/lib/hooks/contracts";
import type { Contract } from "@/lib/hooks/contracts";

type TestimonialDialogProps = {
  contract: Contract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorId: string | null | undefined;
};

export function TestimonialDialog({
  contract,
  open,
  onOpenChange,
  creatorId,
}: TestimonialDialogProps) {
  const [testimonialText, setTestimonialText] = useState("");
  const [testimonialRating, setTestimonialRating] = useState<number>(5);
  const createTestimonial = useCreateTestimonial();

  const handleSubmit = async () => {
    if (!contract || !creatorId || !testimonialText.trim()) {
      return;
    }

    try {
      await createTestimonial.mutateAsync({
        contractId: contract.id,
        creatorId,
        rating: testimonialRating,
        text: testimonialText.trim(),
      });
      // Show success toast
      toast.success("Testimonial submitted successfully!", {
        description: `Your testimonial for ${contract.userName} has been saved.`,
      });
      // Close dialog after successful submission
      onOpenChange(false);
      setTestimonialText("");
      setTestimonialRating(5);
    } catch (error) {
      // Show error toast
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to submit testimonial. Please try again.";
      toast.error("Failed to submit testimonial", {
        description: errorMessage,
      });
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setTestimonialText("");
      setTestimonialRating(5);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Write Testimonial</DialogTitle>
          <DialogDescription>
            {contract
              ? `Share your experience working with ${contract.userName} on ${contract.projectName}`
              : "Write a testimonial for this marketer."}
          </DialogDescription>
        </DialogHeader>

        {contract && (
          <div className="space-y-4">
            {/* Rating */}
            <div className="space-y-2">
              <Label htmlFor="rating">Rating</Label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setTestimonialRating(rating)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 transition-colors ${
                        rating <= testimonialRating
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Testimonial Text */}
            <div className="space-y-2">
              <Label htmlFor="testimonial">Testimonial</Label>
              <Textarea
                id="testimonial"
                placeholder="Share your experience working with this marketer..."
                value={testimonialText}
                onChange={(e) => setTestimonialText(e.target.value)}
                rows={6}
                maxLength={500}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {testimonialText.length}/500
              </p>
            </div>
          </div>
        )}

        {contract && (
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={
                !testimonialText.trim() ||
                testimonialText.trim().length < 10 ||
                createTestimonial.isPending
              }
            >
              {createTestimonial.isPending ? "Submitting..." : "Submit Testimonial"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

