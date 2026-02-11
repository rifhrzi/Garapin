"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { reviewApi } from "@/lib/api";
import { toast } from "sonner";
import { Star, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AxiosError } from "axios";

interface ReviewDialogProps {
  projectId: string;
  revieweeId: string;
  revieweeName: string;
  onSuccess?: () => void;
  children: React.ReactNode;
}

export function ReviewDialog({
  projectId,
  revieweeId,
  revieweeName,
  onSuccess,
  children,
}: ReviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    try {
      await reviewApi.create({
        projectId,
        revieweeId,
        rating,
        comment: comment.trim() || undefined,
      });
      toast.success("Review submitted successfully!");
      setOpen(false);
      setRating(0);
      setComment("");
      onSuccess?.();
    } catch (error) {
      const message = error instanceof AxiosError ? error.response?.data?.message : undefined;
      toast.error(message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  }

  const displayRating = hoveredRating || rating;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Leave a Review
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Rate your experience with{" "}
            <span className="font-medium text-foreground">{revieweeName}</span>.
          </p>

          {/* Star Rating */}
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-0.5 transition-transform hover:scale-110">
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      star <= displayRating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground/30",
                    )}
                  />
                </button>
              ))}
              {displayRating > 0 && (
                <span className="ml-2 text-sm font-medium">
                  {displayRating}/5
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label>Comment (optional)</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/500
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Star className="h-4 w-4 mr-2" />
            )}
            Submit Review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
