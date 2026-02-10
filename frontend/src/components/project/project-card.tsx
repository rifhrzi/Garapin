"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProjectStatusBadge } from "./project-status-badge";
import { formatRupiah } from "@/types/project";
import type { Project } from "@/types";
import { Calendar, User, Gavel, Tag } from "lucide-react";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const clientName =
    project.client?.clientProfile?.displayName || "Anonymous Client";

  const deadline = new Date(project.deadline);
  const isExpired = deadline < new Date() && project.status === "OPEN";

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-semibold line-clamp-2 leading-snug">
              {project.title}
            </CardTitle>
            <ProjectStatusBadge status={project.status} />
          </div>
          <div className="flex items-center gap-2 flex-wrap mt-1">
            {project.category && (
              <Badge variant="secondary" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                {project.category.name}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {project.type === "QUICK_TASK" ? "Quick Task" : "Weekly Project"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {project.description}
          </p>
          <div className="text-sm font-semibold text-primary">
            {formatRupiah(project.budgetMin)} -{" "}
            {formatRupiah(project.budgetMax)}
          </div>
        </CardContent>
        <CardFooter className="pt-0 text-xs text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span className={isExpired ? "text-destructive" : ""}>
                {deadline.toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </span>
            {project._count && (
              <span className="flex items-center gap-1">
                <Gavel className="h-3 w-3" />
                {project._count.bids} bid{project._count.bids !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {clientName}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
