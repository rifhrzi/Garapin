import { Card, CardContent, CardHeader } from "@/components/ui/card";

function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div className={`h-4 bg-muted animate-pulse rounded ${className}`} />
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <SkeletonLine className="h-4 w-24" />
      </CardHeader>
      <CardContent>
        <SkeletonLine className="h-8 w-16" />
      </CardContent>
    </Card>
  );
}

export default function DashboardLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <SkeletonLine className="h-8 w-40 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <SkeletonLine className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonLine key={i} className="w-full h-12" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <SkeletonLine className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonLine key={i} className="w-full h-12" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
