"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ProjectStatusBadge } from "@/components/project/project-status-badge";
import { BidCard } from "@/components/project/bid-card";
import { BidForm } from "@/components/project/bid-form";
import { DisputeDialog } from "@/components/project/dispute-dialog";
import { DeliveryDialog } from "@/components/project/delivery-dialog";
import { DeliverySection } from "@/components/project/delivery-section";
import { ReviewSection } from "@/components/project/review-section";
import { projectApi, bidApi, escrowApi } from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth-store";
import { formatRupiah, getStatusLabel, type ProjectStatus } from "@/types/project";
import { getTierColor } from "@/types/user";
import type { ProjectDetail, Bid, FreelancerTier, Escrow } from "@/types";
import { toast } from "sonner";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  Gavel,
  Loader2,
  Lock,
  MessageSquare,
  Milestone,
  Package,
  Shield,
  Star,
  Tag,
  Truck,
  User,
  Wallet,
  XCircle,
} from "lucide-react";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [escrow, setEscrow] = useState<Escrow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const [isBidActionLoading, setIsBidActionLoading] = useState(false);
  const [isEscrowLoading, setIsEscrowLoading] = useState(false);
  const [deliveries, setDeliveries] = useState<
    Array<{
      id: string;
      description: string;
      link?: string | null;
      fileUrl?: string | null;
      report?: string | null;
      createdAt: string;
    }>
  >([]);

  const isClient = user?.role === "CLIENT";
  const isFreelancer = user?.role === "FREELANCER";
  const isProjectOwner = isClient && project?.clientId === user?.id;
  const isAssignedFreelancer =
    isFreelancer && project?.selectedFreelancerId === user?.id;

  const fetchProject = useCallback(async () => {
    try {
      const data = await projectApi.getById(projectId);
      setProject(data);
    } catch {
      toast.error("Project not found");
      router.push("/projects");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, router]);

  const fetchBids = useCallback(async () => {
    if (!isProjectOwner) return;
    try {
      const data = await bidApi.getProjectBids(projectId);
      setBids(data);
    } catch {
      // Silently fail — may not have permission
    }
  }, [projectId, isProjectOwner]);

  const fetchEscrow = useCallback(async () => {
    try {
      const data = await escrowApi.getByProjectId(projectId);
      setEscrow(data);
    } catch {
      // No escrow yet — that's fine
    }
  }, [projectId]);

  const fetchDeliveries = useCallback(async () => {
    try {
      const data = await projectApi.getDeliveries(projectId);
      setDeliveries(data);
    } catch {
      // No deliveries yet
    }
  }, [projectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  useEffect(() => {
    if (project && isProjectOwner) {
      fetchBids();
    }
  }, [project, isProjectOwner, fetchBids]);

  useEffect(() => {
    if (project && (isProjectOwner || isAssignedFreelancer)) {
      fetchEscrow();
      fetchDeliveries();
    }
  }, [
    project,
    isProjectOwner,
    isAssignedFreelancer,
    fetchEscrow,
    fetchDeliveries,
  ]);

  // Auto-check payment status when escrow is PENDING (webhook fallback)
  useEffect(() => {
    if (!escrow || escrow.status !== "PENDING") return;

    const checkStatus = async () => {
      try {
        const result = await escrowApi.checkPaymentStatus(escrow.id);
        if (result.updated) {
          toast.success("Payment confirmed! Chat is now fully unlocked.");
          fetchEscrow();
          fetchProject();
        }
      } catch {
        // Silently fail — will retry on next interval
      }
    };

    // Check immediately, then poll every 10 seconds
    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [escrow?.id, escrow?.status, fetchEscrow, fetchProject]);

  async function handleStatusUpdate(status: ProjectStatus) {
    if (!project) return;
    setIsStatusLoading(true);
    try {
      await projectApi.updateStatus(project.id, status);
      toast.success(`Project ${getStatusLabel(status).toLowerCase()}`);
      fetchProject();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to update status";
      const axiosMsg = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(axiosMsg || message);
    } finally {
      setIsStatusLoading(false);
    }
  }

  function openSnapPayment(token: string) {
    if (!(window as unknown as { snap?: { pay: (token: string, options: Record<string, unknown>) => void } }).snap) {
      toast.error("Payment system is loading, please try again in a moment.");
      return;
    }
    (window as unknown as { snap: { pay: (token: string, options: Record<string, unknown>) => void } }).snap.pay(token, {
      onSuccess: () => {
        toast.success("Payment successful!");
        fetchEscrow();
        fetchProject();
      },
      onPending: () => {
        toast.info("Payment is pending. We'll update once confirmed.");
      },
      onError: () => {
        toast.error("Payment failed. Please try again.");
      },
      onClose: () => {
        toast.info("Payment popup closed.");
      },
    });
  }

  async function handleCreateEscrow() {
    if (!project) return;
    setIsEscrowLoading(true);
    try {
      const result = await escrowApi.create(project.id);
      setEscrow(result.escrow);
      if (result.snapToken) {
        openSnapPayment(result.snapToken);
      }
    } catch (error: unknown) {
      const axiosMsg = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(axiosMsg || "Failed to create payment");
    } finally {
      setIsEscrowLoading(false);
    }
  }

  async function handleReleaseEscrow() {
    if (!escrow) return;
    setIsEscrowLoading(true);
    try {
      await escrowApi.release(escrow.id);
      toast.success("Funds released to freelancer!");
      fetchEscrow();
      fetchProject();
    } catch (error: unknown) {
      const axiosMsg = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(axiosMsg || "Failed to release funds");
    } finally {
      setIsEscrowLoading(false);
    }
  }

  async function handleAcceptBid(bidId: string) {
    setIsBidActionLoading(true);
    try {
      await bidApi.accept(bidId);
      toast.success("Bid accepted! The project is now in progress.");
      fetchProject();
      fetchBids();
    } catch (error: unknown) {
      const axiosMsg = (error as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      toast.error(axiosMsg || "Failed to accept bid");
    } finally {
      setIsBidActionLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!project) return null;

  const clientName =
    project.client?.clientProfile?.displayName || "Anonymous Client";
  const deadline = new Date(project.deadline);
  const created = new Date(project.createdAt);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Back link */}
      <Button variant="ghost" size="sm" className="mb-4" asChild>
        <Link href="/projects">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Projects
        </Link>
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Project Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <ProjectStatusBadge status={project.status} />
                    <Badge variant="outline" className="text-xs">
                      {project.type === "QUICK_TASK"
                        ? "Quick Task"
                        : "Weekly Project"}
                    </Badge>
                  </div>
                  <CardTitle className="text-2xl">{project.title}</CardTitle>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground flex-wrap">
                {project.category && (
                  <span className="flex items-center gap-1">
                    <Tag className="h-4 w-4" />
                    {project.category.name}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Deadline:{" "}
                  {deadline.toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Posted:{" "}
                  {created.toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-lg font-semibold text-primary">
                  {formatRupiah(project.budgetMin)} -{" "}
                  {formatRupiah(project.budgetMax)}
                </p>
              </div>
              <Separator className="my-4" />
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {project.description}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Milestones */}
          {project.milestones && project.milestones.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Milestone className="h-5 w-5" />
                  Milestones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {project.milestones.map((ms, idx) => (
                    <div
                      key={ms.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{ms.title}</p>
                          {ms.dueDate && (
                            <p className="text-xs text-muted-foreground">
                              Due:{" "}
                              {new Date(ms.dueDate).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "numeric",
                                  month: "short",
                                },
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">
                          {formatRupiah(ms.amount)}
                        </p>
                        <Badge variant="outline" className="text-xs mt-0.5">
                          {ms.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Status Actions */}
          {(isAssignedFreelancer || isProjectOwner) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {isAssignedFreelancer && project.status === "IN_PROGRESS" && (
                  <DeliveryDialog
                    projectId={project.id}
                    projectTitle={project.title}
                    projectType={project.type}
                    hasMilestones={(project.milestones?.length ?? 0) > 0}
                    onSuccess={() => {
                      fetchProject();
                      fetchDeliveries();
                    }}>
                    <Button>
                      <Truck className="h-4 w-4 mr-2" />
                      Deliver Work
                    </Button>
                  </DeliveryDialog>
                )}
                {isProjectOwner && project.status === "DELIVERED" && (
                  <>
                    <Button
                      onClick={
                        escrow && escrow.status === "FUNDED"
                          ? handleReleaseEscrow
                          : () => handleStatusUpdate("COMPLETED")
                      }
                      disabled={isStatusLoading || isEscrowLoading}>
                      {isEscrowLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      Approve & Complete
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleStatusUpdate("IN_PROGRESS")}
                      disabled={isStatusLoading}>
                      Request Revision
                    </Button>
                  </>
                )}
                {isProjectOwner &&
                  ["OPEN", "IN_PROGRESS"].includes(project.status) && (
                    <Button
                      variant="destructive"
                      onClick={() => handleStatusUpdate("CANCELLED")}
                      disabled={isStatusLoading}>
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Project
                    </Button>
                  )}

                {/* Dispute button - available for IN_PROGRESS or DELIVERED */}
                {(isProjectOwner || isAssignedFreelancer) &&
                  ["IN_PROGRESS", "DELIVERED"].includes(project.status) && (
                    <DisputeDialog
                      projectId={project.id}
                      projectTitle={project.title}
                      onSuccess={fetchProject}>
                      <Button
                        variant="outline"
                        className="text-destructive border-destructive/30 hover:bg-destructive/10">
                        <AlertTriangle className="h-4 w-4 mr-2" />
                        File Dispute
                      </Button>
                    </DisputeDialog>
                  )}

                {isStatusLoading && (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                )}
              </CardContent>
            </Card>
          )}

          {/* Delivery History */}
          <DeliverySection deliveries={deliveries} />

          {/* Review - available after project COMPLETED */}
          {(isProjectOwner || isAssignedFreelancer) &&
            project.status === "COMPLETED" &&
            user && (
              <ReviewSection
                projectId={project.id}
                reviews={project.reviews || []}
                currentUserId={user.id}
                isProjectOwner={isProjectOwner}
                isAssignedFreelancer={isAssignedFreelancer}
                selectedFreelancerId={project.selectedFreelancerId}
                selectedFreelancerName={
                  project.selectedFreelancer?.freelancerProfile?.displayName ||
                  "Freelancer"
                }
                clientId={project.clientId}
                clientName={clientName}
                onSuccess={fetchProject}
              />
            )}

          {/* Bids (project owner view) */}
          {isProjectOwner && project.status === "OPEN" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Gavel className="h-5 w-5" />
                Bids ({bids.length})
              </h2>
              {bids.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    No bids yet. Share your project to attract freelancers.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {bids.map((bid) => (
                    <BidCard
                      key={bid.id}
                      bid={bid}
                      isProjectOwner
                      onAccept={handleAcceptBid}
                      isLoading={isBidActionLoading}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bid form (freelancer view) */}
          {isFreelancer &&
            !isAssignedFreelancer &&
            project.status === "OPEN" &&
            project.clientId !== user?.id && (
              <BidForm
                projectId={project.id}
                budgetMin={project.budgetMin}
                budgetMax={project.budgetMax}
                onSuccess={fetchProject}
              />
            )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Client
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/profile/${project.clientId}`}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {clientName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{clientName}</p>
                  <p className="text-xs text-muted-foreground">View Profile</p>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Selected Freelancer (if assigned) */}
          {project.selectedFreelancer && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Assigned Freelancer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/profile/${project.selectedFreelancerId}`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {(
                        project.selectedFreelancer.freelancerProfile
                          ?.displayName || "??"
                      )
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">
                      {project.selectedFreelancer.freelancerProfile
                        ?.displayName || "Freelancer"}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {project.selectedFreelancer.freelancerProfile?.tier && (
                        <Badge
                          variant="outline"
                          className={`text-xs border ${getTierColor(project.selectedFreelancer.freelancerProfile.tier as FreelancerTier)}`}>
                          {project.selectedFreelancer.freelancerProfile.tier}
                        </Badge>
                      )}
                      {project.selectedFreelancer.freelancerProfile &&
                        project.selectedFreelancer.freelancerProfile.avgRating >
                          0 && (
                          <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            {project.selectedFreelancer.freelancerProfile.avgRating.toFixed(
                              1,
                            )}
                          </span>
                        )}
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Escrow / Payment Card */}
          {(isProjectOwner || isAssignedFreelancer) &&
            project.selectedFreelancerId &&
            project.status !== "OPEN" &&
            project.status !== "DRAFT" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Payment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {escrow ? (
                    <>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Status</span>
                        <Badge
                          variant={
                            escrow.status === "FUNDED"
                              ? "default"
                              : escrow.status === "RELEASED"
                                ? "secondary"
                                : "outline"
                          }
                          className="text-xs">
                          {escrow.status === "FUNDED" && (
                            <Lock className="h-3 w-3 mr-1" />
                          )}
                          {escrow.status === "RELEASED" && (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          )}
                          {escrow.status}
                        </Badge>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Total</span>
                        <span className="font-semibold">
                          {formatRupiah(escrow.totalAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Platform Fee (15%)
                        </span>
                        <span className="text-muted-foreground">
                          {formatRupiah(escrow.platformFee)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Freelancer Receives
                        </span>
                        <span className="font-medium text-green-600">
                          {formatRupiah(escrow.freelancerAmount)}
                        </span>
                      </div>

                      {/* Pay Now button (PENDING escrow) */}
                      {isProjectOwner &&
                        escrow.status === "PENDING" &&
                        escrow.midtransSnapToken && (
                          <>
                            <Separator />
                            <Button
                              className="w-full"
                              onClick={() =>
                                openSnapPayment(escrow.midtransSnapToken!)
                              }>
                              <CreditCard className="h-4 w-4 mr-2" />
                              Pay Now
                            </Button>
                          </>
                        )}

                      {/* Release Funds button (FUNDED + DELIVERED or COMPLETED) */}
                      {isProjectOwner &&
                        escrow.status === "FUNDED" &&
                        (project.status === "DELIVERED" ||
                          project.status === "COMPLETED") && (
                          <>
                            <Separator />
                            <Button
                              className="w-full"
                              onClick={handleReleaseEscrow}
                              disabled={isEscrowLoading}>
                              {isEscrowLoading ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                              )}
                              Release Funds
                            </Button>
                          </>
                        )}
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        No payment created yet.
                      </p>
                      {isProjectOwner && project.status === "IN_PROGRESS" && (
                        <Button
                          className="w-full"
                          onClick={handleCreateEscrow}
                          disabled={isEscrowLoading}>
                          {isEscrowLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Shield className="h-4 w-4 mr-2" />
                          )}
                          Create Escrow Payment
                        </Button>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

          {/* Chat Link */}
          {(isProjectOwner || isAssignedFreelancer) &&
            project.selectedFreelancerId && (
              <Card>
                <CardContent className="py-4">
                  <Button className="w-full" variant="outline" asChild>
                    <Link href={`/chat/${project.id}`}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Go to Chat
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

          {/* Project Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <ProjectStatusBadge status={project.status} />
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Budget</span>
                <span className="font-medium">
                  {formatRupiah(project.budgetMin)} -{" "}
                  {formatRupiah(project.budgetMax)}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type</span>
                <span>
                  {project.type === "QUICK_TASK"
                    ? "Quick Task"
                    : "Weekly Project"}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Deadline</span>
                <span>
                  {deadline.toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              {project._count && (
                <>
                  <Separator />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bids</span>
                    <span>{project._count.bids}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Login prompt for unauthenticated */}
          {!isAuthenticated && project.status === "OPEN" && (
            <Card>
              <CardContent className="py-6 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Interested in this project?
                </p>
                <Button asChild className="w-full">
                  <Link href="/register?role=freelancer">
                    Register as Freelancer
                  </Link>
                </Button>
                <Button variant="link" asChild className="w-full mt-1">
                  <Link href="/login">Already have an account? Login</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
