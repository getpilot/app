"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  Card,
  CardContent,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/ui/stepper";
import { StepButtons } from "@/components/step-buttons";
import { Button } from "@/components/ui/button";

import {
  sidekickSteps,
  tone_options,
} from "@/lib/constants/sidekick-onboarding";
import { 
  saveSidekickOffer, 
  saveSidekickToneProfile, 
  completeSidekickOnboarding, 
  saveSidekickOfferLink
} from "@/actions/sidekick/onboarding";

const step0Schema = z.object({
  primaryOfferUrl: z.string().url({ message: "Please enter a valid URL" }),
  calendarLink: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal('')),
  additionalInfoUrl: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal('')),
});

const step1Schema = z.object({
  offerName: z.string().min(1, { message: "Please enter an offer name" }),
  offerContent: z.string().min(1, { message: "Please enter offer content" }),
  offerValue: z.string().optional(),
});

const step2Schema = z.object({
  sellDescription: z.string().min(1, { message: "Please describe what you sell" }),
});

const step3Schema = z.object({
  toneType: z.string().min(1, { message: "Please select a tone" }),
  customTone: z.string().optional(),
  sampleMessages: z.string().optional(),
});

type step0FormValues = z.infer<typeof step0Schema>;
type step1FormValues = z.infer<typeof step1Schema>;
type step2FormValues = z.infer<typeof step2Schema>;
type step3FormValues = z.infer<typeof step3Schema>;

