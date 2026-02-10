"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ReviewDialog } from "@/components/project/review-dialog";
import { CheckCircle2, Star } from "lucide-react";

interface Review {
  id: string;
  reviewerId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  reviewer?: {
    freelancerProfile?: { displayName: string } | null;
    clientProfile?: { displayName: string } | null;
  };
}

interface ReviewSectionProps {
  projectId: string;
  reviews: Review[];
  currentUserId: string;
  isProjectOwner: boolean;
  isAssignedFreelancer: boolean;
  selectedFreelancerId?: string | null;
  selectedFreelancerName: string;
  clientId: string;
  clientName: string;
  onSuccess: () => void;
}

export function ReviewSection({
  projectId,
  reviews,
  currentUserId,
  isProjectOwner,
  isAssignedFreelancer,
  selectedFreelancerId,
  selectedFreelancerName,
  clientId,
  clientName,
  onSuccess,
}: ReviewSectionProps) {
  const hasReviewed = reviews.some((r) => r.reviewerId === currentUserId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Rate & Review
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasReviewed && (
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              This project is complete. Leave a review for your experience.
            </p>
            {isProjectOwner && selectedFreelancerId && (
              <ReviewDialog
                projectId={projectId}
                revieweeId={selectedFreelancerId}
                revieweeName={selectedFreelancerName}
                onSuccess={onSuccess}>
                <Button>
                  <Star className="h-4 w-4 mr-2" />
                  Review Freelancer
                </Button>
              </ReviewDialog>
            )}
            {isAssignedFreelancer && (
              <ReviewDialog
                projectId={projectId}
                revieweeId={clientId}
                revieweeName={clientName}
                onSuccess={onSuccess}>
                <Button>
                  <Star className="h-4 w-4 mr-2" />
                  Review Client
                </Button>
              </ReviewDialog>
            )}
          </div>
        )}
        {hasReviewed && (
          <p className="text-sm text-green-600 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            You have already submitted your review.
          </p>
        )}

        {reviews.length > 0 && (
          <div className="space-y-3 pt-2">
            <Separator />
            <h4 className="text-sm font-semibold">Reviews</h4>
            {reviews.map((review) => {
              const reviewerName =
                review.reviewer?.freelancerProfile?.displayName ||
                review.reviewer?.clientProfile?.displayName ||
                "Anonymous";
              return (
                <div
                  key={review.id}
                  className="border rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{reviewerName}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating
                            ? "text-yellow-500 fill-yellow-500"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">
                      {review.comment}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
