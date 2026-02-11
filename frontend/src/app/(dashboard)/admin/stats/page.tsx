"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { adminApi } from "@/lib/api";
import { formatRupiah } from "@/types/project";
import type { EnhancedDashboardStats } from "@/types";
import {
  Users,
  Briefcase,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Loader2,
  BarChart3,
  UserCheck,
  FolderOpen,
  CheckCircle2,
  Clock,
  MessageSquare,
  CreditCard,
  Banknote,
  UserPlus,
  FileX,
  Scale,
  Activity,
} from "lucide-react";

export default function AdminStatsPage() {
  const [stats, setStats] = useState<EnhancedDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await adminApi.getEnhancedStats();
        setStats(data);
      } catch {
        // fallback
      } finally {
        setIsLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load statistics.
      </div>
    );
  }

  const totalProjects = stats.projects.total || 1;
  const dist = stats.projectStatusDistribution;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Platform Statistics
        </h1>
        <p className="text-muted-foreground">
          Comprehensive analytics and metrics.
        </p>
      </div>

      {/* User Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Users className="h-5 w-5" />
          Users
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.users.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Clients
              </CardTitle>
              <UserCheck className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.users.clients}</div>
              <div className="mt-2">
                <Progress
                  value={
                    stats.users.total > 0
                      ? (stats.users.clients / stats.users.total) * 100
                      : 0
                  }
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.users.total > 0
                    ? Math.round(
                        (stats.users.clients / stats.users.total) * 100,
                      )
                    : 0}
                  % of total users
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Freelancers
              </CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats.users.freelancers}
              </div>
              <div className="mt-2">
                <Progress
                  value={
                    stats.users.total > 0
                      ? (stats.users.freelancers / stats.users.total) * 100
                      : 0
                  }
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.users.total > 0
                    ? Math.round(
                        (stats.users.freelancers / stats.users.total) * 100,
                      )
                    : 0}
                  % of total users
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                New Users (7 days)
              </CardTitle>
              <UserPlus className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats.recentUsersCount}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Registered in the last 7 days
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Project Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Projects
        </h2>
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Project Counts */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total
                </CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats.projects.total}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Open
                </CardTitle>
                <FolderOpen className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.projects.open}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  In Progress
                </CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats.projects.active}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completed
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats.projects.completed}
                </div>
                <div className="mt-2">
                  <Progress
                    value={Math.round(
                      (stats.projects.completed / totalProjects) * 100,
                    )}
                    className="h-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(
                      (stats.projects.completed / totalProjects) * 100,
                    )}
                    % completion rate
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Project Status Distribution */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  label: "Draft",
                  value: dist.draft,
                  color: "bg-gray-400",
                  icon: FileX,
                },
                {
                  label: "Open",
                  value: dist.open,
                  color: "bg-green-500",
                  icon: FolderOpen,
                },
                {
                  label: "In Progress",
                  value: dist.inProgress,
                  color: "bg-blue-500",
                  icon: Clock,
                },
                {
                  label: "Delivered",
                  value: dist.delivered,
                  color: "bg-purple-500",
                  icon: Activity,
                },
                {
                  label: "Completed",
                  value: dist.completed,
                  color: "bg-emerald-500",
                  icon: CheckCircle2,
                },
                {
                  label: "Disputed",
                  value: dist.disputed,
                  color: "bg-red-500",
                  icon: Scale,
                },
                {
                  label: "Cancelled",
                  value: dist.cancelled,
                  color: "bg-gray-300 dark:bg-gray-600",
                  icon: FileX,
                },
              ].map((item) => {
                const pct =
                  totalProjects > 0
                    ? Math.round((item.value / totalProjects) * 100)
                    : 0;
                return (
                  <div key={item.label} className="flex items-center gap-3">
                    <item.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground w-20 shrink-0">
                      {item.label}
                    </span>
                    <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${item.color}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-12 text-right">
                      {item.value} ({pct}%)
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Revenue Stats */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Revenue & Transactions
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Platform Revenue
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatRupiah(stats.revenue.platformRevenue)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From 15% platform fees
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
                {formatRupiah(stats.revenue.escrowHeld)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                In funded escrows
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Escrows
              </CardTitle>
              <CreditCard className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEscrows}</div>
              <p className="text-xs text-muted-foreground mt-1">
                All escrow transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Payouts
              </CardTitle>
              <Banknote className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPayouts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.pendingPayouts} pending
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Trust & Safety */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Trust & Safety
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Open Disputes
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.disputes.open}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Require admin review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Flagged Messages
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.flaggedMessages}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Contact info detected in chats
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Disputed Projects
              </CardTitle>
              <Scale className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{dist.disputed}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalProjects > 0
                  ? Math.round((dist.disputed / totalProjects) * 100)
                  : 0}
                % of all projects
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
