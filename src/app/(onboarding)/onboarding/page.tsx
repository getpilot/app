"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/ui/stepper";
import { StepButtons } from "@/components/step-buttons";
import { Checkbox } from "@/components/ui/checkbox";

import {
  steps,
  gender_options,
  use_case_options,
  leads_per_month_options,
  active_platforms_options,
  business_type_options,
  pilot_goal_options,
  current_tracking_options,
} from "@/lib/constants/onboarding";
import {
  updateOnboardingStep,
  completeOnboarding,
  checkOnboardingStatus,
  getUserData,
} from "@/actions/onboarding";
import { optionToValue } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import type { UseFormReturn } from "react-hook-form";

const step0Schema = z.object({
  name: z.string().min(1, { message: "Please enter your name" }),
  gender: z.string().min(1, { message: "Please select your gender" }),
});

const step1Schema = z.object({
  use_case: z
    .array(z.string())
    .min(1, { message: "Please select at least one use case" }),
  other_use_case: z.string().optional(),
  leads_per_month: z.string().min(1, { message: "Please select an option" }),
  active_platforms: z
    .array(z.string())
    .min(1, { message: "Please select at least one platform" }),
  other_platform: z.string().optional(),
});

const step2Schema = z.object({
  business_type: z
    .string()
    .min(1, { message: "Please select a business type" }),
  other_business_type: z.string().optional(),
  pilot_goal: z
    .array(z.string())
    .min(1, { message: "Please select at least one goal" }),
  current_tracking: z
    .array(z.string())
    .min(1, { message: "Please select at least one tracking method" }),
  other_tracking: z.string().optional(),
});

type Step0FormValues = z.infer<typeof step0Schema>;
type Step1FormValues = z.infer<typeof step1Schema>;
type Step2FormValues = z.infer<typeof step2Schema>;

async function checkOnboardingStatusAndPrefill(
  router: { replace: (url: string) => void },
  step0Form: UseFormReturn<Step0FormValues>,
  step1Form: UseFormReturn<Step1FormValues>,
  step2Form: UseFormReturn<Step2FormValues>,
  setStepValidationState: React.Dispatch<React.SetStateAction<Record<number, boolean>>>,
  setIsInitializing: (v: boolean) => void
) {
  try {
    const status = await checkOnboardingStatus();
    if (status.onboarding_complete) {
      router.replace("/");
    }

    const userDataResult = await getUserData();
    if (userDataResult.success && userDataResult.userData) {
      if (userDataResult.userData.name) {
        step0Form.setValue("name", userDataResult.userData.name);
      }
      if (userDataResult.userData.gender) {
        step0Form.setValue("gender", userDataResult.userData.gender);
      }

      if (userDataResult.userData.use_case) {
        step1Form.setValue("use_case", userDataResult.userData.use_case);
      }
      if (userDataResult.userData.other_use_case) {
        step1Form.setValue(
          "other_use_case",
          userDataResult.userData.other_use_case
        );
      }
      if (userDataResult.userData.leads_per_month) {
        step1Form.setValue(
          "leads_per_month",
          userDataResult.userData.leads_per_month
        );
      }
      if (userDataResult.userData.active_platforms) {
        step1Form.setValue(
          "active_platforms",
          userDataResult.userData.active_platforms
        );
      }
      if (userDataResult.userData.other_platform) {
        step1Form.setValue(
          "other_platform",
          userDataResult.userData.other_platform
        );
      }

      if (userDataResult.userData.business_type) {
        step2Form.setValue(
          "business_type",
          userDataResult.userData.business_type
        );
      }
      if (userDataResult.userData.other_business_type) {
        step2Form.setValue(
          "other_business_type",
          userDataResult.userData.other_business_type
        );
      }
      if (userDataResult.userData.pilot_goal) {
        step2Form.setValue(
          "pilot_goal",
          userDataResult.userData.pilot_goal
        );
      }
      if (userDataResult.userData.current_tracking) {
        step2Form.setValue(
          "current_tracking",
          userDataResult.userData.current_tracking
        );
      }
      if (userDataResult.userData.other_tracking) {
        step2Form.setValue(
          "other_tracking",
          userDataResult.userData.other_tracking
        );
      }

      const step0Valid =
        !!userDataResult.userData.name && !!userDataResult.userData.gender;
      const step1Valid =
        !!userDataResult.userData.use_case?.length &&
        !!userDataResult.userData.leads_per_month &&
        !!userDataResult.userData.active_platforms?.length;
      const step2Valid =
        !!userDataResult.userData.business_type &&
        !!userDataResult.userData.pilot_goal?.length &&
        !!userDataResult.userData.current_tracking?.length;

      setStepValidationState({
        0: step0Valid,
        1: step1Valid,
        2: step2Valid,
      });
    }
  } catch (error) {
    console.error("Error checking onboarding status:", error);
  } finally {
    setIsInitializing(false);
  }
}

