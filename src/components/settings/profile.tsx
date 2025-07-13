"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

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
import { updateUserSettings, UpdateUserFormData } from "@/actions/settings";
import { gender_options } from "@/lib/constants/onboarding";
import { optionToValue } from "@/lib/utils";

const genderValues = gender_options.map(option => optionToValue(option));
type GenderValue = typeof genderValues[number];

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  gender: z.enum(genderValues as [string, ...string[]]).optional(),
});

interface SettingsFormProps {
  userData: {
    id: string;
    name: string;
    email: string;
    gender: string | null;
  } | null;
}

export default function SettingsForm({ userData }: SettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  console.log(userData);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: userData?.name,
      email: userData?.email,
      gender: userData?.gender as GenderValue,
    },
  });

  useEffect(() => {
    if (userData) {
      form.reset({
        name: userData.name || "",
        email: userData.email || "",
        gender: userData.gender as GenderValue,
      });
    }
  }, [userData, form]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);

    try {
      const result = await updateUserSettings(data as UpdateUserFormData);
      
      if (result.success) {
        toast.success("Settings updated successfully");
      } else {
        toast.error(result.error || "Failed to update settings");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error("Settings update error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getGenderLabel = (value: string | undefined) => {
    if (!value) return "";
    const index = genderValues.findIndex(gv => gv === value);
    return index >= 0 ? gender_options[index] : "";
  };

  return (
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
                        <SelectValue placeholder="Select gender">
                          {getGenderLabel(field.value)}
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {gender_options.map((option, index) => (
                        <SelectItem key={option} value={genderValues[index]}>
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

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="your.email@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isLoading} className="mt-6 w-full">
          {isLoading ? "Updating..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
}