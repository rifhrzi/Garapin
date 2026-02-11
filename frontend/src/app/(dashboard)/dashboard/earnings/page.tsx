"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { escrowApi, userApi, payoutApi } from "@/lib/api";
import { formatRupiah } from "@/types/project";
import type {
  EarningsData,
  PayoutStatus,
  BankDetails,
} from "@/types/project";
import { toast } from "sonner";
import {
  DollarSign,
  TrendingUp,
  Clock,
  Loader2,
  ArrowUpRight,
  Lock,
  Building2,
  Pencil,
  Send,
  Wallet,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Ban,
} from "lucide-react";
import { AxiosError } from "axios";

// ─── Status badge helper ─────────────────────────────────
function getPayoutStatusBadge(status: PayoutStatus) {
  const variants: Record<
    PayoutStatus,
    {
      variant: "default" | "secondary" | "outline" | "destructive";
      label: string;
      icon: React.ReactNode;
    }
  > = {
    PENDING: {
      variant: "outline",
      label: "Pending",
      icon: <Clock className="h-3 w-3" />,
    },
    PROCESSING: {
      variant: "secondary",
      label: "Processing",
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
    },
    COMPLETED: {
      variant: "default",
      label: "Completed",
      icon: <CheckCircle2 className="h-3 w-3" />,
    },
    FAILED: {
      variant: "destructive",
      label: "Failed",
      icon: <XCircle className="h-3 w-3" />,
    },
  };
  const config = variants[status] || variants.PENDING;
  return (
    <Badge variant={config.variant} className="text-xs flex items-center gap-1 w-fit">
      {config.icon}
      {config.label}
    </Badge>
  );
}

