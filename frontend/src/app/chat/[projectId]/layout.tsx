import { AuthGuard } from "@/components/auth/auth-guard";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex flex-col h-[calc(100vh-4rem)]">{children}</div>
    </AuthGuard>
  );
}
