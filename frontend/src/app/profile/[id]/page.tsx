"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { userApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Star,
  Briefcase,
  TrendingUp,
  Clock,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { getTierLabel, getTierColor } from "@/types/user";
import type { User, FreelancerTier, Review } from "@/types/user";

export default function PublicProfilePage() {
  const params = useParams();
  const userId = params.id as string;
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const data = await userApi.getProfile(userId);
        setProfile(data as unknown as User);
      } catch {
        setError("Profile not found");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-1">Profile Not Found</h3>
            <p className="text-sm text-muted-foreground">
              {error || "This user does not exist."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fp = profile.freelancerProfile;
  const cp = profile.clientProfile;
  const displayName = fp?.displayName || cp?.displayName || profile.email;
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Profile Header */}
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar className="h-24 w-24">
              {fp?.avatarUrl && (
                <AvatarImage src={fp.avatarUrl} alt={displayName} />
              )}
              <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl font-bold">{displayName}</h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                <Badge variant="secondary">
                  {profile.role === "FREELANCER"
                    ? "Freelancer"
                    : profile.role === "CLIENT"
                      ? "Client"
                      : "Admin"}
                </Badge>
                {fp && (
                  <Badge className={getTierColor(fp.tier as FreelancerTier)}>
                    {getTierLabel(fp.tier as FreelancerTier)}
                  </Badge>
                )}
              </div>
              {fp?.bio && (
                <p className="text-muted-foreground mt-3 text-sm">{fp.bio}</p>
              )}
              {cp?.companyName && (
                <p className="text-muted-foreground mt-2 text-sm">
                  Company: {cp.companyName}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Member since{" "}
                {new Date(profile.createdAt).toLocaleDateString("id-ID", {
                  year: "numeric",
                  month: "long",
                })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Freelancer Stats */}
      {fp && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="py-4 text-center">
              <Briefcase className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold">{fp.completedProjects}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <Star className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold">
                {fp.avgRating > 0 ? fp.avgRating.toFixed(1) : "--"}
              </p>
              <p className="text-xs text-muted-foreground">Avg Rating</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <TrendingUp className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold">{fp.completionRate}%</p>
              <p className="text-xs text-muted-foreground">Completion</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold">
                {fp.responseTimeAvg > 0
                  ? `${fp.responseTimeAvg.toFixed(0)}h`
                  : "--"}
              </p>
              <p className="text-xs text-muted-foreground">Avg Response</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Portfolio */}
      {fp &&
        fp.portfolioLinks &&
        (fp.portfolioLinks as unknown[]).length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Portfolio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {(
                  fp.portfolioLinks as Array<{
                    type: string;
                    url: string;
                    label: string;
                  }>
                ).map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm hover:bg-accent transition-colors">
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span className="capitalize">{link.type}</span>
                    {link.label && (
                      <span className="text-muted-foreground">
                        - {link.label}
                      </span>
                    )}
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Reviews */}
      {(profile as unknown as { reviewsReceived?: Review[] }).reviewsReceived &&
        (profile as unknown as { reviewsReceived: Review[] }).reviewsReceived
          .length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Recent Reviews</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(
                profile as unknown as { reviewsReceived: Review[] }
              ).reviewsReceived.map((review) => (
                <div key={review.id}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < review.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString("id-ID")}
                    </span>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">
                      {review.comment}
                    </p>
                  )}
                  {review.project && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Project: {review.project.title}
                    </p>
                  )}
                  <Separator className="mt-4" />
                </div>
              ))}
            </CardContent>
          </Card>
        )}
    </div>
  );
}