export default function SidekickOnboardingPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [offers, setOffers] = useState<Array<{name: string; content: string; value?: number}>>([]);
  const [stepValidationState, setStepValidationState] = useState<Record<number, boolean>>({
    0: false,
    1: false,
    2: false,
    3: false,
  });

  const step0Form = useForm<step0FormValues>({
    resolver: zodResolver(step0Schema),
    defaultValues: {
      primaryOfferUrl: '',
      calendarLink: '',
      additionalInfoUrl: '',
    },
  });

  const step1Form = useForm<step1FormValues>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      offerName: '',
      offerContent: '',
      offerValue: '',
    },
  });

  const step2Form = useForm<step2FormValues>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      sellDescription: '',
    },
  });

  const step3Form = useForm<step3FormValues>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      toneType: '',
      customTone: '',
      sampleMessages: '',
    },
  });

  const handleStep0Submit = async () => {
    try {
      setIsLoading(true);
      
      const values = step0Form.getValues();
      
      const primaryResult = await saveSidekickOfferLink({
        type: "primary",
        url: values.primaryOfferUrl,
      });
      
      if (!primaryResult.success) {
        toast.error(primaryResult.error || "Failed to save primary offer link");
        return;
      }
      
      if (values.calendarLink) {
        const calendarResult = await saveSidekickOfferLink({
          type: "calendar",
          url: values.calendarLink,
        });
        
        if (!calendarResult.success) {
          toast.error(calendarResult.error || "Failed to save calendar link");
          return;
        }
      }
      
      if (values.additionalInfoUrl) {
        const additionalResult = await saveSidekickOfferLink({
          type: "website",
          url: values.additionalInfoUrl,
        });
        
        if (!additionalResult.success) {
          toast.error(additionalResult.error || "Failed to save additional info URL");
          return;
        }
      }
      
      setStepValidationState(prevState => ({ ...prevState, 0: true }));
      setActiveStep(1);
      toast.success("Offer links saved successfully!");
    } catch (error) {
      console.error("Error submitting step 0:", error);
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep1Submit = async (values: step1FormValues) => {
    try {
      setIsLoading(true);
      
      const newOffer = {
        name: values.offerName,
        content: values.offerContent,
        value: values.offerValue ? parseInt(values.offerValue) : undefined,
      };
      
      const result = await saveSidekickOffer(newOffer);
      
      if (!result.success) {
        toast.error(result.error || "Failed to save your offer. Please try again.");
        return;
      }
      
      setOffers([...offers, newOffer]);
      step1Form.reset({
        offerName: '',
        offerContent: '',
        offerValue: '',
      });
      
      setStepValidationState(prevState => ({ ...prevState, 1: true }));
      setActiveStep(2);
      toast.success("Offer saved successfully!");
    } catch (error) {
      console.error("Error submitting step 1:", error);
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Submit = async (values: step2FormValues) => {
    try {
      setIsLoading(true);
      const newOffer = {
        name: "Main Offer",
        content: values.sellDescription,
      };
      
      const result = await saveSidekickOffer(newOffer);
      
      if (!result.success) {
        toast.error(result.error || "Failed to save your offer description. Please try again.");
        return;
      }
      
      setStepValidationState(prevState => ({ ...prevState, 2: true }));
      setActiveStep(3);
      toast.success("Offer description saved successfully!");
    } catch (error) {
      console.error("Error submitting step 2:", error);
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep3Submit = async (values: step3FormValues) => {
    try {
      setIsLoading(true);
      
      let toneType: "friendly" | "direct" | "like_me" | "custom";
      switch (values.toneType) {
        case "Chill & Friendly":
          toneType = "friendly";
          break;
        case "Confident & Direct":
          toneType = "direct";
          break;
        case "Like Me":
          toneType = "like_me";
          break;
        case "Custom":
          toneType = "custom";
          break;
        default:
          toneType = "friendly";
      }
      
      let sampleText: string[] = [];
      if (toneType === "like_me" && values.sampleMessages) {
        sampleText = values.sampleMessages.split('\n').filter(line => line.trim() !== '');
      } else if (toneType === "custom" && values.customTone) {
        sampleText = [values.customTone];
      }
      
      const result = await saveSidekickToneProfile({
        toneType,
        sampleText: sampleText.length > 0 ? sampleText : undefined,
      });
      
      if (!result.success) {
        toast.error(result.error || "Failed to save your tone preferences. Please try again.");
        return;
      }
      
      const completeResult = await completeSidekickOnboarding();
      if (!completeResult.success) {
        toast.error(completeResult.error || "Failed to complete onboarding. Please try again.");
        return;
      }
      
      setStepValidationState(prevState => ({ ...prevState, 3: true }));
      toast.success("Setup complete! Redirecting to dashboard...");
      router.push("/");
    } catch (error) {
      console.error("Error submitting step 3:", error);
      toast.error("Something went wrong. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
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
        <CardContent className="space-y-6 pt-6">
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
            {sidekickSteps.map((step, index) => (
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
                {index < sidekickSteps.length - 1 && (
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
                  <h2 className="text-xl font-semibold">
                    Your Offer Links
                  </h2>
                  
                  <p className="text-muted-foreground">
                    Provide links where Sidekick can pull offer details from.
                  </p>

                  <FormField
                    control={step0Form.control}
                    name="primaryOfferUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Offer Page (required)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://" {...field} />
                        </FormControl>
                        <FormDescription>
                          The main page where your offer is described.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={step0Form.control}
                    name="calendarLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Calendar Link (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://" {...field} />
                        </FormControl>
                        <FormDescription>
                          Your booking or calendar link.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={step0Form.control}
                    name="additionalInfoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Info URL (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://" {...field} />
                        </FormControl>
                        <FormDescription>
                          Notion, website, or other resource with additional information.
                        </FormDescription>
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
                  <h2 className="text-xl font-semibold">
                    Your Offers
                  </h2>
                  
                  <p className="text-muted-foreground">
                    Add your offers. Sidekick will use these for Smart Replies and lead scoring.
                  </p>

                  {offers.length > 0 && (
                    <div className="border rounded-lg p-4 space-y-3">
                      <h3 className="font-medium">Your Offers</h3>
                      <div className="space-y-2">
                        {offers.map((offer, index) => (
                          <div key={index} className="border rounded p-3 flex justify-between items-center">
                            <div>
                              <p className="font-medium">{offer.name}</p>
                              <p className="text-sm text-muted-foreground truncate max-w-md">{offer.content}</p>
                            </div>
                            {offer.value && <p className="font-medium">${offer.value}</p>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <FormField
                    control={step1Form.control}
                    name="offerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Offer Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Basic Package" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={step1Form.control}
                    name="offerContent"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Offer Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description of what's included" 
                            {...field} 
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={step1Form.control}
                    name="offerValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Value ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="e.g., 997" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={handleBack}>
                      Back
                    </Button>
                    <div className="space-x-2">
                      {offers.length > 0 && (
                        <Button 
                          type="button" 
                          variant="default" 
                          onClick={() => {
                            setActiveStep(2);
                          }}
                        >
                          Next
                        </Button>
                      )}
                      <Button type="submit" disabled={isLoading}>
                        {isLoading ? "Saving..." : "Add Offer"}
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            )}

            {activeStep === 2 && (
              <Form {...step2Form}>
                <form
                  onSubmit={step2Form.handleSubmit(handleStep2Submit)}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold">
                    What Do You Sell?
                  </h2>
                  
                  <p className="text-muted-foreground">
                    Describe your main offering in a few sentences.
                  </p>

                  <FormField
                    control={step2Form.control}
                    name="sellDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Offering</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="e.g., 8-week cohort-based course for SaaS founders on monetization" 
                            {...field} 
                            rows={4}
                          />
                        </FormControl>
                        <FormDescription>
                          This helps Sidekick understand your business context.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <StepButtons onBack={handleBack} isLoading={isLoading} />
                </form>
              </Form>
            )}

            {activeStep === 3 && (
              <Form {...step3Form}>
                <form
                  onSubmit={step3Form.handleSubmit(handleStep3Submit)}
                  className="space-y-6"
                >
                  <h2 className="text-xl font-semibold">
                    Set Sidekick&apos;s Tone
                  </h2>
                  
                  <p className="text-muted-foreground">
                    How should Sidekick sound when talking to your leads?
                  </p>

                  <FormField
                    control={step3Form.control}
                    name="toneType"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Tone Style</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                          >
                            {tone_options.map((option) => (
                              <FormItem key={option} className="flex items-center space-x-1 space-y-0">
                                <FormControl>
                                  <RadioGroupItem
                                    value={option}
                                    id={`tone-${option}`}
                                    className="sr-only"
                                  />
                                </FormControl>
                                <FormLabel
                                  htmlFor={`tone-${option}`}
                                  className={`border rounded-lg p-3 w-full flex items-center gap-2 cursor-pointer transition-all ${
                                    field.value === option
                                      ? "border-primary bg-primary/10"
                                      : "border-border hover:border-muted-foreground"
                                  }`}
                                >
                                  <div
                                    className={`w-4 h-4 rounded-full border ${
                                      field.value === option
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

                  {step3Form.watch("toneType") === "Custom" && (
                    <FormField
                      control={step3Form.control}
                      name="customTone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custom Tone Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe how you want Sidekick to sound" 
                              {...field} 
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {step3Form.watch("toneType") === "Like Me" && (
                    <FormField
                      control={step3Form.control}
                      name="sampleMessages"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sample Messages</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Paste 3-5 example messages that show your tone" 
                              {...field} 
                              rows={5}
                            />
                          </FormControl>
                          <FormDescription>
                            Paste a few messages that demonstrate your typical communication style.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <StepButtons onBack={handleBack} isLoading={isLoading} />
                </form>
              </Form>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}