"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { adminApi } from "@/lib/api";
import type { Dispute, DisputeOutcome } from "@/types";
import { toast } from "sonner";
import {
  AlertTriangle,
  Loader2,
  CheckCircle2,
  User,
  Briefcase,
  Scale,
} from "lucide-react";
import { AxiosError } from "axios";

function getDisputeStatusColor(status: string) {
  const map: Record<string, string> = {
    OPEN: "bg-red-100 text-red-800",
    UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
    RESOLVED: "bg-green-100 text-green-800",
    CLOSED: "bg-gray-100 text-gray-600",
  };
  return map[status] || "bg-gray-100 text-gray-600";
}

function getInitiatorName(dispute: Dispute): string {
  if (!dispute.initiator) return "Unknown";
  return (
    dispute.initiator.freelancerProfile?.displayName ||
    dispute.initiator.clientProfile?.displayName ||
    dispute.initiator.email
  );
}

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [total, setTotal] = useState(0);

  // Resolve dialog state
  const [resolveTarget, setResolveTarget] = useState<Dispute | null>(null);
  const [resolution, setResolution] = useState("");
  const [outcome, setOutcome] = useState<DisputeOutcome | "">("");
  const [isResolving, setIsResolving] = useState(false);

  const fetchDisputes = useCallback(async () => {
    setIsLoading(true);
    try {
      const statusFilter = activeTab === "all" ? undefined : activeTab;
      const result = await adminApi.getDisputes({
        status: statusFilter,
        limit: 50,
      });
      setDisputes(result.data);
      setTotal(result.pagination.total);
    } catch {
      toast.error("Failed to load disputes");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  async function handleResolve() {
    if (!resolveTarget || !resolution.trim() || !outcome) return;
    setIsResolving(true);
    try {
      await adminApi.resolveDispute(resolveTarget.id, {
        resolution: resolution.trim(),
        outcome: outcome as DisputeOutcome,
      });
      toast.success("Dispute resolved successfully");
      setResolveTarget(null);
      setResolution("");
      setOutcome("");
      fetchDisputes();
    } catch (error) {
      const message = error instanceof AxiosError ? error.response?.data?.message : undefined;
      toast.error(message || "Failed to resolve dispute");
    } finally {
      setIsResolving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <AlertTriangle className="h-6 w-6" />
          Dispute Management
        </h1>
        <p className="text-muted-foreground">
          Review and resolve platform disputes. ({total} total)
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="OPEN">Open</TabsTrigger>
          <TabsTrigger value="UNDER_REVIEW">Under Review</TabsTrigger>
          <TabsTrigger value="RESOLVED">Resolved</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : disputes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No disputes found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {disputes.map((dispute) => (
                <Card key={dispute.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge
                            className={getDisputeStatusColor(dispute.status)}>
                            {dispute.status.replace("_", " ")}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(dispute.createdAt).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                        <h3 className="font-semibold text-sm">
                          {dispute.reason}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {dispute.description}
                        </p>

                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Briefcase className="h-3.5 w-3.5" />
                            {dispute.project?.title || "Unknown project"}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            Filed by: {getInitiatorName(dispute)}
                          </span>
                        </div>

                        {dispute.status === "RESOLVED" &&
                          dispute.resolution && (
                            <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/30 rounded text-xs">
                              <span className="font-medium">Resolution:</span>{" "}
                              {dispute.resolution}
                              {dispute.outcome && (
                                <Badge
                                  variant="outline"
                                  className="ml-2 text-xs">
                                  {dispute.outcome.replace("_", " ")}
                                </Badge>
                              )}
                            </div>
                          )}
                      </div>

                      {["OPEN", "UNDER_REVIEW"].includes(dispute.status) && (
                        <Button
                          size="sm"
                          onClick={() => setResolveTarget(dispute)}>
                          <Scale className="h-3.5 w-3.5 mr-1" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Resolve Dialog */}
      <Dialog
        open={!!resolveTarget}
        onOpenChange={(open) => {
          if (!open) {
            setResolveTarget(null);
            setResolution("");
            setOutcome("");
          }
        }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Resolve Dispute
            </DialogTitle>
          </DialogHeader>

          {resolveTarget && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg text-sm">
                <p className="font-medium">{resolveTarget.reason}</p>
                <p className="text-muted-foreground mt-1">
                  {resolveTarget.description}
                </p>
                <Separator className="my-2" />
                <p className="text-xs text-muted-foreground">
                  Project: {resolveTarget.project?.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  Filed by: {getInitiatorName(resolveTarget)}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Outcome</Label>
                <Select
                  value={outcome}
                  onValueChange={(val) => setOutcome(val as DisputeOutcome)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select outcome..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FULL_REFUND">
                      Full Refund to Client
                    </SelectItem>
                    <SelectItem value="PARTIAL_REFUND">
                      Partial Refund
                    </SelectItem>
                    <SelectItem value="NO_REFUND">
                      No Refund (Freelancer Keeps)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Resolution Details</Label>
                <Textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Explain the resolution decision..."
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setResolveTarget(null);
                setResolution("");
                setOutcome("");
              }}>
              Cancel
            </Button>
            <Button
              onClick={handleResolve}
              disabled={isResolving || !resolution.trim() || !outcome}>
              {isResolving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Confirm Resolution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
