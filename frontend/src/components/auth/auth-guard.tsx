"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import type { Role } from "@/types";

interface AuthGuardProps {
  children: React.ReactNode;
  roles?: Role[];
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, roles, fallback }: AuthGuardProps) {
  const { isAuthenticated, isHydrated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isHydrated) return;

    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    if (roles && user && !roles.includes(user.role)) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isHydrated, user, roles, router]);

  if (!isHydrated) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (roles && user && !roles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
