"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { adminApi } from "@/lib/api";
import { formatRupiah } from "@/types/project";
import type { EnhancedDashboardStats } from "@/types";
import {
  Users,
  Briefcase,
  AlertTriangle,
  DollarSign,
  MessageSquare,
  Shield,
  ArrowRight,
  Loader2,
  TrendingUp,
  BarChart3,
  Activity,
  CheckCircle2,
  FolderOpen,
  CreditCard,
  ClipboardList,
  UserPlus,
} from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  OPEN: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  IN_PROGRESS: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  DELIVERED:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  COMPLETED:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  DISPUTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  CANCELLED: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

const DISPUTE_STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  UNDER_REVIEW:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  RESOLVED:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  CLOSED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const ESCROW_STATUS_COLORS: Record<string, string> = {
  PENDING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  FUNDED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  RELEASED:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  REFUNDED:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  DISPUTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const ACTION_COLORS: Record<string, string> = {
  SUSPEND_USER: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  UNSUSPEND_USER:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  DISPUTE_RESOLVE:
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  TIER_ADJUST:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
};

function getDisplayName(user: {
  email?: string;
  freelancerProfile?: { displayName: string } | null;
  clientProfile?: { displayName: string } | null;
}): string {
  return (
    user.freelancerProfile?.displayName ||
    user.clientProfile?.displayName ||
    user.email ||
    "Unknown"
  );
}

export default function AdminPanelPage() {
  const [stats, setStats] = useState<EnhancedDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await adminApi.getEnhancedStats();
        setStats(data);
      } catch {
        // Will show placeholder
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
        Failed to load dashboard data.
      </div>
    );
  }

  const totalProjects = stats.projects.total || 1;
  const dist = stats.projectStatusDistribution;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6" />
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground">
          Complete platform overview and monitoring.
        </p>
      </div>

      {/* Key Metrics - 6 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.users.clients} clients, {stats.users.freelancers}{" "}
              freelancers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Projects
            </CardTitle>
            <Briefcase className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projects.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.projects.active} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Open Disputes
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.disputes.open}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Requires attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Platform Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatRupiah(stats.revenue.platformRevenue)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">From 15% fees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Escrow Held
            </CardTitle>
            <DollarSign className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatRupiah(stats.revenue.escrowHeld)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalEscrows} total escrows
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Flagged Messages
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.flaggedMessages}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Contact info detected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Row */}
      {(stats.disputes.open > 0 ||
        stats.flaggedMessages > 0 ||
        stats.pendingPayouts > 0) && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {stats.disputes.open > 0 && (
            <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium">
                    {stats.disputes.open} open dispute
                    {stats.disputes.open !== 1 ? "s" : ""}
                  </span>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/disputes">
                    Review <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
          {stats.flaggedMessages > 0 && (
            <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950/30">
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">
                    {stats.flaggedMessages} flagged message
                    {stats.flaggedMessages !== 1 ? "s" : ""}
                  </span>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/chat-audit">
                    Review <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
          {stats.pendingPayouts > 0 && (
            <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/30">
              <CardContent className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium">
                    {stats.pendingPayouts} pending payout
                    {stats.pendingPayouts !== 1 ? "s" : ""}
                  </span>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/admin/transactions">
                    View <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Project Status Distribution + User Summary */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Project Status Distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Project Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                label: "Draft",
                value: dist.draft,
                color: "bg-gray-400",
              },
              {
                label: "Open",
                value: dist.open,
                color: "bg-green-500",
              },
              {
                label: "In Progress",
                value: dist.inProgress,
                color: "bg-blue-500",
              },
              {
                label: "Delivered",
                value: dist.delivered,
                color: "bg-purple-500",
              },
              {
                label: "Completed",
                value: dist.completed,
                color: "bg-emerald-500",
              },
              {
                label: "Disputed",
                value: dist.disputed,
                color: "bg-red-500",
              },
              {
                label: "Cancelled",
                value: dist.cancelled,
                color: "bg-gray-300",
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-20 shrink-0">
                  {item.label}
                </span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{
                      width: `${totalProjects > 0 ? (item.value / totalProjects) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="text-xs font-medium w-8 text-right">
                  {item.value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* User & Platform Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Platform Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <UserPlus className="h-3.5 w-3.5" />
                  New Users (7d)
                </div>
                <p className="text-xl font-bold">{stats.recentUsersCount}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Completed
                </div>
                <p className="text-xl font-bold">{stats.projects.completed}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <CreditCard className="h-3.5 w-3.5" />
                  Total Payouts
                </div>
                <p className="text-xl font-bold">{stats.totalPayouts}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <FolderOpen className="h-3.5 w-3.5" />
                  Open Projects
                </div>
                <p className="text-xl font-bold">{stats.projects.open}</p>
              </div>
            </div>

            <Separator />

            {/* User composition */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                User Composition
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="flex h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500"
                      style={{
                        width: `${stats.users.total > 0 ? (stats.users.clients / stats.users.total) * 100 : 0}%`,
                      }}
                    />
                    <div
                      className="bg-green-500"
                      style={{
                        width: `${stats.users.total > 0 ? (stats.users.freelancers / stats.users.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Clients ({stats.users.clients})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Freelancers ({stats.users.freelancers})
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity - 2x2 Grid */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Recent Projects */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Recent Projects
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/projects">
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stats.recentProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No projects yet.
              </p>
            ) : (
              <div className="space-y-2">
                {stats.recentProjects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.id}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{p.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {getDisplayName(p.client)} &middot; {p.category.name}
                      </p>
                    </div>
                    <Badge
                      className={`text-xs shrink-0 ml-2 ${STATUS_COLORS[p.status] || ""}`}>
                      {p.status.replace("_", " ")}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Disputes */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Recent Disputes
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/disputes">
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stats.recentDisputes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No disputes yet.
              </p>
            ) : (
              <div className="space-y-2">
                {stats.recentDisputes.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{d.reason}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.project.title} &middot; by{" "}
                        {getDisplayName(d.initiator)}
                      </p>
                    </div>
                    <Badge
                      className={`text-xs shrink-0 ml-2 ${DISPUTE_STATUS_COLORS[d.status] || ""}`}>
                      {d.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Escrows */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Recent Transactions
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/transactions">
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stats.recentEscrows.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No transactions yet.
              </p>
            ) : (
              <div className="space-y-2">
                {stats.recentEscrows.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {e.project.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatRupiah(e.totalAmount)} &middot; Fee{" "}
                        {formatRupiah(e.platformFee)}
                      </p>
                    </div>
                    <Badge
                      className={`text-xs shrink-0 ml-2 ${ESCROW_STATUS_COLORS[e.status] || ""}`}>
                      {e.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Admin Actions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Recent Admin Actions
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/activity-log">
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stats.recentAdminActions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No admin actions yet.
              </p>
            ) : (
              <div className="space-y-2">
                {stats.recentAdminActions.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`text-xs ${ACTION_COLORS[a.actionType] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}`}>
                          {a.actionType.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        by {a.admin.email} &middot;{" "}
                        {new Date(a.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            {
              href: "/admin/projects",
              icon: Briefcase,
              label: "Projects",
              color: "text-indigo-500",
            },
            {
              href: "/admin/transactions",
              icon: CreditCard,
              label: "Transactions",
              color: "text-green-500",
            },
            {
              href: "/admin/disputes",
              icon: AlertTriangle,
              label: "Disputes",
              color: "text-red-500",
              badge: stats.disputes.open > 0 ? stats.disputes.open : undefined,
            },
            {
              href: "/admin/users",
              icon: Users,
              label: "Users",
              color: "text-blue-500",
            },
            {
              href: "/admin/chat-audit",
              icon: MessageSquare,
              label: "Chat Audit",
              color: "text-orange-500",
            },
            {
              href: "/admin/activity-log",
              icon: ClipboardList,
              label: "Activity Log",
              color: "text-purple-500",
            },
          ].map((item) => (
            <Link key={item.href} href={item.href}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="flex flex-col items-center text-center py-4">
                  <item.icon className={`h-6 w-6 ${item.color} mb-1.5`} />
                  <h3 className="font-medium text-xs">{item.label}</h3>
                  {"badge" in item && item.badge && (
                    <Badge variant="destructive" className="mt-1.5 text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