async function submitStep0Action(
  values: Step0FormValues,
  setIsLoading: (v: boolean) => void,
  setStepValidationState: React.Dispatch<React.SetStateAction<Record<number, boolean>>>,
  onSuccess: () => void
) {
  try {
    setIsLoading(true);
    const result = await updateOnboardingStep(values);

    if (!result.success) {
      toast.error(
        result.error || "Oops! Couldn't save your info. Try again?"
      );
      return;
    }

    setStepValidationState((prevState) => ({ ...prevState, 0: true }));
    onSuccess();
    toast.success("Got it! Moving to the next step...");
  } catch (error) {
    console.error("Error submitting step 0:", error);
    toast.error("Hmm, something's not right. Give it another shot?");
  } finally {
    setIsLoading(false);
  }
}

async function submitStep1Action(
  values: Step1FormValues,
  setIsLoading: (v: boolean) => void,
  setStepValidationState: React.Dispatch<React.SetStateAction<Record<number, boolean>>>,
  onSuccess: () => void
) {
  try {
    setIsLoading(true);
    const result = await updateOnboardingStep(values);

    if (!result.success) {
      toast.error(
        result.error ||
        "Failed to save your usage preferences. Please try again."
      );
      return;
    }

    setStepValidationState((prevState) => ({ ...prevState, 1: true }));
    onSuccess();
    toast.success("Perfect! One more step to go...");
  } catch (error) {
    console.error("Error submitting step 1:", error);
    toast.error("Hmm, something's not right. Give it another shot?");
  } finally {
    setIsLoading(false);
  }
}

async function submitStep2Action(
  values: Step2FormValues,
  setIsLoading: (v: boolean) => void,
  setStepValidationState: React.Dispatch<React.SetStateAction<Record<number, boolean>>>,
  router: { push: (url: string) => void }
) {
  try {
    setIsLoading(true);
    const updateResult = await updateOnboardingStep(values);

    if (!updateResult.success) {
      toast.error(
        updateResult.error ||
        "Failed to save your business details. Please try again."
      );
      return;
    }

    setStepValidationState((prevState) => ({ ...prevState, 2: true }));

    const completeResult = await completeOnboarding();
    if (!completeResult.success) {
      toast.error(
        completeResult.error ||
        "Failed to complete onboarding. Please try again."
      );
      return;
    }

    toast.success("You're all set! Welcome to Pilot! 🚀");
    router.push("/");
  } catch (error) {
    console.error("Error submitting step 2:", error);
    toast.error("Hmm, something's not right. Give it another shot?");
  } finally {
    setIsLoading(false);
  }
}

