import type { BillingLimits, PlanId } from "@/lib/constants/pricing";

export type BillingCapability =
  | "contact:create"
  | "contact:mutate"
  | "automation:create"
  | "automation:mutate"
  | "sidekick:chat"
  | "sidekick:send";

export type BillingLimitErrorCode =
  | "BILLING_STRUCTURALLY_FROZEN"
  | "BILLING_CONTACT_LIMIT_REACHED"
  | "BILLING_NEW_CONTACT_LIMIT_REACHED"
  | "BILLING_AUTOMATION_LIMIT_REACHED"
  | "BILLING_SIDEKICK_SEND_LIMIT_REACHED"
  | "BILLING_SIDEKICK_CHAT_LIMIT_REACHED";

export interface BillingUsage {
  contactsTotal: number;
  newContactsThisMonth: number;
  automationsTotal: number;
  sidekickSendsThisMonth: number;
  sidekickChatPromptsThisMonth: number;
}

export interface BillingFlags {
  isStructurallyFrozen: boolean;
  canCreateContact: boolean;
  canMutateContacts: boolean;
  canCreateAutomation: boolean;
  canMutateAutomations: boolean;
  canUseSidekickChat: boolean;
  canSendSidekickReply: boolean;
}

export interface BillingStatus {
  planId: PlanId;
  limits: BillingLimits;
  usage: BillingUsage;
  flags: BillingFlags;
}

export interface BillingViolation {
  code: BillingLimitErrorCode;
  message: string;
}
