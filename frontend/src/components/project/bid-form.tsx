"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bidFormSchema, type BidFormValues } from "@/schemas/bid.schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { bidApi } from "@/lib/api";
import { toast } from "sonner";
import { Gavel, Loader2 } from "lucide-react";
import { AxiosError } from "axios";


interface BidFormProps {
  projectId: string;
  budgetMin: number;
  budgetMax: number;
  onSuccess?: () => void;
}

export function BidForm({
  projectId,
  budgetMin,
  budgetMax,
  onSuccess,
}: BidFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BidFormValues>({
    resolver: zodResolver(bidFormSchema),
    defaultValues: {
      amount: budgetMin,
      estimatedDays: 7,
      proposal: "",
    },
  });

  async function onSubmit(values: BidFormValues) {
    setIsSubmitting(true);
    try {
      await bidApi.create(projectId, values);
      toast.success("Bid submitted successfully!");
      form.reset();
      onSuccess?.();
    } catch (error) {
      const message = error instanceof AxiosError ? error.response?.data?.message : undefined;
      toast.error(message || "Failed to submit bid");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Gavel className="h-5 w-5" />
          Submit Your Bid
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bid Amount (IDR)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={`Min ${budgetMin.toLocaleString()}`}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(Number(e.target.value) || 0)
                        }
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Budget: Rp {budgetMin.toLocaleString()} - Rp{" "}
                      {budgetMax.toLocaleString()}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="estimatedDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Days</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="7"
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(Number(e.target.value) || 0)
                        }
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="proposal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proposal</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your approach, relevant experience, and why you're the best fit for this project..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Gavel className="h-4 w-4 mr-2" />
                  Submit Bid
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
