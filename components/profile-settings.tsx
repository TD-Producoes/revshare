"use client";

import { useState, useEffect } from "react";
import { useUpdateUserMetadata, type ApiUser } from "@/lib/hooks/users";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FeaturesInput } from "@/components/ui/features-input";
import { projectCategories } from "@/lib/data/categories";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  formatFollowerCount,
  type SocialMediaPlatform,
  type UserMetadata,
} from "@/lib/services/user-metadata";
import {
  Check,
  CheckCircle,
  ChevronsUpDown,
  Github,
  Instagram,
  Linkedin,
  Loader2,
  Youtube,
} from "lucide-react";

// X (Twitter) icon component
function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const SOCIAL_PLATFORMS: {
  id: SocialMediaPlatform;
  name: string;
  icon: React.ReactNode;
  placeholder: string;
}[] = [
  {
    id: "x",
    name: "X (Twitter)",
    icon: <XIcon className="h-4 w-4" />,
    placeholder: "@handle",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: <Linkedin className="h-4 w-4" />,
    placeholder: "username",
  },
  {
    id: "github",
    name: "GitHub",
    icon: <Github className="h-4 w-4" />,
    placeholder: "username",
  },
  {
    id: "youtube",
    name: "YouTube",
    icon: <Youtube className="h-4 w-4" />,
    placeholder: "@channel",
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: <Instagram className="h-4 w-4" />,
    placeholder: "@username",
  },
];

interface ProfileSettingsProps {
  user: ApiUser;
}

