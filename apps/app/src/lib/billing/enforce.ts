import { getPricingPlan } from "@/lib/constants/pricing";
import { getCurrentPlan } from "@/lib/billing/plan";
import { getCurrentUsage } from "@/lib/billing/usage";
import type {
  BillingCapability,
  BillingFlags,
  BillingStatus,
  BillingUsage,
  BillingViolation,
} from "@/lib/billing/types";

export class BillingLimitError extends Error {
  constructor(
    public readonly code: BillingViolation["code"],
    message: string,
  ) {
    super(message);
    this.name = "BillingLimitError";
  }
}

function isAtLimit(current: number, limit: number | null): boolean {
  return limit !== null && current >= limit;
}

function isOverLimit(current: number, limit: number | null): boolean {
  return limit !== null && current > limit;
}

function buildFlags(usage: BillingUsage, limits: BillingStatus["limits"]): BillingFlags {
  const isStructurallyFrozen =
    isOverLimit(usage.contactsTotal, limits.maxContactsTotal) ||
    isOverLimit(usage.automationsTotal, limits.maxAutomations);

  return {
    isStructurallyFrozen,
    canCreateContact:
      !isStructurallyFrozen &&
      !isAtLimit(usage.contactsTotal, limits.maxContactsTotal) &&
      !isAtLimit(usage.newContactsThisMonth, limits.maxNewContactsPerMonth),
    canMutateContacts: !isStructurallyFrozen,
    canCreateAutomation:
      !isStructurallyFrozen &&
      !isAtLimit(usage.automationsTotal, limits.maxAutomations),
    canMutateAutomations: !isStructurallyFrozen,
    canUseSidekickChat:
      !isStructurallyFrozen &&
      !isAtLimit(
        usage.sidekickChatPromptsThisMonth,
        limits.maxSidekickChatPromptsPerMonth,
      ),
    canSendSidekickReply:
      !isStructurallyFrozen &&
      !isAtLimit(usage.sidekickSendsThisMonth, limits.maxSidekickSendsPerMonth),
  };
}

export function getContactCreationViolation(
  status: BillingStatus,
): BillingViolation | null {
  if (status.flags.isStructurallyFrozen) {
    return {
      code: "BILLING_STRUCTURALLY_FROZEN",
      message:
        "Your workspace is frozen because it is above the current plan cap. Existing data is still visible, but changes are blocked until you upgrade or reduce usage.",
    };
  }

  if (isAtLimit(status.usage.contactsTotal, status.limits.maxContactsTotal)) {
    return {
      code: "BILLING_CONTACT_LIMIT_REACHED",
      message:
        "You have reached the maximum total contacts for your current plan.",
    };
  }

  if (
    isAtLimit(
      status.usage.newContactsThisMonth,
      status.limits.maxNewContactsPerMonth,
    )
  ) {
    return {
      code: "BILLING_NEW_CONTACT_LIMIT_REACHED",
      message:
        "You have reached the monthly new contact limit for your current plan.",
    };
  }

  return null;
}

export function getAutomationCreationViolation(
  status: BillingStatus,
): BillingViolation | null {
  if (status.flags.isStructurallyFrozen) {
    return {
      code: "BILLING_STRUCTURALLY_FROZEN",
      message:
        "Your workspace is frozen because it is above the current plan cap. Existing data is still visible, but changes are blocked until you upgrade or reduce usage.",
    };
  }

  if (isAtLimit(status.usage.automationsTotal, status.limits.maxAutomations)) {
    return {
      code: "BILLING_AUTOMATION_LIMIT_REACHED",
      message:
        "You have reached the maximum number of automations for your current plan.",
    };
  }

  return null;
}

export function getBillingViolation(
  status: BillingStatus,
  capability: BillingCapability,
): BillingViolation | null {
  switch (capability) {
    case "contact:create":
      return getContactCreationViolation(status);
    case "contact:mutate":
      return status.flags.canMutateContacts
        ? null
        : {
            code: "BILLING_STRUCTURALLY_FROZEN",
            message:
              "Your workspace is frozen because it is above the current plan cap. Existing data is still visible, but changes are blocked until you upgrade or reduce usage.",
          };
    case "automation:create":
      return getAutomationCreationViolation(status);
    case "automation:mutate":
      return status.flags.canMutateAutomations
        ? null
        : {
            code: "BILLING_STRUCTURALLY_FROZEN",
            message:
              "Your workspace is frozen because it is above the current plan cap. Existing data is still visible, but changes are blocked until you upgrade or reduce usage.",
          };
    case "sidekick:chat":
      if (status.flags.isStructurallyFrozen) {
        return {
          code: "BILLING_STRUCTURALLY_FROZEN",
          message:
            "Your workspace is frozen because it is above the current plan cap. Existing data is still visible, but changes are blocked until you upgrade or reduce usage.",
        };
      }
      return status.flags.canUseSidekickChat
        ? null
        : {
            code: "BILLING_SIDEKICK_CHAT_LIMIT_REACHED",
            message:
              "You have reached the monthly Sidekick chat limit for your current plan.",
          };
    case "sidekick:send":
      if (status.flags.isStructurallyFrozen) {
        return {
          code: "BILLING_STRUCTURALLY_FROZEN",
          message:
            "Your workspace is frozen because it is above the current plan cap. Existing data is still visible, but changes are blocked until you upgrade or reduce usage.",
        };
      }
      return status.flags.canSendSidekickReply
        ? null
        : {
            code: "BILLING_SIDEKICK_SEND_LIMIT_REACHED",
            message:
              "You have reached the monthly Sidekick send limit for your current plan.",
          };
    default:
      return null;
  }
}

export async function getBillingStatus(
  userId: string,
  now: Date = new Date(),
): Promise<BillingStatus> {
  const planId = await getCurrentPlan(userId);
  const plan = getPricingPlan(planId);
  const usage = await getCurrentUsage(userId, now);

  return {
    planId,
    limits: plan.limits,
    usage,
    flags: buildFlags(usage, plan.limits),
  };
}

export async function assertBillingAllowed(
  userId: string,
  capability: BillingCapability,
): Promise<BillingStatus> {
  const status = await getBillingStatus(userId);
  const violation = getBillingViolation(status, capability);

  if (violation) {
    throw new BillingLimitError(violation.code, violation.message);
  }

  return status;
}
