"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { adminApi } from "@/lib/api";
import { getTierColor, getTierLabel } from "@/types/user";
import type { AdminUser, FreelancerTier } from "@/types";
import { toast } from "sonner";
import {
  Users,
  Loader2,
  Award,
  Star,
  Briefcase,
  Ban,
  CheckCircle2,
  AlertTriangle,
  ShieldBan,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { AxiosError } from "axios";

function getUserDisplayName(user: AdminUser): string {
  return (
    user.freelancerProfile?.displayName ||
    user.clientProfile?.displayName ||
    user.email
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [total, setTotal] = useState(0);

  // Suspend dialog
  const [suspendTarget, setSuspendTarget] = useState<AdminUser | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [isSuspending, setIsSuspending] = useState(false);

  // Tier dialog
  const [tierTarget, setTierTarget] = useState<AdminUser | null>(null);
  const [newTier, setNewTier] = useState<string>("");
  const [isAdjustingTier, setIsAdjustingTier] = useState(false);

  // Warn dialog
  const [warnTarget, setWarnTarget] = useState<AdminUser | null>(null);
  const [warnReason, setWarnReason] = useState("");
  const [isWarning, setIsWarning] = useState(false);

  // Ban dialog
  const [banTarget, setBanTarget] = useState<AdminUser | null>(null);
  const [banReason, setBanReason] = useState("");
  const [isBanning, setIsBanning] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const roleFilter = activeTab === "all" ? undefined : activeTab;
      const result = await adminApi.listUsers({
        role: roleFilter,
        limit: 50,
      });
      setUsers(result.data);
      setTotal(result.pagination.total);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleSuspend() {
    if (!suspendTarget || !suspendReason.trim()) return;
    setIsSuspending(true);
    try {
      await adminApi.suspendUser(suspendTarget.id, suspendReason.trim());
      toast.success(`User ${getUserDisplayName(suspendTarget)} suspended`);
      setSuspendTarget(null);
      setSuspendReason("");
      fetchUsers();
    } catch (error) {
      const message = error instanceof AxiosError ? error.response?.data?.message : undefined;
      toast.error(message || "Failed to suspend user");
    } finally {
      setIsSuspending(false);
    }
  }

  async function handleUnsuspend(user: AdminUser) {
    try {
      await adminApi.unsuspendUser(user.id);
      toast.success(`User ${getUserDisplayName(user)} unsuspended`);
      fetchUsers();
    } catch (error) {
      const message = error instanceof AxiosError ? error.response?.data?.message : undefined;
      toast.error(message || "Failed to unsuspend user");
    }
  }

  async function handleTierAdjust() {
    if (!tierTarget || !newTier) return;
    setIsAdjustingTier(true);
    try {
      await adminApi.adjustTier(tierTarget.id, newTier);
      toast.success(
        `Tier updated to ${getTierLabel(newTier as FreelancerTier)}`,
      );
      setTierTarget(null);
      setNewTier("");
      fetchUsers();
    } catch (error) {
      const message = error instanceof AxiosError ? error.response?.data?.message : undefined;
      toast.error(message || "Failed to adjust tier");
    } finally {
      setIsAdjustingTier(false);
    }
  }

  async function handleWarn() {
    if (!warnTarget || !warnReason.trim()) return;
    setIsWarning(true);
    try {
      await adminApi.warnUser(warnTarget.id, warnReason.trim());
      toast.success(`Warning issued to ${getUserDisplayName(warnTarget)}`);
      setWarnTarget(null);
      setWarnReason("");
      fetchUsers();
    } catch (error) {
      const message = error instanceof AxiosError ? error.response?.data?.message : undefined;
      toast.error(message || "Failed to warn user");
    } finally {
      setIsWarning(false);
    }
  }

  async function handleClearWarnings(user: AdminUser) {
    try {
      await adminApi.clearWarnings(user.id);
      toast.success(`Warnings cleared for ${getUserDisplayName(user)}`);
      fetchUsers();
    } catch (error) {
      const message = error instanceof AxiosError ? error.response?.data?.message : undefined;
      toast.error(message || "Failed to clear warnings");
    }
  }

  async function handleBan() {
    if (!banTarget || !banReason.trim()) return;
    setIsBanning(true);
    try {
      await adminApi.banUser(banTarget.id, banReason.trim());
      toast.success(`User ${getUserDisplayName(banTarget)} banned`);
      setBanTarget(null);
      setBanReason("");
      fetchUsers();
    } catch (error) {
      const message = error instanceof AxiosError ? error.response?.data?.message : undefined;
      toast.error(message || "Failed to ban user");
    } finally {
      setIsBanning(false);
    }
  }

  async function handleUnban(user: AdminUser) {
    try {
      await adminApi.unbanUser(user.id);
      toast.success(`User ${getUserDisplayName(user)} unbanned`);
      fetchUsers();
    } catch (error) {
      const message = error instanceof AxiosError ? error.response?.data?.message : undefined;
      toast.error(message || "Failed to unban user");
    }
  }

  async function handleDelete() {
    if (!deleteTarget || !deleteReason.trim()) return;
    setIsDeleting(true);
    try {
      await adminApi.deleteUser(deleteTarget.id, deleteReason.trim());
      toast.success(`User ${getUserDisplayName(deleteTarget)} deleted`);
      setDeleteTarget(null);
      setDeleteReason("");
      fetchUsers();
    } catch (error) {
      const message = error instanceof AxiosError ? error.response?.data?.message : undefined;
      toast.error(message || "Failed to delete user");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          User Management
        </h1>
        <p className="text-muted-foreground">
          Manage platform users. ({total} total)
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all">All Users</TabsTrigger>
          <TabsTrigger value="CLIENT">Clients</TabsTrigger>
          <TabsTrigger value="FREELANCER">Freelancers</TabsTrigger>
          <TabsTrigger value="ADMIN">Admins</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No users found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <Card key={u.id}>
                  <CardContent className="py-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm truncate">
                            {getUserDisplayName(u)}
                          </span>
                          <Badge variant="secondary" className="text-xs">
                            {u.role}
                          </Badge>
                          {u.isBanned && (
                            <Badge className="text-xs bg-red-900 text-red-200">
                              Banned
                            </Badge>
                          )}
                          {u.isSuspended && !u.isBanned && (
                            <Badge variant="destructive" className="text-xs">
                              Suspended
                            </Badge>
                          )}
                          {u.warningCount > 0 && (
                            <Badge className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                              ⚠ {u.warningCount} warning{u.warningCount !== 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {u.email}
                        </p>

                        {u.freelancerProfile && (
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Award className="h-3 w-3" />
                              <Badge
                                variant="outline"
                                className={`text-xs ${getTierColor(u.freelancerProfile.tier as FreelancerTier)}`}>
                                {getTierLabel(
                                  u.freelancerProfile.tier as FreelancerTier,
                                )}
                              </Badge>
                            </span>
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3" />
                              {u.freelancerProfile.avgRating.toFixed(1)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {u.freelancerProfile.completedProjects} completed
                            </span>
                          </div>
                        )}

                        {u.clientProfile?.companyName && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Company: {u.clientProfile.companyName}
                          </p>
                        )}

                        <p className="text-xs text-muted-foreground mt-1">
                          Joined:{" "}
                          {new Date(u.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto flex-wrap">
                        {u.role === "FREELANCER" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setTierTarget(u);
                              setNewTier(u.freelancerProfile?.tier || "BRONZE");
                            }}>
                            <Award className="h-3.5 w-3.5 mr-1" />
                            Tier
                          </Button>
                        )}

                        {u.role !== "ADMIN" && (
                          <>
                            {/* Warn */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setWarnTarget(u)}>
                              <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                              Warn
                            </Button>

                            {/* Clear warnings */}
                            {u.warningCount > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleClearWarnings(u)}>
                                Clear Warns
                              </Button>
                            )}

                            {/* Suspend / Unsuspend */}
                            {u.isSuspended && !u.isBanned ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnsuspend(u)}>
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                Unsuspend
                              </Button>
                            ) : !u.isBanned ? (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setSuspendTarget(u)}>
                                <Ban className="h-3.5 w-3.5 mr-1" />
                                Suspend
                              </Button>
                            ) : null}

                            {/* Ban / Unban */}
                            {u.isBanned ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnban(u)}>
                                <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                                Unban
                              </Button>
                            ) : (
                              <Button
                                variant="destructive"
                                size="sm"
                                className="bg-red-900 hover:bg-red-800"
                                onClick={() => setBanTarget(u)}>
                                <ShieldBan className="h-3.5 w-3.5 mr-1" />
                                Ban
                              </Button>
                            )}

                            {/* Delete */}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeleteTarget(u)}>
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              Delete
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Suspend Dialog */}
      <Dialog
        open={!!suspendTarget}
        onOpenChange={(open) => {
          if (!open) {
            setSuspendTarget(null);
            setSuspendReason("");
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ban className="h-5 w-5 text-destructive" />
              Suspend User
            </DialogTitle>
          </DialogHeader>
          {suspendTarget && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Suspend{" "}
                <span className="font-medium text-foreground">
                  {getUserDisplayName(suspendTarget)}
                </span>{" "}
                ({suspendTarget.email})? They will not be able to access the
                platform.
              </p>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  placeholder="Reason for suspension..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSuspendTarget(null);
                setSuspendReason("");
              }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSuspend}
              disabled={isSuspending || !suspendReason.trim()}>
              {isSuspending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Confirm Suspension
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tier Adjust Dialog */}
      <Dialog
        open={!!tierTarget}
        onOpenChange={(open) => {
          if (!open) {
            setTierTarget(null);
            setNewTier("");
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Adjust Freelancer Tier
            </DialogTitle>
          </DialogHeader>
          {tierTarget && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Manually adjust the tier for{" "}
                <span className="font-medium text-foreground">
                  {getUserDisplayName(tierTarget)}
                </span>
                .
              </p>

              {tierTarget.freelancerProfile && (
                <div className="p-3 bg-muted rounded-lg text-xs space-y-1">
                  <p>
                    Current Tier:{" "}
                    <Badge
                      variant="outline"
                      className={getTierColor(
                        tierTarget.freelancerProfile.tier as FreelancerTier,
                      )}>
                      {getTierLabel(
                        tierTarget.freelancerProfile.tier as FreelancerTier,
                      )}
                    </Badge>
                  </p>
                  <p>
                    Rating: {tierTarget.freelancerProfile.avgRating.toFixed(1)}{" "}
                    / 5.0
                  </p>
                  <p>
                    Completed: {tierTarget.freelancerProfile.completedProjects}{" "}
                    projects
                  </p>
                  <p>
                    Completion Rate:{" "}
                    {tierTarget.freelancerProfile.completionRate}%
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>New Tier</Label>
                <Select value={newTier} onValueChange={setNewTier}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BRONZE">Bronze Crafter</SelectItem>
                    <SelectItem value="SILVER">Silver Builder</SelectItem>
                    <SelectItem value="GOLD">Gold Specialist</SelectItem>
                    <SelectItem value="PLATINUM">Platinum Master</SelectItem>
                    <SelectItem value="LEGEND">Legend Partner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTierTarget(null);
                setNewTier("");
              }}>
              Cancel
            </Button>
            <Button
              onClick={handleTierAdjust}
              disabled={isAdjustingTier || !newTier}>
              {isAdjustingTier && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Update Tier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Warn Dialog */}
      <Dialog
        open={!!warnTarget}
        onOpenChange={(open) => {
          if (!open) {
            setWarnTarget(null);
            setWarnReason("");
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Warn User
            </DialogTitle>
          </DialogHeader>
          {warnTarget && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Issue a warning to{" "}
                <span className="font-medium text-foreground">
                  {getUserDisplayName(warnTarget)}
                </span>{" "}
                ({warnTarget.email}). Current warnings: {warnTarget.warningCount}.
              </p>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea
                  value={warnReason}
                  onChange={(e) => setWarnReason(e.target.value)}
                  placeholder="Reason for warning..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setWarnTarget(null);
                setWarnReason("");
              }}>
              Cancel
            </Button>
            <Button
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
              onClick={handleWarn}
              disabled={isWarning || !warnReason.trim()}>
              {isWarning && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Issue Warning
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban Dialog */}
      <Dialog
        open={!!banTarget}
        onOpenChange={(open) => {
          if (!open) {
            setBanTarget(null);
            setBanReason("");
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldBan className="h-5 w-5 text-red-700" />
              Ban User
            </DialogTitle>
          </DialogHeader>
          {banTarget && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Permanently ban{" "}
                <span className="font-medium text-foreground">
                  {getUserDisplayName(banTarget)}
                </span>{" "}
                ({banTarget.email})? They will be locked out of the platform. This can only be reversed by an admin using &quot;Unban&quot;.
              </p>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Reason for ban..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBanTarget(null);
                setBanReason("");
              }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="bg-red-900 hover:bg-red-800"
              onClick={handleBan}
              disabled={isBanning || !banReason.trim()}>
              {isBanning && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Confirm Ban
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteReason("");
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete User
            </DialogTitle>
          </DialogHeader>
          {deleteTarget && (
            <div className="space-y-4">
              <div className="p-3 bg-destructive/10 rounded-lg text-sm text-destructive">
                ⚠ This action is <strong>irreversible</strong>. The user account and all associated profiles will be permanently deleted.
              </div>
              <p className="text-sm text-muted-foreground">
                Delete{" "}
                <span className="font-medium text-foreground">
                  {getUserDisplayName(deleteTarget)}
                </span>{" "}
                ({deleteTarget.email})?
              </p>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Reason for deletion..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteTarget(null);
                setDeleteReason("");
              }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting || !deleteReason.trim()}>
              {isDeleting && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Permanently Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
