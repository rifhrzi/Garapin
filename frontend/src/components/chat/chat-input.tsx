"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Paperclip, Send, Loader2, X } from "lucide-react";

interface ChatInputProps {
  onSend: (content: string) => Promise<void>;
  onFileUpload?: (file: File) => Promise<void>;
  escrowActive: boolean;
  disabled?: boolean;
}

export function ChatInput({
  onSend,
  onFileUpload,
  escrowActive,
  disabled,
}: ChatInputProps) {
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = useCallback(async () => {
    const trimmed = content.trim();
    if (!trimmed && !selectedFile) return;

    setIsSending(true);
    try {
      if (selectedFile && onFileUpload) {
        setIsUploading(true);
        await onFileUpload(selectedFile);
        setSelectedFile(null);
        setIsUploading(false);
      }
      if (trimmed) {
        await onSend(trimmed);
        setContent("");
      }
    } catch {
      // Error handling is done in the parent component via toast
    } finally {
      setIsSending(false);
      setIsUploading(false);
      // Refocus
      textareaRef.current?.focus();
    }
  }, [content, selectedFile, onSend, onFileUpload]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const autoResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    setContent(textarea.value);
  };

  const isDisabled = disabled || isSending;

  return (
    <div className="border-t bg-background p-3">
      {/* Selected file preview */}
      {selectedFile && (
        <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-muted rounded-lg text-sm">
          <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="truncate flex-1">{selectedFile.name}</span>
          <span className="text-xs text-muted-foreground shrink-0">
            {(selectedFile.size / 1024).toFixed(0)} KB
          </span>
          <button
            onClick={() => setSelectedFile(null)}
            className="p-0.5 hover:bg-background rounded">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* File upload button */}
        {escrowActive && onFileUpload && (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 h-10 w-10"
              onClick={() => fileInputRef.current?.click()}
              disabled={isDisabled}>
              <Paperclip className="h-5 w-5" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.zip,.rar,.txt,.doc,.docx,.xls,.xlsx"
            />
          </>
        )}

        {/* Text input */}
        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={autoResize}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={isDisabled}
            rows={1}
            className="w-full resize-none rounded-xl border bg-muted/50 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:opacity-50 max-h-[120px]"
          />
        </div>

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={isDisabled || (!content.trim() && !selectedFile)}
          size="icon"
          className="shrink-0 h-10 w-10 rounded-xl">
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Upload progress indicator */}
      {isUploading && (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Uploading file...
        </div>
      )}
    </div>
  );
}
