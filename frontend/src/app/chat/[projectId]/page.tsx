"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "@/components/chat/message-bubble";
import { ChatInput } from "@/components/chat/chat-input";
import { useRealtimeMessages } from "@/hooks/use-realtime-messages";
import { useAuthStore } from "@/lib/stores/auth-store";
import { chatApi } from "@/lib/api";
import { toast } from "sonner";
import {
  ArrowLeft,
  ExternalLink,
  Loader2,
  Lock,
  AlertTriangle,
  Shield,
} from "lucide-react";
import type { Conversation, Message } from "@/types/chat";

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const projectId = params.projectId as string;

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load conversation data
  useEffect(() => {
    async function load() {
      try {
        const data = await chatApi.getConversation(projectId);
        setConversation(data);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load conversation");
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [projectId]);

  // Setup realtime messages
  const { messages, addOptimisticMessage, replaceMessage } =
    useRealtimeMessages(conversation?.id || null, conversation?.messages || []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send text message
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!conversation || !user) return;

      const tempId = `temp-${Date.now()}`;
      const optimistic: Message = {
        id: tempId,
        conversationId: conversation.id,
        senderId: user.id,
        content,
        type: "TEXT",
        fileUrl: null,
        wasFiltered: false,
        filterReason: null,
        createdAt: new Date().toISOString(),
        sender: {
          id: user.id,
          role: user.role as any,
          freelancerProfile:
            user.role === "FREELANCER"
              ? { displayName: user.displayName, avatarUrl: null }
              : null,
          clientProfile:
            user.role === "CLIENT" ? { displayName: user.displayName } : null,
        },
      };

      addOptimisticMessage(optimistic);

      try {
        const realMessage = await chatApi.sendMessage({
          conversationId: conversation.id,
          content,
          type: "TEXT",
        });
        replaceMessage(tempId, realMessage);
      } catch (err: any) {
        const msg = err?.response?.data?.message || "Failed to send message";
        toast.error(msg);
        // Remove optimistic message on error
        replaceMessage(tempId, {
          ...optimistic,
          content: "[Failed to send]",
          type: "SYSTEM",
        });
      }
    },
    [conversation, user, addOptimisticMessage, replaceMessage],
  );

  // Upload file
  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!conversation) return;
      try {
        await chatApi.uploadFile(file, conversation.id);
        toast.success("File uploaded");
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "File upload failed");
        throw err;
      }
    },
    [conversation],
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error || !conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">
          {error || "Conversation not found"}
        </p>
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/chat")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Messages
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="border-b bg-background px-4 py-3 flex items-center gap-3 shrink-0">
        <Button variant="ghost" size="icon" className="shrink-0" asChild>
          <Link href="/dashboard/chat">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>

        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-sm truncate">Project Chat</h1>
          <p className="text-xs text-muted-foreground truncate">
            {projectId.slice(0, 8)}...
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {conversation.escrowActive ? (
            <Badge variant="secondary" className="text-xs">
              <Lock className="h-3 w-3 mr-1" />
              Secured
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-xs text-yellow-600 border-yellow-300">
              <Shield className="h-3 w-3 mr-1" />
              Pre-escrow
            </Badge>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={`/projects/${projectId}`}>
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Pre-escrow warning */}
      {!conversation.escrowActive && (
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border-b border-yellow-200 dark:border-yellow-800 px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />
          <p className="text-xs text-yellow-700 dark:text-yellow-400">
            Escrow not yet active. Contact information sharing is blocked.
            Complete payment to unlock full chat features.
          </p>
        </div>
      )}

      {/* Messages area */}
      <ScrollArea className="flex-1 min-h-0" ref={scrollRef}>
        <div className="p-4 space-y-1">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <p className="text-sm">
                No messages yet. Start the conversation!
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === user?.id}
              />
            ))
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <ChatInput
        onSend={handleSendMessage}
        onFileUpload={conversation.escrowActive ? handleFileUpload : undefined}
        escrowActive={conversation.escrowActive}
      />
    </>
  );
}
