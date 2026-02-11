"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminApi } from "@/lib/api";
import type {
  FlaggedMessage,
  ChatAuditConversation,
  ChatAuditMessage,
} from "@/types";
import { toast } from "sonner";
import {
  MessageSquare,
  Loader2,
  Search,
  Shield,
  Flag,
  User,
  FileText,
  Eye,
} from "lucide-react";

function getFlagColor(flagType: string) {
  const map: Record<string, string> = {
    PHONE: "bg-red-100 text-red-800",
    EMAIL: "bg-orange-100 text-orange-800",
    URL: "bg-yellow-100 text-yellow-800",
    SOCIAL_MEDIA: "bg-purple-100 text-purple-800",
    KEYWORD: "bg-blue-100 text-blue-800",
    BEHAVIORAL: "bg-pink-100 text-pink-800",
  };
  return map[flagType] || "bg-gray-100 text-gray-800";
}

function getSenderName(sender: {
  email: string;
  freelancerProfile?: { displayName: string } | null;
  clientProfile?: { displayName: string } | null;
}): string {
  return (
    sender.freelancerProfile?.displayName ||
    sender.clientProfile?.displayName ||
    sender.email
  );
}

export default function AdminChatAuditPage() {
  const [activeTab, setActiveTab] = useState("flags");

  // Flagged messages state
  const [flags, setFlags] = useState<FlaggedMessage[]>([]);
  const [flagsLoading, setFlagsLoading] = useState(true);
  const [flagsTotal, setFlagsTotal] = useState(0);

  // Chat audit state
  const [searchInput, setSearchInput] = useState("");
  const [conversation, setConversation] =
    useState<ChatAuditConversation | null>(null);
  const [auditLoading, setAuditLoading] = useState(false);

  const fetchFlags = useCallback(async () => {
    setFlagsLoading(true);
    try {
      const result = await adminApi.getFlaggedMessages(1, 50);
      setFlags(result.data);
      setFlagsTotal(result.pagination.total);
    } catch {
      toast.error("Failed to load flagged messages");
    } finally {
      setFlagsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  async function handleAuditSearch() {
    const id = searchInput.trim();
    if (!id) return;
    setAuditLoading(true);
    setConversation(null);
    try {
      const data = await adminApi.getChatAudit(id);
      setConversation(data);
    } catch {
      toast.error("Conversation not found");
    } finally {
      setAuditLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          Chat Audit
        </h1>
        <p className="text-muted-foreground">
          Review flagged messages and audit chat conversations.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="flags" className="flex items-center gap-1.5">
            <Flag className="h-3.5 w-3.5" />
            Flagged Messages
            {flagsTotal > 0 && (
              <Badge variant="destructive" className="text-xs ml-1 h-5 px-1.5">
                {flagsTotal}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" />
            Conversation Audit
          </TabsTrigger>
        </TabsList>

        {/* Flagged Messages Tab */}
        <TabsContent value="flags" className="mt-4">
          {flagsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : flags.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Shield className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No flagged messages found. All clear!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {flags.map((flag) => (
                <Card key={flag.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge className={getFlagColor(flag.flagType)}>
                            {flag.flagType.replace("_", " ")}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(flag.createdAt).toLocaleDateString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        </div>

                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/30 rounded border border-red-200 dark:border-red-900 text-sm">
                          <p className="font-medium text-xs text-red-600 mb-1">
                            Matched:{" "}
                            <code className="bg-red-100 dark:bg-red-900/50 px-1 rounded">
                              {flag.matchedPattern}
                            </code>
                          </p>
                          <p className="text-xs">
                            {flag.message.originalContent ||
                              flag.message.content}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {getSenderName(flag.message.sender)} (
                            {flag.message.sender.role})
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs px-2"
                            onClick={() => {
                              setSearchInput(
                                flag.message.conversation.projectId,
                              );
                              setActiveTab("audit");
                              // Will need manual search
                            }}>
                            <Eye className="h-3 w-3 mr-1" />
                            View Conversation
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Conversation Audit Tab */}
        <TabsContent value="audit" className="mt-4 space-y-4">
          <Card>
            <CardContent className="py-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter conversation or project ID..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAuditSearch()}
                />
                <Button
                  onClick={handleAuditSearch}
                  disabled={auditLoading || !searchInput.trim()}>
                  {auditLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {conversation && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    {conversation.project.title}
                  </span>
                  <Badge
                    variant={
                      conversation.escrowActive ? "default" : "secondary"
                    }
                    className="text-xs">
                    {conversation.escrowActive ? "Escrow Active" : "Pre-Escrow"}
                  </Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {conversation.messages.length} messages
                </p>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-3">
                    {conversation.messages.map((msg) => (
                      <AuditMessageBubble key={msg.id} message={msg} />
                    ))}
                    {conversation.messages.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-8">
                        No messages in this conversation.
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AuditMessageBubble({ message }: { message: ChatAuditMessage }) {
  const senderName = getSenderName(message.sender);
  const hasFlags = message.flags.length > 0;

  return (
    <div
      className={`p-3 rounded-lg border text-sm ${
        hasFlags
          ? "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20"
          : "border-border bg-muted/30"
      }`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-xs">{senderName}</span>
          <Badge variant="outline" className="text-xs h-5">
            {message.sender.role}
          </Badge>
          {message.wasFiltered && (
            <Badge variant="destructive" className="text-xs h-5">
              Filtered
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {new Date(message.createdAt).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {message.type === "FILE" ? (
        <div className="flex items-center gap-1.5 text-xs text-blue-600">
          <FileText className="h-3.5 w-3.5" />
          File attachment
        </div>
      ) : message.type === "SYSTEM" ? (
        <p className="text-xs italic text-muted-foreground">
          {message.content}
        </p>
      ) : (
        <p className="text-xs whitespace-pre-wrap">{message.content}</p>
      )}

      {message.originalContent &&
        message.originalContent !== message.content && (
          <div className="mt-2 p-1.5 bg-orange-50 dark:bg-orange-950/30 rounded text-xs">
            <span className="font-medium text-orange-600">Original:</span>{" "}
            <span className="text-muted-foreground">
              {message.originalContent}
            </span>
          </div>
        )}

      {hasFlags && (
        <div className="mt-2 flex flex-wrap gap-1">
          {message.flags.map((flag) => (
            <Badge
              key={flag.id}
              className={`text-xs ${getFlagColor(flag.flagType)}`}>
              {flag.flagType}: {flag.matchedPattern}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
