"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { MilestoneForm } from "@/components/project/milestone-form";
import { AuthGuard } from "@/components/auth/auth-guard";
import { projectApi } from "@/lib/api";
import { formatRupiah } from "@/types/project";
import type { Category } from "@/types";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Plus } from "lucide-react";

const createProjectSchema = z.object({
  title: z
    .string()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be under 200 characters"),
  description: z
    .string()
    .min(20, "Description must be at least 20 characters")
    .max(5000),
  categoryId: z.string().min(1, "Please select a category"),
  type: z.enum(["QUICK_TASK", "WEEKLY_PROJECT"]),
  budgetMin: z.number().positive("Budget must be positive"),
  budgetMax: z.number().positive("Budget must be positive"),
  deadline: z.string().min(1, "Please select a deadline"),
  milestones: z
    .array(
      z.object({
        title: z.string().min(2, "Milestone title required"),
        amount: z.number().positive("Amount must be positive"),
        dueDate: z.string().optional(),
      }),
    )
    .optional(),
});

type CreateProjectValues = z.infer<typeof createProjectSchema>;

function CreateProjectContent() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null,
  );

  const form = useForm<CreateProjectValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      title: "",
      description: "",
      categoryId: "",
      type: "QUICK_TASK",
      budgetMin: 0,
      budgetMax: 0,
      deadline: "",
      milestones: [],
    },
  });

  useEffect(() => {
    async function loadCategories() {
      try {
        const cats = await projectApi.getCategories();
        setCategories(cats);
      } catch {
        toast.error("Failed to load categories");
      }
    }
    loadCategories();
  }, []);

  function handleCategoryChange(catId: string) {
    const cat = categories.find((c) => c.id === catId) || null;
    setSelectedCategory(cat);
    form.setValue("categoryId", catId);
    if (cat && form.getValues("budgetMin") < cat.minPrice) {
      form.setValue("budgetMin", cat.minPrice);
    }
  }

  async function onSubmit(values: CreateProjectValues) {
    if (values.budgetMax < values.budgetMin) {
      form.setError("budgetMax", {
        message: "Maximum budget must be greater than or equal to minimum",
      });
      return;
    }

    if (selectedCategory && values.budgetMin < selectedCategory.minPrice) {
      form.setError("budgetMin", {
        message: `Minimum budget for ${selectedCategory.name} is ${formatRupiah(selectedCategory.minPrice)}`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        milestones:
          values.milestones && values.milestones.length > 0
            ? values.milestones.filter((m) => m.title && m.amount > 0)
            : undefined,
      };
      const project = await projectApi.create(payload);
      toast.success("Project created successfully!");
      router.push(`/projects/${project.id}`);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Failed to create project";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Set min date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Button variant="ghost" size="sm" className="mb-4" asChild>
        <Link href="/projects">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Projects
        </Link>
      </Button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold">Post a New Project</h1>
        <p className="text-muted-foreground mt-1">
          Describe your project and start receiving bids from talented
          freelancers.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Build a responsive e-commerce website"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your project in detail: requirements, expected deliverables, any specific technologies or tools..."
                        className="min-h-[150px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Minimum 20 characters. Be as detailed as possible.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={handleCategoryChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name} (min {formatRupiah(cat.minPrice)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedCategory && (
                        <FormDescription>
                          Min price: {formatRupiah(selectedCategory.minPrice)}
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Type</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="QUICK_TASK">
                            Quick Task (1-3 days)
                          </SelectItem>
                          <SelectItem value="WEEKLY_PROJECT">
                            Weekly Project (1+ weeks)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Budget & Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Budget & Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="budgetMin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Budget (IDR)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="50000"
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
                <FormField
                  control={form.control}
                  name="budgetMax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Budget (IDR)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="500000"
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
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deadline</FormLabel>
                    <FormControl>
                      <Input type="date" min={minDate} {...field} />
                    </FormControl>
                    <FormDescription>
                      When do you need this project completed?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Milestones */}
          <Card>
            <CardContent className="pt-6">
              <MilestoneForm control={form.control} />
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex items-center gap-3">
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </>
              )}
            </Button>
            <Button variant="outline" size="lg" type="button" asChild>
              <Link href="/projects">Cancel</Link>
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export default function CreateProjectPage() {
  return (
    <AuthGuard roles={["CLIENT"]}>
      <CreateProjectContent />
    </AuthGuard>
  );
}
