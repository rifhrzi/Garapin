import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div className={`h-4 bg-muted animate-pulse rounded ${className}`} />
  );
}

function ProjectCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-5 w-16 bg-muted animate-pulse rounded-full" />
          <div className="h-5 w-20 bg-muted animate-pulse rounded-full" />
        </div>
        <SkeletonLine className="h-5 w-3/4" />
      </CardHeader>
      <CardContent>
        <SkeletonLine className="w-full mb-2" />
        <SkeletonLine className="w-2/3 mb-4" />
        <Separator className="my-3" />
        <div className="flex justify-between">
          <SkeletonLine className="w-24" />
          <SkeletonLine className="w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProjectsLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <SkeletonLine className="h-8 w-48 mb-6" />
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-24 bg-muted animate-pulse rounded-md" />
        ))}
      </div>
      <div className="grid gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
