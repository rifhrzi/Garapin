'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Message, MessageSender } from '@/types/chat';
import type { RealtimeChannel } from '@supabase/supabase-js';

/** Raw DB row shape from Supabase postgres_changes INSERT on Message table */
interface MessageRow {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  originalContent?: string | null;
  type: Message['type'];
  fileUrl?: string | null;
  wasFiltered: boolean;
  filterReason?: string | null;
  createdAt: string;
  sender?: MessageSender | null;
}

export function useRealtimeMessages(
  conversationId: string | null,
  initialMessages: Message[] = []
) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Sync initial messages when they change (React-recommended render-time state adjustment)
  const [prevInitialLength, setPrevInitialLength] = useState(initialMessages.length);
  if (initialMessages.length > 0 && initialMessages.length !== prevInitialLength) {
    setPrevInitialLength(initialMessages.length);
    setMessages(initialMessages);
  }

  // Subscribe to realtime inserts on the messages table
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Message',
          filter: `conversationId=eq.${conversationId}`,
        },
        (payload) => {
          // The payload.new contains the raw DB row.
          // We enrich it on the frontend when we get API response,
          // but for realtime we use a simpler approach: only add if
          // we don't already have this message (avoid duplicates from
          // optimistic updates).
          const newMsg = payload.new as MessageRow;
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === newMsg.id);
            if (exists) return prev;

            // Map DB snake_case to our camelCase type
            const mapped: Message = {
              id: newMsg.id,
              conversationId: newMsg.conversationId,
              senderId: newMsg.senderId,
              content: newMsg.content,
              originalContent: newMsg.originalContent,
              type: newMsg.type,
              fileUrl: newMsg.fileUrl,
              wasFiltered: newMsg.wasFiltered,
              filterReason: newMsg.filterReason,
              createdAt: newMsg.createdAt,
              sender: newMsg.sender || {
                id: newMsg.senderId,
                role: 'CLIENT',
                freelancerProfile: null,
                clientProfile: null,
              },
            };

            return [...prev, mapped];
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId]);

  // Add a message optimistically (before API confirms)
  const addOptimisticMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      const exists = prev.some((m) => m.id === message.id);
      if (exists) return prev;
      return [...prev, message];
    });
  }, []);

  // Replace an optimistic message with the real one from API
  const replaceMessage = useCallback((tempId: string, realMessage: Message) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === tempId ? realMessage : m))
    );
  }, []);

  // Prepend older messages (for pagination / load more)
  const prependMessages = useCallback((olderMessages: Message[]) => {
    setMessages((prev) => {
      const existingIds = new Set(prev.map((m) => m.id));
      const newOnes = olderMessages.filter((m) => !existingIds.has(m.id));
      return [...newOnes, ...prev];
    });
  }, []);

  return {
    messages,
    setMessages,
    addOptimisticMessage,
    replaceMessage,
    prependMessages,
  };
}
