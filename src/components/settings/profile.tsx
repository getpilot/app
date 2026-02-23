"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Camera } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  updateUserSettings,
  UpdateUserFormData,
  updateProfileImage,
} from "@/actions/settings";
import { gender_options } from "@/lib/constants/onboarding";
import { optionToValue } from "@/lib/utils";
import { ImageUploadDialog } from "./image-upload";
import { Label } from "../ui/label";

const genderValues = gender_options.map((option) => optionToValue(option));
type GenderValue = (typeof genderValues)[number];

const formSchema = z.object({
  name: z.string().min(1, "What should we call you?"),
  gender: z.enum(genderValues as [string, ...string[]]).optional(),
});

interface SettingsFormProps {
  userData: {
    id: string;
    name: string;
    email: string;
    gender: string | null;
    image?: string | null;
  } | null;
}

async function submitUserSettings(
  data: UpdateUserFormData,
  setIsLoading: (v: boolean) => void
) {
  setIsLoading(true);
  try {
    const result = await updateUserSettings(data);

    if (result.success) {
      toast.success("Profile updated!");
    } else {
      toast.error(result.error || "Couldn't save changes. Try again?");
    }
  } catch (error) {
    toast.error("Something went wrong. Try again?");
    console.error("Settings update error:", error);
  } finally {
    setIsLoading(false);
  }
}

export default function SettingsForm({ userData }: SettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const userImage = uploadedImage ?? userData?.image;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: userData?.name,
      gender: userData?.gender as GenderValue,
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    await submitUserSettings(data as UpdateUserFormData, setIsLoading);
  };

  const handleImageUploaded = async (imageUrl: string) => {
    try {
      const result = await updateProfileImage(imageUrl);
      if (result.success) {
        setUploadedImage(imageUrl);
      }
    } catch (error) {
      console.error("Error updating profile image:", error);
      toast.error("Couldn't update your photo. Try again?");
    }
  };

  return (
    <>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/3 flex flex-col items-center">
          <div className="flex flex-col items-center space-y-4 my-auto">
            <button
              className="relative group cursor-pointer"
              type="button"
              onClick={() => setIsDialogOpen(true)}
            >
              <Avatar className="size-32 border-2 border-border rounded-full">
                {userImage ? (
                  <AvatarImage
                    src={userImage}
                    alt={userData?.name || "Profile"}
                    className="rounded-full"
                  />
                ) : (
                  <AvatarFallback className="text-2xl rounded-full">
                    {userData?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex flex-col items-center text-white">
                  <Camera className="size-6" />
                  <span className="text-xs mt-1">Upload</span>
                </div>
              </div>
            </button>
            <p className="text-center text-sm text-muted-foreground text-balance mx-5">
              Click on the image to upload a new one
            </p>
          </div>
        </div>

        <div className="w-full md:w-2/3">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col h-full"
            >
              <div className="space-y-6 flex-grow">
                <div className="flex flex-row gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="w-2/3">
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem className="w-1/3">
                        <FormLabel>Gender</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {gender_options.map((option, index) => (
                              <SelectItem
                                key={option}
                                value={genderValues[index]}
                              >
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input disabled value={userData?.email || ""} />
                  <p className="text-xs text-muted-foreground">
                    Email is linked to your Google account and cannot be
                    changed.
                  </p>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="mt-6 w-full"
              >
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Form>
        </div>
      </div>

      <ImageUploadDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onImageUploaded={handleImageUploaded}
      />
    </>
  );
}
