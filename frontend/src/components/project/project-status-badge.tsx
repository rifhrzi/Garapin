"use client";

import { Badge } from "@/components/ui/badge";
import { getStatusColor, getStatusLabel } from "@/types/project";
import type { ProjectStatus } from "@/types";

interface ProjectStatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

export function ProjectStatusBadge({
  status,
  className,
}: ProjectStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={`${getStatusColor(status)} border-0 ${className || ""}`}>
      {getStatusLabel(status)}
    </Badge>
  );
}
