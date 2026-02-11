"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  Plus,
  Gavel,
  DollarSign,
  Star,
  TrendingUp,
  Search,
  ArrowRight,
  Award,
  Users,
  AlertTriangle,
  MessageSquare,
  Loader2,
  Shield,
} from "lucide-react";
import { getTierLabel, getTierColor } from "@/types/user";
import { formatRupiah } from "@/types/project";
import { adminApi, projectApi, bidApi, escrowApi, authApi } from "@/lib/api";
import type { FreelancerTier, FreelancerProfile } from "@/types/user";
import type { DashboardStats, Project, Bid, EarningsData } from "@/types";

// Simple in-memory cache to avoid refetching on back-navigation
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 60_000; // 1 minute

function useCachedFetch<T>(key: string, fetcher: () => Promise<T>) {
  const hasCacheHit = () => {
    const hit = cache.get(key);
    return hit && Date.now() - hit.ts < CACHE_TTL ? (hit.data as T) : null;
  };

  const [data, setData] = useState<T | null>(hasCacheHit);
  const [isLoading, setIsLoading] = useState(!data);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let cancelled = false;
    const cached = hasCacheHit();

    if (cached) {
      // Already have cached data from useState init - just revalidate in background
      fetcherRef.current().then((fresh) => {
        if (cancelled) return;
        cache.set(key, { data: fresh, ts: Date.now() });
        setData(fresh);
      }).catch(() => {});
      return () => { cancelled = true; };
    }

    setIsLoading(true);
    fetcherRef.current()
      .then((result) => {
        if (cancelled) return;
        cache.set(key, { data: result, ts: Date.now() });
        setData(result);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data, isLoading };
}

export default function DashboardPage() {
  const { user, isHydrated } = useAuthStore();

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return null;

  if (user.role === "FREELANCER") {
    return <FreelancerDashboard />;
  }

  if (user.role === "ADMIN") {
    return <AdminDashboard />;
  }

  return <ClientDashboard />;
}

function ClientDashboard() {
  const { user } = useAuthStore();
  const { data: projects, isLoading } = useCachedFetch<Project[]>(
    "client-projects",
    () => projectApi.getMyProjects(),
  );

  const activeProjects = (projects ?? []).filter(
    (p) => p.status === "IN_PROGRESS" || p.status === "DELIVERED"
  );
  const completedProjects = (projects ?? []).filter(
    (p) => p.status === "COMPLETED"
  );
  const totalProjects = (projects ?? []).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.displayName}
        </h1>
        <p className="text-muted-foreground">
          Manage your projects and find freelancers.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Projects
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : activeProjects.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalProjects} total projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : completedProjects.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Finished projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open Projects
            </CardTitle>
            <Gavel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading
                ? "..."
                : (projects ?? []).filter((p) => p.status === "OPEN").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting bids
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Plus className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-semibold mb-1">Post a New Project</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Describe your project and start receiving bids from freelancers.
            </p>
            <Button asChild>
              <Link href="/projects/new">
                Post Project
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Search className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="font-semibold mb-1">Browse Freelancers</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Find and compare qualified freelancers by tier and rating.
            </p>
            <Button variant="outline" asChild>
              <Link href="/projects">
                Browse Projects
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FreelancerDashboard() {
  const { user } = useAuthStore();

  type FreelancerData = { bids: Bid[]; earnings: EarningsData | null; profile: FreelancerProfile | null };
  const { data, isLoading } = useCachedFetch<FreelancerData>(
    "freelancer-dashboard",
    async () => {
      const [bidsData, earningsData, meData] = await Promise.all([
        bidApi.getMyBids(),
        escrowApi.getEarnings(),
        authApi.me(),
      ]);
      return {
        bids: bidsData,
        earnings: earningsData,
        profile: meData.freelancerProfile ?? null,
      };
    },
  );

  const bids = data?.bids ?? [];
  const earnings = data?.earnings ?? null;
  const profile = data?.profile ?? null;

  const tier = (profile?.tier ?? "BRONZE") as FreelancerTier;
  const avgRating = profile?.avgRating ?? 0;
  const completionRate = profile?.completionRate ?? 100;
  const completedProjects = profile?.completedProjects ?? 0;
  const activeBids = bids.filter((b) => b.status === "PENDING").length;
  const totalEarned = earnings?.summary.totalEarned ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.displayName}
        </h1>
        <p className="text-muted-foreground">
          Track your bids, earnings, and tier progress.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Bids
            </CardTitle>
            <Gavel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : activeBids}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pending proposals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Earnings
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : formatRupiah(totalEarned)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {earnings?.summary.thisMonth
                ? `${formatRupiah(earnings.summary.thisMonth)} this month`
                : "All time earnings"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rating
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgRating > 0 ? avgRating.toFixed(1) : "--"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {completedProjects > 0
                ? `${completedProjects} project${completedProjects > 1 ? "s" : ""} completed`
                : "No reviews yet"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(completionRate)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {completionRate >= 80 ? "Keep it up!" : "Needs improvement"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tier Card */}
      <Card>
        <CardContent className="flex items-center gap-4 py-6">
          <div className="h-14 w-14 rounded-full bg-orange-50 flex items-center justify-center">
            <Award className="h-7 w-7 text-orange-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Current Tier</h3>
              <Badge className={getTierColor(tier)}>
                {getTierLabel(tier)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {completedProjects} project{completedProjects !== 1 ? "s" : ""}{" "}
              completed &middot; {avgRating > 0 ? `${avgRating.toFixed(1)} avg rating` : "No ratings yet"}
            </p>
          </div>
          <Link href="/profile/edit" className="hidden sm:block">
            <Button variant="outline" size="sm">
              View Profile
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-10">
          <Search className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="font-semibold mb-1">Find Projects</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Browse open projects and submit your proposals to start earning.
          </p>
          <Button asChild>
            <Link href="/projects">
              Browse Projects
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminDashboard() {
  const { user } = useAuthStore();
  const { data: stats, isLoading } = useCachedFetch<DashboardStats>(
    "admin-stats",
    () => adminApi.getDashboardStats(),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome, {user?.displayName}. Manage the platform from here.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.users.total ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.users.clients ?? 0} clients,{" "}
                  {stats?.users.freelancers ?? 0} freelancers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Projects
                </CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.projects.active ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.projects.total ?? 0} total projects
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Open Disputes
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.disputes.open ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Requires attention
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Flagged Messages
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.flaggedMessages ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Contact bypass attempts
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Summary */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Platform Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatRupiah(stats?.revenue.platformRevenue ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  From 15% platform fee
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Escrow Held
                </CardTitle>
                <DollarSign className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatRupiah(stats?.revenue.escrowHeld ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  In funded escrows
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Links */}
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/admin">
                <Shield className="h-4 w-4 mr-2" />
                Admin Panel
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/disputes">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Manage Disputes
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/users">
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
