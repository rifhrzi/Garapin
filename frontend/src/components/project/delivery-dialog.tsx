"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { projectApi } from "@/lib/api";
import { toast } from "sonner";
import {
  FileUp,
  Link as LinkIcon,
  Loader2,
  Truck,
  Upload,
  X,
} from "lucide-react";

interface DeliveryDialogProps {
  projectId: string;
  projectTitle: string;
  projectType: "QUICK_TASK" | "WEEKLY_PROJECT";
  hasMilestones: boolean;
  onSuccess?: () => void;
  children: React.ReactNode;
}

export function DeliveryDialog({
  projectId,
  projectTitle,
  projectType,
  hasMilestones,
  onSuccess,
  children,
}: DeliveryDialogProps) {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [report, setReport] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requiresReport = projectType === "WEEKLY_PROJECT" && hasMilestones;
  const hasLinkOrFile = link.trim().length > 0 || file !== null;

  const isValid =
    description.trim().length > 0 &&
    hasLinkOrFile &&
    (!requiresReport || report.trim().length > 0);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB");
      return;
    }
    setFile(selected);
  }

  function removeFile() {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function resetForm() {
    setDescription("");
    setLink("");
    setReport("");
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit() {
    if (!isValid) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      await projectApi.deliver(projectId, {
        description: description.trim(),
        link: link.trim() || undefined,
        report: report.trim() || undefined,
        file: file || undefined,
      });
      toast.success("Work delivered successfully!");
      setOpen(false);
      resetForm();
      onSuccess?.();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to deliver work"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Deliver Work
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium">{projectTitle}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Provide a link or upload a file with your deliverables. The client
              will review your submission.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summarize the work you've completed..."
              rows={3}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">
              {description.length}/2000
            </p>
          </div>

          {/* Link */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <LinkIcon className="h-3.5 w-3.5" />
              Deliverable Link
            </Label>
            <Input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://drive.google.com/... or GitHub repo URL"
              type="url"
            />
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <FileUp className="h-3.5 w-3.5" />
              Upload File
            </Label>
            {file ? (
              <div className="flex items-center gap-2 p-2.5 border rounded-lg bg-muted/50">
                <Upload className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-sm truncate flex-1">{file.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {(file.size / 1024 / 1024).toFixed(1)}MB
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={removeFile}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Click to upload (max 10MB)
                </span>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.zip,.rar,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp"
            />
            {!hasLinkOrFile && (
              <p className="text-xs text-destructive">
                You must provide at least a link or a file
              </p>
            )}
          </div>

          {/* Project Report (for milestone projects) */}
          {requiresReport && (
            <div className="space-y-2">
              <Label>
                Project Report <span className="text-destructive">*</span>
              </Label>
              <Textarea
                value={report}
                onChange={(e) => setReport(e.target.value)}
                placeholder="Provide a detailed report covering milestone progress, what was completed, and any notes for the client..."
                rows={5}
                maxLength={5000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {report.length}/5000
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !isValid}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Truck className="h-4 w-4 mr-2" />
            )}
            Deliver Work
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
