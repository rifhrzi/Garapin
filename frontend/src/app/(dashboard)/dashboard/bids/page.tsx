"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ProjectStatusBadge } from "@/components/project/project-status-badge";
import { bidApi } from "@/lib/api";
import { formatRupiah } from "@/types/project";
import type { Bid, BidStatus } from "@/types";
import { toast } from "sonner";
import {
  Calendar,
  ExternalLink,
  Gavel,
  Loader2,
  Search,
  Tag,
  X,
} from "lucide-react";

const BID_STATUS_TABS: Array<{ value: string; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "REJECTED", label: "Rejected" },
  { value: "WITHDRAWN", label: "Withdrawn" },
];

const bidStatusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  ACCEPTED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  WITHDRAWN: "bg-gray-100 text-gray-500",
};

interface BidWithProject extends Bid {
  project?: {
    id: string;
    title: string;
    status: string;
    budgetMin: number;
    budgetMax: number;
    deadline: string;
    category?: { name: string } | null;
    client?: {
      id: string;
      clientProfile?: { displayName: string } | null;
    } | null;
  };
}

export default function MyBidsPage() {
  const [bids, setBids] = useState<BidWithProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const fetchBids = useCallback(async () => {
    setIsLoading(true);
    try {
      const status = activeTab === "ALL" ? undefined : activeTab;
      const data = await bidApi.getMyBids(status);
      setBids(data as BidWithProject[]);
    } catch {
      setBids([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchBids();
  }, [fetchBids]);

  async function handleWithdraw(bidId: string) {
    setWithdrawingId(bidId);
    try {
      await bidApi.withdraw(bidId);
      toast.success("Bid withdrawn successfully");
      fetchBids();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to withdraw bid");
    } finally {
      setWithdrawingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Bids</h1>
        <p className="text-muted-foreground">
          Track your submitted proposals and their status.
        </p>
      </div>

      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto">
          {BID_STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Bids List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : bids.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Gavel className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-1">
              {activeTab === "ALL"
                ? "No bids yet"
                : `No ${activeTab.toLowerCase()} bids`}
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Browse open projects and submit proposals to start earning.
            </p>
            <Button asChild>
              <Link href="/projects">
                <Search className="h-4 w-4 mr-2" />
                Browse Projects
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bids.map((bid) => (
            <Card key={bid.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {bid.project ? (
                      <Link
                        href={`/projects/${bid.project.id}`}
                        className="font-semibold hover:underline line-clamp-1">
                        {bid.project.title}
                      </Link>
                    ) : (
                      <p className="font-semibold text-muted-foreground">
                        Project unavailable
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {bid.project?.category && (
                        <Badge variant="secondary" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {bid.project.category.name}
                        </Badge>
                      )}
                      {bid.project?.status && (
                        <ProjectStatusBadge
                          status={bid.project.status as any}
                        />
                      )}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`border-0 shrink-0 ${bidStatusColors[bid.status]}`}>
                    {bid.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Your Bid</p>
                    <p className="font-semibold text-primary">
                      {formatRupiah(bid.amount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Estimated</p>
                    <p className="font-medium flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {bid.estimatedDays} day
                      {bid.estimatedDays !== 1 ? "s" : ""}
                    </p>
                  </div>
                  {bid.project && (
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Budget Range
                      </p>
                      <p className="font-medium">
                        {formatRupiah(bid.project.budgetMin)} -{" "}
                        {formatRupiah(bid.project.budgetMax)}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">Submitted</p>
                    <p className="font-medium">
                      {new Date(bid.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                  {bid.proposal}
                </p>
              </CardContent>
              <CardFooter className="pt-0 gap-2">
                {bid.project && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/projects/${bid.project.id}`}>
                      <ExternalLink className="h-3.5 w-3.5 mr-1" />
                      View Project
                    </Link>
                  </Button>
                )}
                {bid.status === "PENDING" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleWithdraw(bid.id)}
                    disabled={withdrawingId === bid.id}>
                    {withdrawingId === bid.id ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                    ) : (
                      <X className="h-3.5 w-3.5 mr-1" />
                    )}
                    Withdraw
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
