"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { AuthGuard } from "@/components/auth/auth-guard";
import { useAuthStore } from "@/lib/stores/auth-store";
import { authApi, userApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, Trash2, Save } from "lucide-react";
import { getTierLabel, getTierColor } from "@/types/user";
import type { FreelancerTier, User, PortfolioLink } from "@/types/user";
import { AxiosError } from "axios";

const profileSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters").max(100),
  bio: z.string().max(1000).optional(),
  avatarUrl: z.string().url("Must be a valid URL").or(z.literal("")).optional(),
  companyName: z.string().max(200).optional(),
});

const portfolioSchema = z.object({
  links: z.array(
    z.object({
      type: z.enum([
        "github",
        "behance",
        "dribbble",
        "drive",
        "website",
        "other",
      ]),
      url: z.string().url("Must be a valid URL"),
      label: z.string().max(100),
    }),
  ),
});

type ProfileForm = z.infer<typeof profileSchema>;
type PortfolioForm = z.infer<typeof portfolioSchema>;

function EditProfileContent() {
  const { user, setUser } = useAuthStore();
  const [fullProfile, setFullProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPortfolio, setSavingPortfolio] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: "",
      bio: "",
      avatarUrl: "",
      companyName: "",
    },
  });

  const portfolioForm = useForm<PortfolioForm>({
    resolver: zodResolver(portfolioSchema),
    defaultValues: { links: [] },
  });

  const { fields, append, remove } = useFieldArray({
    control: portfolioForm.control,
    name: "links",
  });

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      try {
        const me = await authApi.me();
        const profile = me as unknown as User;
        setFullProfile(profile);

        const fp = profile.freelancerProfile;
        const cp = profile.clientProfile;

        profileForm.reset({
          displayName: fp?.displayName || cp?.displayName || "",
          bio: fp?.bio || "",
          avatarUrl: fp?.avatarUrl || "",
          companyName: cp?.companyName || "",
        });

        if (fp?.portfolioLinks) {
          portfolioForm.reset({
            links:
              (fp.portfolioLinks as PortfolioLink[]).length > 0
                ? (fp.portfolioLinks as PortfolioLink[])
                : [],
          });
        }
      } catch {
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function onSaveProfile(values: ProfileForm) {
    setSaving(true);
    try {
      await userApi.updateProfile({
        displayName: values.displayName,
        bio: values.bio || undefined,
        avatarUrl: values.avatarUrl || undefined,
        companyName: values.companyName || undefined,
      });

      // Update auth store display name
      if (user) {
        setUser({ ...user, displayName: values.displayName });
      }

      toast.success("Profile updated successfully");
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(
        axiosError.response?.data?.message || "Failed to update profile",
      );
    } finally {
      setSaving(false);
    }
  }

  async function onSavePortfolio(values: PortfolioForm) {
    setSavingPortfolio(true);
    try {
      await userApi.updatePortfolio(values.links);
      toast.success("Portfolio updated successfully");
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(
        axiosError.response?.data?.message || "Failed to update portfolio",
      );
    } finally {
      setSavingPortfolio(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isFreelancer = user?.role === "FREELANCER";
  const fp = fullProfile?.freelancerProfile;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Profile</h1>
        <p className="text-muted-foreground">
          Update your personal information and portfolio.
        </p>
      </div>

      {/* Tier Card for Freelancers */}
      {isFreelancer && fp && (
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <span className="text-sm font-medium">Current Tier:</span>
            <Badge className={getTierColor(fp.tier as FreelancerTier)}>
              {getTierLabel(fp.tier as FreelancerTier)}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {fp.completedProjects} projects,{" "}
              {fp.avgRating > 0
                ? `${fp.avgRating.toFixed(1)} rating`
                : "no ratings yet"}
            </span>
          </CardContent>
        </Card>
      )}

      {/* Profile Info Form */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form
              onSubmit={profileForm.handleSubmit(onSaveProfile)}
              className="space-y-4">
              <FormField
                control={profileForm.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isFreelancer && (
                <FormField
                  control={profileForm.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell clients about your skills and experience..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {isFreelancer && (
                <FormField
                  control={profileForm.control}
                  name="avatarUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avatar URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/avatar.jpg"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {!isFreelancer && (
                <FormField
                  control={profileForm.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your company (optional)"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Profile
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Portfolio Editor for Freelancers */}
      {isFreelancer && (
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Links</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...portfolioForm}>
              <form
                onSubmit={portfolioForm.handleSubmit(onSavePortfolio)}
                className="space-y-4">
                {fields.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    No portfolio links yet. Add your first one below.
                  </p>
                )}

                {fields.map((field, index) => (
                  <div key={field.id} className="flex gap-3 items-start">
                    <FormField
                      control={portfolioForm.control}
                      name={`links.${index}.type`}
                      render={({ field: f }) => (
                        <FormItem className="w-36">
                          <Select
                            onValueChange={f.onChange}
                            defaultValue={f.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="github">GitHub</SelectItem>
                              <SelectItem value="behance">Behance</SelectItem>
                              <SelectItem value="dribbble">Dribbble</SelectItem>
                              <SelectItem value="drive">
                                Google Drive
                              </SelectItem>
                              <SelectItem value="website">Website</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={portfolioForm.control}
                      name={`links.${index}.url`}
                      render={({ field: f }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input placeholder="https://..." {...f} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={portfolioForm.control}
                      name={`links.${index}.label`}
                      render={({ field: f }) => (
                        <FormItem className="w-32">
                          <FormControl>
                            <Input placeholder="Label" {...f} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(index)}
                      className="mt-0.5 text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Separator />

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      append({ type: "website", url: "", label: "" })
                    }>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Link
                  </Button>

                  <Button type="submit" disabled={savingPortfolio}>
                    {savingPortfolio ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Portfolio
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function EditProfilePage() {
  return (
    <AuthGuard>
      <div className="container mx-auto px-4 py-8">
        <EditProfileContent />
      </div>
    </AuthGuard>
  );
}
