import { Skeleton } from "./ui/skeleton";
import { Suspense } from "react";
import { authClient } from "@/lib/auth-client";

const PRODUCT_IDS = {
  Starter: [
    "89404de5-5d64-45fd-872d-d5969cf059ce",
    "640c8f73-66dd-43ab-83a3-ecf6e01bf01e",
  ],
  Premium: [
    "b1b9e32b-9417-4e99-8142-11ee6ce45bdc",
    "a9ad37ae-90cd-4c2e-8fd6-88a430f8afb6",
  ],
};

function getSubscriptionNameByProductId(productId: string): string {
  for (const [plan, ids] of Object.entries(PRODUCT_IDS)) {
    if (ids.includes(productId)) {
      return plan;
    }
  }
  return productId;
}

export async function getSubscriptionData() {
  try {
    const { data: customerState } = await authClient.customer.state();

    if (
      customerState &&
      customerState.activeSubscriptions &&
      customerState.activeSubscriptions.length > 0
    ) {
      const subscription = customerState.activeSubscriptions[0];
      const planName = getSubscriptionNameByProductId(subscription.productId);
      return planName;
    }

    return "Free";
  } catch {
    return "Free";
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
  const subscription = getSubscriptionData();

  if (!subscription) return null;

  return (
    <div className="mb-4 flex justify-center">
      <span className="rounded-full bg-primary/10 px-4 py-1 text-primary font-medium text-sm">
        Current Subscription: {subscription}
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