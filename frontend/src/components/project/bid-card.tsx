"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatRupiah } from "@/types/project";
import { getTierColor } from "@/types/user";
import type { Bid } from "@/types";
import type { FreelancerTier } from "@/types";
import { Calendar, Check, Star, X } from "lucide-react";

interface BidCardProps {
  bid: Bid;
  isProjectOwner?: boolean;
  isOwnBid?: boolean;
  onAccept?: (bidId: string) => void;
  onWithdraw?: (bidId: string) => void;
  isLoading?: boolean;
}

const bidStatusColors: Record<string, string> = {
  PENDING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  ACCEPTED:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  WITHDRAWN: "bg-muted text-muted-foreground",
};

export function BidCard({
  bid,
  isProjectOwner,
  isOwnBid,
  onAccept,
  onWithdraw,
  isLoading,
}: BidCardProps) {
  const profile = bid.freelancer?.freelancerProfile;
  const displayName = profile?.displayName || "Anonymous";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">{displayName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {profile?.tier && (
                  <Badge
                    variant="outline"
                    className={`text-xs border ${getTierColor(profile.tier as FreelancerTier)}`}>
                    {profile.tier}
                  </Badge>
                )}
                {profile && profile.avgRating > 0 && (
                  <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {profile.avgRating.toFixed(1)}
                  </span>
                )}
                {profile && (
                  <span className="text-xs text-muted-foreground">
                    {profile.completedProjects} project
                    {profile.completedProjects !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`border-0 ${bidStatusColors[bid.status]}`}>
            {bid.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="flex items-center gap-4 mb-3">
          <div>
            <p className="text-xs text-muted-foreground">Bid Amount</p>
            <p className="font-semibold text-primary">
              {formatRupiah(bid.amount)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Estimated</p>
            <p className="font-medium flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {bid.estimatedDays} day{bid.estimatedDays !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
          {bid.proposal}
        </p>
      </CardContent>
      {(isProjectOwner || isOwnBid) && bid.status === "PENDING" && (
        <CardFooter className="pt-0 gap-2">
          {isProjectOwner && onAccept && (
            <Button
              size="sm"
              onClick={() => onAccept(bid.id)}
              disabled={isLoading}>
              <Check className="h-4 w-4 mr-1" />
              Accept Bid
            </Button>
          )}
          {isOwnBid && onWithdraw && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onWithdraw(bid.id)}
              disabled={isLoading}>
              <X className="h-4 w-4 mr-1" />
              Withdraw
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
