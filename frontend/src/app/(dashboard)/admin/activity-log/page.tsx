"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminApi } from "@/lib/api";
import type { AdminActionLog } from "@/types";
import {
  ClipboardList,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Ban,
  CheckCircle2,
  Scale,
  Award,
  Shield,
  User,
  Calendar,
} from "lucide-react";

const ACTION_COLORS: Record<string, string> = {
  SUSPEND_USER: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  UNSUSPEND_USER:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  DISPUTE_RESOLVE:
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  TIER_ADJUST:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
};

const ACTION_ICONS: Record<string, typeof Ban> = {
  SUSPEND_USER: Ban,
  UNSUSPEND_USER: CheckCircle2,
  DISPUTE_RESOLVE: Scale,
  TIER_ADJUST: Award,
};

const ACTION_LABELS: Record<string, string> = {
  SUSPEND_USER: "User Suspended",
  UNSUSPEND_USER: "User Unsuspended",
  DISPUTE_RESOLVE: "Dispute Resolved",
  TIER_ADJUST: "Tier Adjusted",
};

function formatActionDetails(action: AdminActionLog): string {
  if (!action.details) return "";
  const details = action.details;

  if (action.actionType === "SUSPEND_USER" && details.reason) {
    return `Reason: ${details.reason}`;
  }
  if (action.actionType === "TIER_ADJUST") {
    const parts: string[] = [];
    if (details.oldTier) parts.push(`${details.oldTier}`);
    if (details.newTier) parts.push(`${details.newTier}`);
    if (parts.length === 2) return `${parts[0]} → ${parts[1]}`;
    if (details.tier) return `Set to ${details.tier}`;
  }
  if (action.actionType === "DISPUTE_RESOLVE") {
    const parts: string[] = [];
    if (details.outcome) parts.push(`Outcome: ${details.outcome.replace(/_/g, " ")}`);
    if (details.resolution) parts.push(details.resolution);
    return parts.join(" - ");
  }

  return JSON.stringify(details);
}

export default function AdminActivityLogPage() {
  const [actions, setActions] = useState<AdminActionLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 30;

  const fetchActions = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await adminApi.getActivityLog({ page, limit });
      setActions(result.data);
      setTotal(result.pagination.total);
    } catch {
      // error handled silently
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="h-6 w-6" />
          Admin Activity Log
        </h1>
        <p className="text-muted-foreground">
          Chronological record of all admin actions. ({total} total)
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : actions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No admin actions recorded yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

            {actions.map((action) => {
              const IconComponent =
                ACTION_ICONS[action.actionType] || Shield;
              const details = formatActionDetails(action);

              return (
                <div key={action.id} className="relative pl-10 pb-4">
                  {/* Timeline dot */}
                  <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full border-2 border-background bg-muted-foreground/30" />

                  <Card>
                    <CardContent className="py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <Badge
                              className={`text-xs flex items-center gap-1 ${ACTION_COLORS[action.actionType] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"}`}>
                              <IconComponent className="h-3 w-3" />
                              {ACTION_LABELS[action.actionType] ||
                                action.actionType.replace(/_/g, " ")}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {action.targetType}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {action.admin.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(action.createdAt).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                          </div>

                          {details && (
                            <p className="text-xs text-muted-foreground mt-1.5 p-2 bg-muted/50 rounded">
                              {details}
                            </p>
                          )}

                          <p className="text-xs text-muted-foreground mt-1">
                            Target ID:{" "}
                            <code className="bg-muted px-1 rounded text-xs">
                              {action.targetId.slice(0, 8)}...
                            </code>
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages} ({total} actions)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
