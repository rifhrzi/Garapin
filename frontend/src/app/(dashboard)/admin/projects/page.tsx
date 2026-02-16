"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminApi, projectApi } from "@/lib/api";
import { formatRupiah } from "@/types/project";
import type { AdminProject, Category } from "@/types";
import {
  Briefcase,
  Loader2,
  Search,
  ExternalLink,
  Users,
  Calendar,
  DollarSign,
  Tag,
  ChevronLeft,
  ChevronRight,
  Trash2,
  RefreshCw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AxiosError } from "axios";

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

function getClientName(project: AdminProject): string {
  return project.client?.clientProfile?.displayName || project.client?.email || "Unknown";
}

function getFreelancerName(project: AdminProject): string {
  if (!project.selectedFreelancer) return "-";
  return (
    project.selectedFreelancer.freelancerProfile?.displayName ||
    project.selectedFreelancer.email ||
    "Unknown"
  );
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const limit = 20;

  // Status change dialog
  const [statusTarget, setStatusTarget] = useState<AdminProject | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [statusReason, setStatusReason] = useState("");
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<AdminProject | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    projectApi.getCategories().then(setCategories).catch(() => {});
  }, []);

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit };
      if (activeTab !== "all") params.status = activeTab;
      if (categoryFilter !== "all") params.categoryId = categoryFilter;
      if (typeFilter !== "all") params.type = typeFilter;
      if (searchQuery) params.search = searchQuery;

      const result = await adminApi.listProjects(params);
      setProjects(result.data);
      setTotal(result.pagination.total);
    } catch {
      // error handled silently
    } finally {
      setIsLoading(false);
    }
  }, [page, activeTab, categoryFilter, typeFilter, searchQuery]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  function handleSearch() {
    setSearchQuery(searchInput.trim());
    setPage(1);
  }

  const totalPages = Math.ceil(total / limit);

  async function handleStatusChange() {
    if (!statusTarget || !newStatus || !statusReason.trim()) return;
    setIsChangingStatus(true);
    try {
      await adminApi.updateProjectStatus(statusTarget.id, newStatus, statusReason.trim());
      toast.success(`Project status updated to ${newStatus.replace("_", " ")}`);
      setStatusTarget(null);
      setNewStatus("");
      setStatusReason("");
      fetchProjects();
    } catch (error) {
      const message = error instanceof AxiosError ? error.response?.data?.message : undefined;
      toast.error(message || "Failed to update project status");
    } finally {
      setIsChangingStatus(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget || !deleteReason.trim()) return;
    setIsDeleting(true);
    try {
      await adminApi.deleteProject(deleteTarget.id, deleteReason.trim());
      toast.success(`Project "${deleteTarget.title}" deleted`);
      setDeleteTarget(null);
      setDeleteReason("");
      fetchProjects();
    } catch (error) {
      const message = error instanceof AxiosError ? error.response?.data?.message : undefined;
      toast.error(message || "Failed to delete project");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Briefcase className="h-6 w-6" />
          Projects Management
        </h1>
        <p className="text-muted-foreground">
          Browse and monitor all platform projects. ({total} total)
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Search by title..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="max-w-sm"
          />
          <Button
            variant="outline"
            onClick={handleSearch}
            disabled={isLoading}>
            <Search className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Select
            value={categoryFilter}
            onValueChange={(v) => {
              setCategoryFilter(v);
              setPage(1);
            }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v);
              setPage(1);
            }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="QUICK_TASK">Quick Task</SelectItem>
              <SelectItem value="WEEKLY_PROJECT">Weekly Project</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => {
          setActiveTab(v);
          setPage(1);
        }}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="DRAFT">Draft</TabsTrigger>
          <TabsTrigger value="OPEN">Open</TabsTrigger>
          <TabsTrigger value="IN_PROGRESS">In Progress</TabsTrigger>
          <TabsTrigger value="DELIVERED">Delivered</TabsTrigger>
          <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
          <TabsTrigger value="DISPUTED">Disputed</TabsTrigger>
          <TabsTrigger value="CANCELLED">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : projects.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Briefcase className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No projects found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => (
                <Card key={project.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge
                            className={`text-xs ${STATUS_COLORS[project.status] || ""}`}>
                            {project.status.replace("_", " ")}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {project.type === "QUICK_TASK"
                              ? "Quick Task"
                              : "Weekly Project"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(project.createdAt).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>

                        <h3 className="font-semibold text-sm">{project.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {project.description}
                        </p>

                        <div className="flex items-center gap-4 mt-2 flex-wrap text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Client: {getClientName(project)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            Freelancer: {getFreelancerName(project)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {project.category.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {formatRupiah(project.budgetMin)} -{" "}
                            {formatRupiah(project.budgetMax)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Deadline:{" "}
                            {new Date(project.deadline).toLocaleDateString(
                              "id-ID",
                            )}
                          </span>
                          <span>
                            {project._count.bids} bid
                            {project._count.bids !== 1 ? "s" : ""}
                          </span>
                          {project.escrow && (
                            <Badge
                              className={`text-xs ${ESCROW_COLORS[project.escrow.status] || ""}`}>
                              Escrow: {project.escrow.status}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setStatusTarget(project);
                            setNewStatus(project.status);
                          }}>
                          <RefreshCw className="h-3.5 w-3.5 mr-1" />
                          Status
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/projects/${project.id}`}>
                            <ExternalLink className="h-3.5 w-3.5 mr-1" />
                            View
                          </Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteTarget(project)}>
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages} ({total} projects)
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
        </TabsContent>
      </Tabs>

      {/* Status Change Dialog */}
      <Dialog
        open={!!statusTarget}
        onOpenChange={(open) => {
          if (!open) {
            setStatusTarget(null);
            setNewStatus("");
            setStatusReason("");
          }
        }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Change Project Status
            </DialogTitle>
          </DialogHeader>
          {statusTarget && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Change status for{" "}
                <span className="font-medium text-foreground">
                  {statusTarget.title}
                </span>
              </p>
              <div className="p-3 bg-muted rounded-lg text-xs">
                Current: <Badge className={`text-xs ${STATUS_COLORS[statusTarget.status] || ""}`}>
                  {statusTarget.status.replace("_", " ")}
                </Badge>
              </div>
              <div className="space-y-2">
                <Label>New Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="DISPUTED">Disputed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Reason for status change..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setStatusTarget(null);
                setNewStatus("");
                setStatusReason("");
              }}>
              Cancel
            </Button>
            <Button
              onClick={handleStatusChange}
              disabled={isChangingStatus || !newStatus || !statusReason.trim() || newStatus === statusTarget?.status}>
              {isChangingStatus && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Project Dialog */}
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
              Delete Project
            </DialogTitle>
          </DialogHeader>
          {deleteTarget && (
            <div className="space-y-4">
              <div className="p-3 bg-destructive/10 rounded-lg text-sm text-destructive">
                ⚠ This action is <strong>irreversible</strong>. The project and all associated data (bids, milestones, deliveries, conversations) will be permanently deleted.
              </div>
              <p className="text-sm text-muted-foreground">
                Delete{" "}
                <span className="font-medium text-foreground">
                  {deleteTarget.title}
                </span>?
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
