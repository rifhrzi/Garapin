"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ConversationCard } from "@/components/chat/conversation-card";
import { chatApi } from "@/lib/api";
import { useAuthStore } from "@/lib/stores/auth-store";
import { Loader2, MessageSquare } from "lucide-react";
import type { ConversationListItem } from "@/types/chat";

export default function ChatPage() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<ConversationListItem[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await chatApi.getConversations();
        setConversations(data);
      } catch {
        // silently fail
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Messages</h1>
          <p className="text-muted-foreground">Your project conversations.</p>
        </div>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Messages</h1>
        <p className="text-muted-foreground">Your project conversations.</p>
      </div>

      {conversations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-1">No conversations yet</h3>
            <p className="text-sm text-muted-foreground text-center">
              Conversations are created when you are matched with a freelancer
              or client on a project.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <ConversationCard
              key={conv.id}
              conversation={conv}
              currentUserId={user?.id || ""}
            />
          ))}
        </div>
      )}
    </div>
  );
}
