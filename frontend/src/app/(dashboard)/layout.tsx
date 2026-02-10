"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  Gavel,
  DollarSign,
  User,
  Shield,
  MessageSquare,
  AlertTriangle,
  Users,
  BarChart3,
  CreditCard,
  ClipboardList,
} from "lucide-react";

const clientLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/projects", label: "My Projects", icon: Briefcase },
  { href: "/dashboard/chat", label: "Messages", icon: MessageSquare },
  { href: "/profile/edit", label: "Profile", icon: User },
];

const freelancerLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/bids", label: "My Bids", icon: Gavel },
  { href: "/dashboard/earnings", label: "Earnings", icon: DollarSign },
  { href: "/dashboard/chat", label: "Messages", icon: MessageSquare },
  { href: "/profile/edit", label: "Profile", icon: User },
];

const adminLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/admin", label: "Dashboard", icon: Shield },
  { href: "/admin/projects", label: "Projects", icon: Briefcase },
  { href: "/admin/transactions", label: "Transactions", icon: CreditCard },
  { href: "/admin/disputes", label: "Disputes", icon: AlertTriangle },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/chat-audit", label: "Chat Audit", icon: MessageSquare },
  { href: "/admin/activity-log", label: "Activity Log", icon: ClipboardList },
  { href: "/admin/stats", label: "Statistics", icon: BarChart3 },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const links =
    user?.role === "ADMIN"
      ? adminLinks
      : user?.role === "FREELANCER"
        ? freelancerLinks
        : clientLinks;

  const roleLabel =
    user?.role === "ADMIN"
      ? "Admin"
      : user?.role === "FREELANCER"
        ? "Freelancer"
        : "Client";

  return (
    <AuthGuard>
      <div className="min-h-[calc(100vh-4rem)]">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar - desktop only */}
            <aside className="hidden lg:block w-60 shrink-0">
              <div className="sticky top-20 space-y-1">
                {/* User info */}
                <div className="p-4 mb-4 rounded-lg border bg-card">
                  <p className="font-medium text-sm truncate">
                    {user?.displayName}
                  </p>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {roleLabel}
                  </Badge>
                </div>

                {/* Nav links */}
                {links.map((link) => {
                  const isActive =
                    link.href === "/dashboard" || link.href === "/admin"
                      ? pathname === link.href
                      : pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}>
                      <link.icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </aside>

            {/* Mobile nav */}
            <div className="lg:hidden">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {links.map((link) => {
                  const isActive =
                    link.href === "/dashboard" || link.href === "/admin"
                      ? pathname === link.href
                      : pathname.startsWith(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}>
                      <link.icon className="h-3.5 w-3.5" />
                      {link.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Main content */}
            <div className="flex-1 min-w-0">{children}</div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
