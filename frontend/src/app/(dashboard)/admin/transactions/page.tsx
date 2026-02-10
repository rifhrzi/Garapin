"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminApi } from "@/lib/api";
import { formatRupiah } from "@/types/project";
import type { AdminEscrow, AdminPayout } from "@/types";
import {
  CreditCard,
  Loader2,
  DollarSign,
  User,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Banknote,
  ArrowRightLeft,
  Calendar,
} from "lucide-react";

const ESCROW_COLORS: Record<string, string> = {
  PENDING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  FUNDED: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  RELEASED:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  REFUNDED:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  DISPUTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const PAYOUT_COLORS: Record<string, string> = {
  PENDING:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  PROCESSING:
    "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  COMPLETED:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  FAILED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export default function AdminTransactionsPage() {
  const [activeTab, setActiveTab] = useState("escrows");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="h-6 w-6" />
          Transactions Monitoring
        </h1>
        <p className="text-muted-foreground">
          Track escrow payments and freelancer payouts.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="escrows" className="flex items-center gap-1.5">
            <ArrowRightLeft className="h-3.5 w-3.5" />
            Escrows
          </TabsTrigger>
          <TabsTrigger value="payouts" className="flex items-center gap-1.5">
            <Banknote className="h-3.5 w-3.5" />
            Payouts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="escrows" className="mt-4">
          <EscrowsTab />
        </TabsContent>
        <TabsContent value="payouts" className="mt-4">
          <PayoutsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EscrowsTab() {
  const [escrows, setEscrows] = useState<AdminEscrow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const limit = 20;

  const fetchEscrows = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit };
      if (statusFilter !== "all") params.status = statusFilter;
      const result = await adminApi.listEscrows(params);
      setEscrows(result.data);
      setTotal(result.pagination.total);
    } catch {
      // error handled silently
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchEscrows();
  }, [fetchEscrows]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="FUNDED">Funded</SelectItem>
            <SelectItem value="RELEASED">Released</SelectItem>
            <SelectItem value="REFUNDED">Refunded</SelectItem>
            <SelectItem value="DISPUTED">Disputed</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{total} escrows</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : escrows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <CreditCard className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No escrows found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {escrows.map((escrow) => (
            <Card key={escrow.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge
                        className={`text-xs ${ESCROW_COLORS[escrow.status] || ""}`}>
                        {escrow.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(escrow.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <h3 className="font-semibold text-sm">
                      {escrow.project.title}
                    </h3>

                    <div className="flex items-center gap-4 mt-2 flex-wrap text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Client:{" "}
                        {escrow.client.clientProfile?.displayName ||
                          escrow.client.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Freelancer:{" "}
                        {escrow.freelancer.freelancerProfile?.displayName ||
                          escrow.freelancer.email}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-2 flex-wrap text-xs">
                      <span className="flex items-center gap-1 font-medium">
                        <DollarSign className="h-3 w-3" />
                        Total: {formatRupiah(escrow.totalAmount)}
                      </span>
                      <span className="text-muted-foreground">
                        Fee: {formatRupiah(escrow.platformFee)}
                      </span>
                      <span className="text-muted-foreground">
                        Freelancer: {formatRupiah(escrow.freelancerAmount)}
                      </span>
                      {escrow.fundedAt && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Funded:{" "}
                          {new Date(escrow.fundedAt).toLocaleDateString(
                            "id-ID",
                          )}
                        </span>
                      )}
                      {escrow.releasedAt && (
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Released:{" "}
                          {new Date(escrow.releasedAt).toLocaleDateString(
                            "id-ID",
                          )}
                        </span>
                      )}
                    </div>

                    {escrow.midtransOrderId && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Midtrans Order: {escrow.midtransOrderId}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
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

function PayoutsTab() {
  const [payouts, setPayouts] = useState<AdminPayout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const limit = 20;

  const fetchPayouts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = { page, limit };
      if (statusFilter !== "all") params.status = statusFilter;
      const result = await adminApi.listPayouts(params);
      setPayouts(result.data);
      setTotal(result.pagination.total);
    } catch {
      // error handled silently
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="PROCESSING">Processing</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{total} payouts</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : payouts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Banknote className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>No payouts found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {payouts.map((payout) => (
            <Card key={payout.id}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <Badge
                        className={`text-xs ${PAYOUT_COLORS[payout.status] || ""}`}>
                        {payout.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(payout.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <h3 className="font-semibold text-sm">
                      {payout.escrow.project.title}
                    </h3>

                    <div className="flex items-center gap-4 mt-2 flex-wrap text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        Freelancer:{" "}
                        {payout.freelancer.freelancerProfile?.displayName ||
                          payout.freelancer.email}
                      </span>
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <DollarSign className="h-3 w-3" />
                        {formatRupiah(payout.amount)}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 mt-1.5 flex-wrap text-xs text-muted-foreground">
                      {payout.bankCode && (
                        <span>Bank: {payout.bankCode}</span>
                      )}
                      {payout.accountNumber && (
                        <span>Acc: ****{payout.accountNumber.slice(-4)}</span>
                      )}
                      {payout.accountHolderName && (
                        <span>Holder: {payout.accountHolderName}</span>
                      )}
                      {payout.midtransPayoutId && (
                        <span>Midtrans: {payout.midtransPayoutId}</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
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
