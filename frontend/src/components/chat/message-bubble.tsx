"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FileIcon, Download, AlertTriangle } from "lucide-react";
import type { Message } from "@/types/chat";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

function getDisplayName(sender: Message["sender"]): string {
  if (sender.freelancerProfile?.displayName)
    return sender.freelancerProfile.displayName;
  if (sender.clientProfile?.displayName)
    return sender.clientProfile.displayName;
  return "User";
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getFileExtension(url: string): string {
  const parts = url.split(".");
  return parts[parts.length - 1]?.toUpperCase() || "FILE";
}

function isImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const senderName = getDisplayName(message.sender);

  // System messages (filtered, etc.)
  if (message.type === "SYSTEM") {
    return (
      <div className="flex justify-center my-2">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-xs text-muted-foreground">
          <AlertTriangle className="h-3 w-3" />
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-2 mb-3",
        isOwn ? "flex-row-reverse" : "flex-row",
      )}>
      {/* Avatar */}
      {!isOwn && (
        <Avatar className="h-8 w-8 shrink-0 mt-1">
          <AvatarFallback className="text-xs bg-primary/10 text-primary">
            {getInitials(senderName)}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message content */}
      <div
        className={cn(
          "max-w-[70%] min-w-0",
          isOwn ? "items-end" : "items-start",
        )}>
        {/* Sender name */}
        {!isOwn && (
          <p className="text-xs text-muted-foreground mb-1 px-1">
            {senderName}
          </p>
        )}

        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 wrap-break-word",
            isOwn
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted rounded-bl-md",
          )}>
          {/* File message */}
          {message.type === "FILE" && message.fileUrl ? (
            <div className="space-y-2">
              {isImageUrl(message.fileUrl) ? (
                <a
                  href={message.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer">
                  <img
                    src={message.fileUrl}
                    alt={message.content}
                    className="max-w-full rounded-lg max-h-64 object-cover"
                  />
                </a>
              ) : (
                <a
                  href={message.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg transition-colors",
                    isOwn
                      ? "bg-primary-foreground/10 hover:bg-primary-foreground/20"
                      : "bg-background hover:bg-background/80",
                  )}>
                  <FileIcon className="h-8 w-8 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {message.content}
                    </p>
                    <p
                      className={cn(
                        "text-xs",
                        isOwn
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground",
                      )}>
                      {getFileExtension(message.fileUrl)}
                    </p>
                  </div>
                  <Download className="h-4 w-4 shrink-0" />
                </a>
              )}
            </div>
          ) : (
            /* Text message */
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          )}
        </div>

        {/* Timestamp & filter badge */}
        <div
          className={cn(
            "flex items-center gap-1.5 mt-1 px-1",
            isOwn ? "justify-end" : "justify-start",
          )}>
          <span className="text-[0.625rem] text-muted-foreground">
            {formatTime(message.createdAt)}
          </span>
          {message.wasFiltered && (
            <Badge
              variant="outline"
              className="text-[0.625rem] px-1 py-0 h-4 text-yellow-600 border-yellow-300 dark:text-yellow-400 dark:border-yellow-600">
              filtered
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