// ─── Bank Account Card ───────────────────────────────────
function BankAccountCard({
  bankDetails,
  onSaved,
}: {
  bankDetails: BankDetails | null;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    bankCode: "",
    bankName: "",
    accountNumber: "",
    accountHolderName: "",
  });

  useEffect(() => {
    if (bankDetails && open) {
      setForm({
        bankCode: bankDetails.bankCode || "",
        bankName: bankDetails.bankName || "",
        accountNumber: bankDetails.accountNumber || "",
        accountHolderName: bankDetails.accountHolderName || "",
      });
    }
  }, [bankDetails, open]);

  const hasBankDetails =
    bankDetails?.bankCode && bankDetails?.accountNumber && bankDetails?.accountHolderName;

  async function handleSave() {
    if (!form.bankCode || !form.bankName || !form.accountNumber || !form.accountHolderName) {
      toast.error("Please fill in all bank details");
      return;
    }
    setSaving(true);
    try {
      await userApi.updateBankDetails(form);
      toast.success("Bank details saved");
      setOpen(false);
      onSaved();
    } catch {
      toast.error("Failed to save bank details");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Bank Account
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              {hasBankDetails ? "Edit" : "Set Up"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Bank Account Details</DialogTitle>
              <DialogDescription>
                Enter your bank details for receiving payouts. This info will be
                used when you request a withdrawal.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bankCode">Bank Code</Label>
                  <Input
                    id="bankCode"
                    placeholder="e.g. BCA, BNI, BRI"
                    value={form.bankCode}
                    onChange={(e) =>
                      setForm({ ...form, bankCode: e.target.value.toUpperCase() })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    placeholder="e.g. Bank Central Asia"
                    value={form.bankName}
                    onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input
                  id="accountNumber"
                  placeholder="e.g. 1234567890"
                  value={form.accountNumber}
                  onChange={(e) =>
                    setForm({ ...form, accountNumber: e.target.value.replace(/\D/g, "") })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accountHolderName">Account Holder Name</Label>
                <Input
                  id="accountHolderName"
                  placeholder="Name as on bank account"
                  value={form.accountHolderName}
                  onChange={(e) =>
                    setForm({ ...form, accountHolderName: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {hasBankDetails ? (
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2 min-w-0">
              <Badge variant="secondary">{bankDetails!.bankCode}</Badge>
              <span className="text-muted-foreground truncate">
                {bankDetails!.bankName}
              </span>
            </div>
            <Separator orientation="vertical" className="h-4" />
            <span className="font-mono">
              ****{bankDetails!.accountNumber!.slice(-4)}
            </span>
            <Separator orientation="vertical" className="h-4" />
            <span className="truncate">{bankDetails!.accountHolderName}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0" />
            No bank account set up. Please add your bank details to request
            payouts.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Payout Request Dialog ───────────────────────────────
function RequestPayoutDialog({
  available,
  hasBankDetails,
  onSuccess,
}: {
  available: number;
  hasBankDetails: boolean;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleOpen(isOpen: boolean) {
    setOpen(isOpen);
    if (isOpen) setAmount("");
  }

  async function handleSubmit() {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (numAmount > available) {
      toast.error("Amount exceeds available balance");
      return;
    }

    setSubmitting(true);
    try {
      await payoutApi.requestPayout(numAmount);
      toast.success("Payout requested successfully");
      setOpen(false);
      onSuccess();
    } catch (err) {
      const msg = err instanceof AxiosError ? err.response?.data?.message : undefined;
      toast.error(msg || "Failed to request payout");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button disabled={!hasBankDetails || available <= 0} className="gap-2">
          <Send className="h-4 w-4" />
          Request Payout
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Payout</DialogTitle>
          <DialogDescription>
            Withdraw funds from your available balance. The admin will process
            your request via bank transfer.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="p-3 bg-muted rounded-lg flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Available Balance
            </span>
            <span className="font-semibold text-green-600">
              {formatRupiah(available)}
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payoutAmount">Amount (IDR)</Label>
            <Input
              id="payoutAmount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={1}
              max={available}
            />
            <Button
              variant="link"
              className="p-0 h-auto text-xs"
              onClick={() => setAmount(String(available))}
            >
              Withdraw all ({formatRupiah(available)})
            </Button>
          </div>

          {Number(amount) > 0 && (
            <div className="p-3 border rounded-lg text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">You will receive</span>
                <span className="font-semibold">
                  {formatRupiah(Number(amount))}
                </span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Confirm Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ───────────────────────────────────────────
export default function EarningsPage() {
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [earningsData, bankData] = await Promise.all([
        escrowApi.getEarnings(),
        userApi.getBankDetails().catch(() => null),
      ]);
      setEarnings(earningsData);
      setBankDetails(bankData);
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCancelPayout(payoutId: string) {
    setCancellingId(payoutId);
    try {
      await payoutApi.cancelPayout(payoutId);
      toast.success("Payout cancelled");
      loadData();
    } catch {
      toast.error("Failed to cancel payout");
    } finally {
      setCancellingId(null);
    }
  }

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
    pendingPayout: 0,
  };

  const hasBankDetails = !!(
    bankDetails?.bankCode &&
    bankDetails?.accountNumber &&
    bankDetails?.accountHolderName
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Earnings</h1>
          <p className="text-muted-foreground">
            Track your income and request payouts.
          </p>
        </div>
        <RequestPayoutDialog
          available={summary.available}
          hasBankDetails={hasBankDetails}
          onSuccess={loadData}
        />
      </div>

      {/* Bank Account */}
      <BankAccountCard bankDetails={bankDetails} onSaved={loadData} />

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
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
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
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/projects/${escrow.projectId}`}
                          className="text-sm font-medium hover:underline truncate block"
                        >
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
                Complete projects and request payouts to withdraw your earnings.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {earnings.payouts.map((payout) => (
                <div
                  key={payout.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">
                        {formatRupiah(payout.amount)}
                      </span>
                      {getPayoutStatusBadge(payout.status)}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span>
                        {new Date(payout.createdAt).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      </span>
                      {payout.bankCode && (
                        <>
                          <span>&bull;</span>
                          <span>
                            {payout.bankCode} ****
                            {payout.accountNumber?.slice(-4)}
                          </span>
                        </>
                      )}
                      {payout.completedAt && (
                        <>
                          <span>&bull;</span>
                          <span>
                            Completed{" "}
                            {new Date(payout.completedAt).toLocaleDateString(
                              "id-ID",
                            )}
                          </span>
                        </>
                      )}
                    </div>
                    {payout.failedReason && (
                      <p className="text-xs text-destructive mt-1">
                        Reason: {payout.failedReason}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 ml-4">
                    {payout.status === "PENDING" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleCancelPayout(payout.id)}
                        disabled={cancellingId === payout.id}
                      >
                        {cancellingId === payout.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Ban className="h-3.5 w-3.5 mr-1" />
                            Cancel
                          </>
                        )}
                      </Button>
                    )}
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
