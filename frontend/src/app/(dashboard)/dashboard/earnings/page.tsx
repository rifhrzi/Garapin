"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { escrowApi } from "@/lib/api";
import { formatRupiah } from "@/types/project";
import type { EarningsData, PayoutStatus } from "@/types/project";
import {
  DollarSign,
  TrendingUp,
  Clock,
  CreditCard,
  Loader2,
  ExternalLink,
  ArrowUpRight,
  Lock,
} from "lucide-react";

function getPayoutStatusBadge(status: PayoutStatus) {
  const variants: Record<
    PayoutStatus,
    {
      variant: "default" | "secondary" | "outline" | "destructive";
      label: string;
    }
  > = {
    PENDING: { variant: "outline", label: "Pending" },
    PROCESSING: { variant: "secondary", label: "Processing" },
    COMPLETED: { variant: "default", label: "Completed" },
    FAILED: { variant: "destructive", label: "Failed" },
  };
  const config = variants[status] || variants.PENDING;
  return (
    <Badge variant={config.variant} className="text-xs">
      {config.label}
    </Badge>
  );
}

export default function EarningsPage() {
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await escrowApi.getEarnings();
        setEarnings(data);
      } catch {
        // silently fail
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Earnings</h1>
          <p className="text-muted-foreground">
            Track your income and payout history.
          </p>
        </div>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  const summary = earnings?.summary || {
    totalEarned: 0,
    inEscrow: 0,
    available: 0,
    thisMonth: 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Earnings</h1>
        <p className="text-muted-foreground">
          Track your income and payout history.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Earned
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatRupiah(summary.totalEarned)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Escrow
            </CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatRupiah(summary.inEscrow)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatRupiah(summary.available)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatRupiah(summary.thisMonth)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Escrows */}
      {earnings &&
        earnings.escrows.filter((e) => e.status === "FUNDED").length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Active Escrows
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {earnings.escrows
                  .filter((e) => e.status === "FUNDED")
                  .map((escrow) => (
                    <div
                      key={escrow.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/projects/${escrow.projectId}`}
                          className="text-sm font-medium hover:underline truncate block">
                          {escrow.projectTitle}
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Funded{" "}
                          {escrow.fundedAt
                            ? new Date(escrow.fundedAt).toLocaleDateString(
                                "id-ID",
                              )
                            : "N/A"}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-sm font-semibold text-green-600">
                          {formatRupiah(escrow.freelancerAmount)}
                        </p>
                        <Badge variant="secondary" className="text-xs mt-0.5">
                          <Lock className="h-2.5 w-2.5 mr-0.5" />
                          In Escrow
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Payout History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5" />
            Payout History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!earnings || earnings.payouts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-1">No payouts yet</h3>
              <p className="text-sm text-muted-foreground text-center">
                Complete projects to start earning. Funds are released after
                client approval.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {earnings.payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/projects/${payout.projectId}`}
                      className="text-sm font-medium hover:underline truncate block">
                      {payout.projectTitle}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {new Date(payout.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                      {payout.bankCode && ` \u2022 ${payout.bankCode}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="text-sm font-semibold">
                      {formatRupiah(payout.amount)}
                    </p>
                    <div className="mt-0.5">
                      {getPayoutStatusBadge(payout.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
