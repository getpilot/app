import { Skeleton } from "@pilot/ui/components/skeleton";
import { Suspense, useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import {
  getPricingPlan,
  resolvePlanIdFromProductId,
} from "@/lib/constants/pricing";

export async function getSubscriptionData() {
  try {
    const { data: customerState } = await authClient.customer.state();

    if (
      customerState &&
      customerState.activeSubscriptions &&
      customerState.activeSubscriptions.length > 0
    ) {
      const subscription = customerState.activeSubscriptions[0];
      const planId = resolvePlanIdFromProductId(subscription.productId);
      return getPricingPlan(planId).title;
    }

    return getPricingPlan("free").title;
  } catch {
    return getPricingPlan("free").title;
  }
}

function SubscriptionBadgeSkeleton() {
  return (
    <div className="mb-4 flex justify-center">
      <Skeleton className="h-6 w-32 rounded-full" />
    </div>
  );
}

function SubscriptionBadgeContent() {
  const [subscription, setSubscription] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    getSubscriptionData()
      .then(data => {
        setSubscription(data);
        setIsLoading(false);
      });
  }, []);
  
  if (isLoading) return <SubscriptionBadgeSkeleton />;
  if (!subscription) return null;

  return (
    <div className="mb-4 flex justify-center">
      <span className="rounded-full bg-primary/10 px-4 py-1 text-primary font-medium text-sm">
        Current plan: {subscription}
      </span>
    </div>
  );
}

export default function SubscriptionBadge() {
  return (
    <Suspense fallback={<SubscriptionBadgeSkeleton />}>
      <SubscriptionBadgeContent />
    </Suspense>
  );
}
