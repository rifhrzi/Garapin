import { Card, CardContent, CardHeader } from "@/components/ui/card";

function SkeletonLine({ className = "" }: { className?: string }) {
  return (
    <div className={`h-4 bg-muted animate-pulse rounded ${className}`} />
  );
}

function MessageSkeleton({ align = "left" }: { align?: "left" | "right" }) {
  return (
    <div className={`flex ${align === "right" ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[70%] space-y-1.5 ${align === "right" ? "items-end" : ""}`}>
        <div className="h-10 w-48 bg-muted animate-pulse rounded-lg" />
        <SkeletonLine className="w-16 h-3" />
      </div>
    </div>
  );
}

export default function ChatLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="h-[70vh] flex flex-col">
        <CardHeader className="border-b">
          <SkeletonLine className="h-6 w-48" />
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-4 space-y-4">
          <MessageSkeleton align="left" />
          <MessageSkeleton align="right" />
          <MessageSkeleton align="left" />
          <MessageSkeleton align="right" />
          <MessageSkeleton align="left" />
        </CardContent>
        <div className="border-t p-4">
          <div className="h-10 bg-muted animate-pulse rounded-md" />
        </div>
      </Card>
    </div>
  );
}
