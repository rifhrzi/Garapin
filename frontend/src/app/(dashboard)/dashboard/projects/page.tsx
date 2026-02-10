"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectCard } from "@/components/project/project-card";
import { projectApi } from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { Project, ProjectStatus } from "@/types";
import { Briefcase, Loader2, Plus } from "lucide-react";

const STATUS_TABS: Array<{ value: string; label: string }> = [
  { value: "ALL", label: "All" },
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

export default function MyProjectsPage() {
  const { user } = useAuthStore();
  const isClient = user?.role === "CLIENT";

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const status =
        activeTab === "ALL" ? undefined : (activeTab as ProjectStatus);
      const data = await projectApi.getMyProjects(status);
      setProjects(data);
    } catch {
      setProjects([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Projects</h1>
          <p className="text-muted-foreground">
            {isClient
              ? "View and manage your posted projects."
              : "View projects you are working on."}
          </p>
        </div>
        {isClient && (
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Link>
          </Button>
        )}
      </div>

      {/* Status Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="text-xs">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Project List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-1">
              {activeTab === "ALL"
                ? "No projects yet"
                : `No ${activeTab.replace("_", " ").toLowerCase()} projects`}
            </h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              {isClient
                ? "Post your first project and start receiving bids from freelancers."
                : "Browse open projects and submit proposals to start earning."}
            </p>
            <Button asChild>
              <Link href={isClient ? "/projects/new" : "/projects"}>
                {isClient ? "Post a Project" : "Browse Projects"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
