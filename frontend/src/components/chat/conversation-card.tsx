"use client";

import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";
import type { ConversationListItem } from "@/types/chat";

interface ConversationCardProps {
  conversation: ConversationListItem;
  currentUserId: string;
}

function getOtherParty(conv: ConversationListItem, currentUserId: string) {
  const isClient = conv.project.clientId === currentUserId;
  if (isClient) {
    // Show freelancer info
    const fp = conv.project.selectedFreelancer?.freelancerProfile;
    return {
      name: fp?.displayName || "Freelancer",
      avatarUrl: fp?.avatarUrl || null,
      role: "Freelancer" as const,
    };
  } else {
    // Show client info
    const cp = conv.project.client?.clientProfile;
    return {
      name: cp?.displayName || "Client",
      avatarUrl: null,
      role: "Client" as const,
    };
  }
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export function ConversationCard({
  conversation,
  currentUserId,
}: ConversationCardProps) {
  const other = getOtherParty(conversation, currentUserId);
  const lastMsg = conversation.lastMessage;

  return (
    <Link
      href={`/chat/${conversation.projectId}`}
      className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      {/* Avatar */}
      <Avatar className="h-11 w-11 shrink-0">
        <AvatarFallback className="bg-primary/10 text-primary text-sm">
          {getInitials(other.name)}
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="font-medium text-sm truncate">{other.name}</p>
          {lastMsg && (
            <span className="text-[0.625rem] text-muted-foreground shrink-0">
              {timeAgo(lastMsg.createdAt)}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate mb-1">
          {conversation.project.title}
        </p>
        <div className="flex items-center gap-2">
          {lastMsg ? (
            <p className="text-xs text-muted-foreground truncate flex-1">
              {lastMsg.type === "FILE" ? "📎 File" : lastMsg.content}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground italic flex-1">
              No messages yet
            </p>
          )}
          {conversation.escrowActive ? (
            <Badge
              variant="secondary"
              className="text-[0.625rem] px-1.5 py-0 h-4 shrink-0">
              <Lock className="h-2.5 w-2.5 mr-0.5" />
              Escrow
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-[0.625rem] px-1.5 py-0 h-4 shrink-0 text-yellow-600 border-yellow-300 dark:text-yellow-400 dark:border-yellow-600">
              Pre-escrow
            </Badge>
          )}
        </div>
      </div>
    </Link>
  );
}