export default function OnboardingPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [stepValidationState, setStepValidationState] = useState<
    Record<number, boolean>
  >({
    0: false,
    1: false,
    2: false,
  });

  const session = authClient.useSession();

  const userData = {
    name: session?.data?.user?.name || "",
    email: session?.data?.user?.email || "",
  };

  const step0Form = useForm<Step0FormValues>({
    resolver: zodResolver(step0Schema),
    defaultValues: {
      name: "",
      gender: "",
    },
  });

  const step1Form = useForm<Step1FormValues>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      use_case: [],
      other_use_case: "",
      leads_per_month: "",
      active_platforms: [],
      other_platform: "",
    },
  });

  const step2Form = useForm<Step2FormValues>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      business_type: "",
      other_business_type: "",
      pilot_goal: [],
      current_tracking: [],
      other_tracking: "",
    },
  });

  useEffect(() => {
    checkOnboardingStatusAndPrefill(router, step0Form, step1Form, step2Form, setStepValidationState, setIsInitializing);
  }, []); // intentionally run once on mount -- form refs and router are stable at init time

  const watchedUseCase = useWatch({ control: step1Form.control, name: "use_case" });
  const watchedActivePlatforms = useWatch({ control: step1Form.control, name: "active_platforms" });
  const watchedBusinessType = useWatch({ control: step2Form.control, name: "business_type" });
  const watchedCurrentTracking = useWatch({ control: step2Form.control, name: "current_tracking" });

  const handleStep0Submit = (values: Step0FormValues) =>
    submitStep0Action(values, setIsLoading, setStepValidationState, handleNext);

  const handleStep1Submit = (values: Step1FormValues) =>
    submitStep1Action(values, setIsLoading, setStepValidationState, handleNext);

  const handleStep2Submit = (values: Step2FormValues) =>
    submitStep2Action(values, setIsLoading, setStepValidationState, router);

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <section className="w-full max-w-5xl px-4 py-6 overflow-y-auto">
      <Card className="shadow-md border-border">
        <CardContent className="space-y-6">
          <Stepper
            value={activeStep}
            onValueChange={(newStep) => {
              if (newStep < activeStep) {
                setActiveStep(newStep);
                return;
              }

              if (newStep === activeStep + 1) {
                const isValid = stepValidationState[activeStep];
                if (isValid) {
                  setActiveStep(newStep);
                }
              }
            }}
            className="px-2 sm:px-6 py-2"
          >
            {steps.map((step, index) => (
              <StepperItem
                key={step.id}
                step={step.id}
                disabled={
                  step.id > activeStep + 1 ||
                  (step.id > activeStep && !stepValidationState[activeStep])
                }
                completed={activeStep > step.id}
                loading={isLoading && step.id === activeStep}
                className="relative flex-1 !flex-col"
              >
                <StepperTrigger className="flex-col gap-3">
                  <StepperIndicator />
                  <div className="space-y-0.5 px-2">
                    <StepperTitle>{step.name}</StepperTitle>
                  </div>
                </StepperTrigger>
                {index < steps.length - 1 && (
                  <StepperSeparator className="absolute inset-x-0 left-[calc(50%+0.75rem+0.750rem)] top-6 -order-1 m-0 -translate-y-1/2 group-data-[orientation=horizontal]/stepper:w-[calc(100%-1.5rem-0.25rem)] group-data-[orientation=horizontal]/stepper:flex-none" />
                )}
              </StepperItem>
            ))}
          </Stepper>

          <div className="border border-border p-6 rounded-xl shadow-sm">
            {activeStep === 0 && (
              <Form {...step0Form}>
                <form
                  onSubmit={step0Form.handleSubmit(handleStep0Submit)}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold font-heading">
                    Let&apos;s Get to Know You
                  </h2>

                  <FormField
                    control={step0Form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormDescription>
                          You can change this later in your profile settings.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input value={userData.email} disabled />
                    </FormControl>
                  </FormItem>

                  <FormField
                    control={step0Form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Gender</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                          >
                            {gender_options.map((option) => (
                              <FormItem
                                key={option}
                                className="flex items-center space-x-1 space-y-0"
                              >
                                <FormControl>
                                  <RadioGroupItem
                                    value={option}
                                    id={`gender-${option}`}
                                    className="sr-only"
                                  />
                                </FormControl>
                                <FormLabel
                                  htmlFor={`gender-${option}`}
                                  className={`border rounded-lg p-3 w-full flex items-center gap-2 cursor-pointer transition-all ${field.value === option
                                    ? "border-primary bg-primary/10"
                                    : "border-border hover:border-muted-foreground"
                                    }`}
                                >
                                  <div
                                    className={`size-4 rounded-full border ${field.value === option
                                      ? "border-4 border-primary"
                                      : "border border-muted-foreground"
                                      }`}
                                  ></div>
                                  <span>{option}</span>
                                </FormLabel>
                              </FormItem>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <StepButtons showBack={false} isLoading={isLoading} />
                </form>
              </Form>
            )}

            {activeStep === 1 && (
              <Form {...step1Form}>
                <form
                  onSubmit={step1Form.handleSubmit(handleStep1Submit)}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold font-heading">Pilot Usage</h2>

                  <FormField
                    control={step1Form.control}
                    name="use_case"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>What will you use Pilot for?</FormLabel>
                        <div className="space-y-2">
                          {use_case_options.map((option) => {
                            const value = optionToValue(option);
                            return (
                              <FormItem
                                key={value}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(value)}
                                    onCheckedChange={(checked) => {
                                      const updatedValue = checked
                                        ? [...field.value, value]
                                        : field.value.filter(
                                          (val) => val !== value
                                        );
                                      field.onChange(updatedValue);
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {option}
                                </FormLabel>
                              </FormItem>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchedUseCase?.includes("other") && (
                    <FormField
                      control={step1Form.control}
                      name="other_use_case"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Please specify other use case</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={step1Form.control}
                    name="leads_per_month"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>
                          How many leads do you expect per month?
                        </FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
                          >
                            {leads_per_month_options.map((option) => (
                              <FormItem
                                key={option}
                                className="flex items-center space-x-1 space-y-0"
                              >
                                <FormControl>
                                  <RadioGroupItem
                                    value={option}
                                    id={`leads-${option}`}
                                    className="sr-only"
                                  />
                                </FormControl>
                                <FormLabel
                                  htmlFor={`leads-${option}`}
                                  className={`border rounded-lg p-3 w-full flex items-center gap-2 cursor-pointer transition-all ${field.value === option
                                    ? "border-primary bg-primary/10"
                                    : "border-border hover:border-muted-foreground"
                                    }`}
                                >
                                  <div
                                    className={`size-4 rounded-full border ${field.value === option
                                      ? "border-4 border-primary"
                                      : "border border-muted-foreground"
                                      }`}
                                  ></div>
                                  <span>{option}</span>
                                </FormLabel>
                              </FormItem>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={step1Form.control}
                    name="active_platforms"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>
                          Which platforms are you active on?
                        </FormLabel>
                        <div className="space-y-2">
                          {active_platforms_options.map((option) => {
                            const value = optionToValue(option);
                            return (
                              <FormItem
                                key={value}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(value)}
                                    onCheckedChange={(checked) => {
                                      const updatedValue = checked
                                        ? [...field.value, value]
                                        : field.value.filter(
                                          (val) => val !== value
                                        );
                                      field.onChange(updatedValue);
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {option}
                                </FormLabel>
                              </FormItem>
                            );
                          })}
                        </div>
                        <FormDescription>
                          This helps us pre-optimize your inbox filters and
                          automations.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchedActivePlatforms?.includes("other") && (
                    <FormField
                      control={step1Form.control}
                      name="other_platform"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Please specify other platform</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <StepButtons isLoading={isLoading} onBack={handleBack} />
                </form>
              </Form>
            )}

            {activeStep === 2 && (
              <Form {...step2Form}>
                <form
                  onSubmit={step2Form.handleSubmit(handleStep2Submit)}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold font-heading">Business & Goals</h2>

                  <FormField
                    control={step2Form.control}
                    name="business_type"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>What type of business do you run?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                          >
                            {business_type_options.map((option) => {
                              const value = optionToValue(option);
                              return (
                                <FormItem
                                  key={value}
                                  className="flex items-center space-x-1 space-y-0"
                                >
                                  <FormControl>
                                    <RadioGroupItem
                                      value={value}
                                      id={`business-${value}`}
                                      className="sr-only"
                                    />
                                  </FormControl>
                                  <FormLabel
                                    htmlFor={`business-${value}`}
                                    className={`border rounded-lg p-3 w-full flex items-center gap-2 cursor-pointer transition-all ${field.value === value
                                      ? "border-primary bg-primary/10"
                                      : "border-border hover:border-muted-foreground"
                                      }`}
                                  >
                                    <div
                                      className={`size-4 rounded-full border ${field.value === value
                                        ? "border-4 border-primary"
                                        : "border border-muted-foreground"
                                        }`}
                                    ></div>
                                    <span>{option}</span>
                                  </FormLabel>
                                </FormItem>
                              );
                            })}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchedBusinessType === "other" && (
                    <FormField
                      control={step2Form.control}
                      name="other_business_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Please specify your business type
                          </FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={step2Form.control}
                    name="pilot_goal"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>What are your goals with Pilot?</FormLabel>
                        <div className="space-y-2">
                          {pilot_goal_options.map((option) => {
                            const value = optionToValue(option);
                            return (
                              <FormItem
                                key={value}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(value)}
                                    onCheckedChange={(checked) => {
                                      const updatedValue = checked
                                        ? [...field.value, value]
                                        : field.value.filter(
                                          (val) => val !== value
                                        );
                                      field.onChange(updatedValue);
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {option}
                                </FormLabel>
                              </FormItem>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={step2Form.control}
                    name="current_tracking"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>How do you currently track leads?</FormLabel>
                        <div className="space-y-2">
                          {current_tracking_options.map((option) => {
                            const value = optionToValue(option);
                            return (
                              <FormItem
                                key={value}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(value)}
                                    onCheckedChange={(checked) => {
                                      const updatedValue = checked
                                        ? [...field.value, value]
                                        : field.value.filter(
                                          (val) => val !== value
                                        );
                                      field.onChange(updatedValue);
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {option}
                                </FormLabel>
                              </FormItem>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchedCurrentTracking?.includes("other") && (
                    <FormField
                      control={step2Form.control}
                      name="other_tracking"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Please specify your tracking method
                          </FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <StepButtons
                    isLoading={isLoading}
                    onBack={handleBack}
                    submitLabel="Complete Setup"
                  />
                </form>
              </Form>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}