export function ProfileSettings({ user }: ProfileSettingsProps) {
  const updateMetadata = useUpdateUserMetadata(user.id);
  const metadata = (user.metadata ?? {}) as UserMetadata;

  // Form state
  const [bio, setBio] = useState(metadata.bio ?? "");
  const [location, setLocation] = useState(metadata.location ?? "");
  const [website, setWebsite] = useState(metadata.website ?? "");
  const [specialties, setSpecialties] = useState<string[]>(metadata.specialties ?? []);
  const [categories, setCategories] = useState<string[]>(metadata.categories ?? []);
  const [focusArea, setFocusArea] = useState(metadata.focusArea ?? "");
  const [socialHandles, setSocialHandles] = useState<
    Record<SocialMediaPlatform, string>
  >({
    x: metadata.socialMedia?.x?.handle ?? "",
    linkedin: metadata.socialMedia?.linkedin?.handle ?? "",
    github: metadata.socialMedia?.github?.handle ?? "",
    youtube: metadata.socialMedia?.youtube?.handle ?? "",
    instagram: metadata.socialMedia?.instagram?.handle ?? "",
  });

  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [categoriesOpen, setCategoriesOpen] = useState(false);

  // Update form when user data changes
  useEffect(() => {
    const meta = (user.metadata ?? {}) as UserMetadata;
    setBio(meta.bio ?? "");
    setLocation(meta.location ?? "");
    setWebsite(meta.website ?? "");
    setSpecialties(meta.specialties ?? []);
    setCategories(meta.categories ?? []);
    setFocusArea(meta.focusArea ?? "");
    setSocialHandles({
      x: meta.socialMedia?.x?.handle ?? "",
      linkedin: meta.socialMedia?.linkedin?.handle ?? "",
      github: meta.socialMedia?.github?.handle ?? "",
      youtube: meta.socialMedia?.youtube?.handle ?? "",
      instagram: meta.socialMedia?.instagram?.handle ?? "",
    });
  }, [user.metadata]);

  const handleSocialHandleChange = (
    platform: SocialMediaPlatform,
    value: string
  ) => {
    setSocialHandles((prev) => ({ ...prev, [platform]: value }));
  };

  const handleSave = async () => {
    setError(null);
    setSaveSuccess(false);

    try {
      // Build social media payload
      const socialMedia: Record<
        SocialMediaPlatform,
        { handle: string } | null
      > = {
        x: null,
        linkedin: null,
        github: null,
        youtube: null,
        instagram: null,
      };

      for (const platform of SOCIAL_PLATFORMS) {
        const handle = socialHandles[platform.id].trim();
        if (handle) {
          socialMedia[platform.id] = { handle };
        } else if (metadata.socialMedia?.[platform.id]) {
          // Clear the platform if handle was removed
          socialMedia[platform.id] = null;
        }
      }

      await updateMetadata.mutateAsync({
        bio: bio.trim() || null,
        location: location.trim() || null,
        website: website.trim() || null,
        specialties: user.role === "marketer" ? (specialties.length > 0 ? specialties : null) : undefined,
        categories: user.role === "marketer" ? (categories.length > 0 ? categories : null) : undefined,
        focusArea: user.role === "marketer" ? (focusArea.trim() || null) : undefined,
        socialMedia,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save profile";
      setError(message);
    }
  };

  const getFollowerDisplay = (platform: SocialMediaPlatform) => {
    const profile = metadata.socialMedia?.[platform];
    if (!profile?.followerCount) return null;

    return (
      <span className="text-xs text-muted-foreground ml-2">
        {formatFollowerCount(profile.followerCount)} followers
      </span>
    );
  };

  const getVerifiedBadge = (platform: SocialMediaPlatform) => {
    const profile = metadata.socialMedia?.[platform];
    if (!profile?.verified) return null;

    return (
      <CheckCircle className="h-3 w-3 text-blue-500 ml-1" aria-label="Verified" />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Public Profile</CardTitle>
        <CardDescription>
          Your public profile information visible to others.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            placeholder="Tell others about yourself..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">
            {bio.length}/500
          </p>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            placeholder="San Francisco, CA"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            maxLength={100}
          />
        </div>

        {/* Website */}
        <div className="space-y-2">
          <Label htmlFor="website">Website</Label>
          <Input
            id="website"
            type="url"
            placeholder="https://example.com"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        {/* Marketer-specific fields */}
        {user.role === "marketer" && (
          <>
            {/* Focus Area */}
            <div className="space-y-2">
              <Label htmlFor="focusArea">Focus Area</Label>
              <Input
                id="focusArea"
                placeholder="e.g., B2B SaaS, E-commerce, Web3"
                value={focusArea}
                onChange={(e) => setFocusArea(e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                Your primary area of expertise or focus
              </p>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <Label>Categories</Label>
              <Popover open={categoriesOpen} onOpenChange={setCategoriesOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={categoriesOpen}
                    className="w-full justify-between"
                  >
                    {categories.length === 0
                      ? "Select categories"
                      : categories.length <= 3
                        ? categories.join(", ")
                        : `${categories.slice(0, 2).join(", ")} +${categories.length - 2}`}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search categories..." />
                    <CommandList>
                      <CommandEmpty>No categories found.</CommandEmpty>
                      <CommandGroup>
                        {projectCategories.map((cat) => {
                          const isSelected = categories.includes(cat);
                          return (
                            <CommandItem
                              key={cat}
                              value={cat}
                              onSelect={() => {
                                setCategories((prev) =>
                                  prev.includes(cat)
                                    ? prev.filter((c) => c !== cat)
                                    : [...prev, cat],
                                );
                              }}
                            >
                              <Check
                                className={cn(
                                  "ml-2 mr-2 h-4 w-4",
                                  isSelected ? "opacity-100" : "opacity-0",
                                )}
                              />
                              {cat}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Choose the project categories you’re best at promoting.
              </p>
            </div>

            {/* Specialties */}
            <div className="space-y-2">
              <Label>Specialties</Label>
              <FeaturesInput
                value={specialties}
                onChange={setSpecialties}
                placeholder="e.g., Content Marketing, Community Building"
                maxFeatures={10}
              />
            </div>
          </>
        )}

        {/* Social Media */}
        <div className="space-y-4">
          <Label>Social Media</Label>
          <p className="text-xs text-muted-foreground -mt-2">
            Add your social media handles. Follower counts are fetched automatically.
          </p>
          <div className="space-y-3">
            {SOCIAL_PLATFORMS.map((platform) => (
              <div key={platform.id} className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted">
                  {platform.icon}
                </div>
                <div className="flex-1">
                  <Input
                    placeholder={platform.placeholder}
                    value={socialHandles[platform.id]}
                    onChange={(e) =>
                      handleSocialHandleChange(platform.id, e.target.value)
                    }
                  />
                </div>
                <div className="flex items-center min-w-[100px]">
                  {getFollowerDisplay(platform.id)}
                  {getVerifiedBadge(platform.id)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-2">
          <div>
            {saveSuccess && (
              <p className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="h-4 w-4" />
                Profile saved
              </p>
            )}
          </div>
          <Button
            onClick={handleSave}
            disabled={updateMetadata.isPending}
          >
            {updateMetadata.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Profile"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
