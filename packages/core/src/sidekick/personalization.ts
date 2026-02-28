import {
  user,
  userFaq,
  userOffer,
  userOfferLink,
  userToneProfile,
} from "@pilot/db/schema";
import type { Offer, UserPersonalizationData } from "@pilot/types/user";
import { eq } from "drizzle-orm";

export const DEFAULT_SIDEKICK_PROMPT =
  "You are a friendly, professional assistant focused on qualifying leads and helping with business inquiries.";

const PROMPTS = {
  LEAD_ANALYSIS: {
    SYSTEM:
      "You are a lead qualification expert analyzing Instagram conversations. Always respond with valid JSON containing the requested fields: stage, sentiment, leadScore, nextAction, and leadValue. Never include explanations or additional text outside of the JSON object.",
    MAIN: `You are a lead qualification expert for {businessName}, a {businessType} business that {mainOffering}.\n\nBusiness Context:\n- Business Type: {businessType}\n- Main Offering: {mainOffering}\n- Use Cases: {useCases}\n- Target Goals: {pilotGoals}\n- Lead Volume: {leadsPerMonth} leads per month\n\nAnalyze this Instagram conversation between {businessName} and a potential customer:\n\n{conversationHistory}\n\nBased on this conversation, provide the following information in JSON format:\n1. stage: The stage of the lead ("new", "lead", "follow-up", or "ghosted")\n2. sentiment: The customer sentiment ("hot", "warm", "cold", "neutral", or "ghosted")\n3. leadScore: A numerical score from 0-100 indicating lead quality\n4. nextAction: A brief recommendation for the next action to take with this lead\n5. leadValue: A numerical estimate (0-1000) of the potential value of this lead\n\nReturn ONLY valid JSON with these fields and nothing else.`,
  },
  FOLLOW_UP: {
    SYSTEM:
      "You draft Instagram DM follow-ups on behalf of the business owner. Write in first person as the user, mirroring their style. Never introduce yourself or mention being an assistant or Sidekick. Rely entirely on the provided business context and conversation history.",
    MAIN: `You are Sidekick, a business assistant for {businessName}. Generate a follow-up message for this customer who hasn't responded in over 24 hours.\n\nBusiness Context:\n- Business: {businessName}\n- Type: {businessType}\n- Main Offering: {mainOffering}\n- Tone Style: {toneStyle}\n\nCustomer: {customerName}\nCurrent Stage: {stage}\nLead Score: {leadScore}\nLast Message: {lastMessage}\n\nConversation History:\n{conversationHistory}\n\nGenerate a friendly, professional follow-up message that:\n1. Acknowledges the previous conversation\n2. Shows genuine interest in helping them\n3. Provides a clear next step or call to action\n4. Keeps it under 280 characters\n5. Maintains the relationship without being pushy\n6. Matches the business tone: {toneStyle}\n7. Write in first person as the business owner ("I"), not as an assistant\n8. Do not introduce yourself or say "I'm Sidekick" or similar\n\nMessage:`,
  },
  AUTO_REPLY: {
    SYSTEM:
      "You draft Instagram DM replies on behalf of the business owner. Always write in first person as the user and match their tone. Never introduce yourself or state that you are an assistant or Sidekick. Use the full provided context and conversation history to respond.",
    MAIN: `You are Sidekick, a business assistant for {businessName}. Continue the conversation with the customer in 1-2 short sentences. Be helpful, friendly, and guide toward the next step. Keep it under 280 characters.\n\nBusiness Context:\n- Business: {businessName}\n- Type: {businessType}\n- Main Offering: {mainOffering}\n- Tone Style: {toneStyle}\n\nConversation so far:\n{conversationContext}\n\nRespond in the tone style: {toneStyle}. Write in first person as the business owner ("I"), not as an assistant. Do not introduce yourself or say "I'm Sidekick" or similar.`,
  },
} as const;

export async function getPersonalizedSidekickDataByUserId(
  dbClient: any,
  userId: string,
) {
  try {
    const userData = await dbClient
      .select({
        name: user.name,
        main_offering: user.main_offering,
        use_case: user.use_case,
        business_type: user.business_type,
        leads_per_month: user.leads_per_month,
        active_platforms: user.active_platforms,
        pilot_goal: user.pilot_goal,
        current_tracking: user.current_tracking,
      })
      .from(user)
      .where(eq(user.id, userId))
      .then((rows: Array<Record<string, unknown>>) => rows[0]);

    const links = await dbClient
      .select()
      .from(userOfferLink)
      .where(eq(userOfferLink.userId, userId));
    const offers = await dbClient
      .select()
      .from(userOffer)
      .where(eq(userOffer.userId, userId));
    const toneProfiles = await dbClient
      .select()
      .from(userToneProfile)
      .where(eq(userToneProfile.userId, userId))
      .limit(1);
    const faqs = await dbClient
      .select()
      .from(userFaq)
      .where(eq(userFaq.userId, userId));

    if (!userData) {
      return { success: false, error: "User not found" } as const;
    }

    return {
      success: true,
      data: {
        user: userData,
        offerLinks: links,
        offers,
        toneProfile: toneProfiles[0] || null,
        faqs,
      },
    } as const;
  } catch (error) {
    console.error("Error fetching personalized sidekick data:", error);
    return {
      success: false,
      error: "Failed to fetch personalized sidekick data",
    } as const;
  }
}

function formatPrompt(
  promptTemplate: string,
  variables: Record<string, string | number>,
) {
  let formattedPrompt = promptTemplate;

  for (const [key, value] of Object.entries(variables)) {
    formattedPrompt = formattedPrompt.split(`{${key}}`).join(String(value));
  }

  return formattedPrompt;
}

function formatPersonalizedPrompt(
  promptTemplate: string,
  userData: UserPersonalizationData & Record<string, unknown>,
) {
  const variables: Record<string, string | number> = {
    businessName: userData.user?.name || "the business",
    businessType: userData.user?.business_type || "business",
    mainOffering: userData.user?.main_offering || "provides services",
    useCases: Array.isArray(userData.user?.use_case)
      ? userData.user.use_case.join(", ")
      : userData.user?.use_case || "various use cases",
    pilotGoals: Array.isArray(userData.user?.pilot_goal)
      ? userData.user.pilot_goal.join(", ")
      : userData.user?.pilot_goal || "business goals",
    leadsPerMonth: userData.user?.leads_per_month || "multiple",
    activePlatforms: Array.isArray(userData.user?.active_platforms)
      ? userData.user.active_platforms.join(", ")
      : userData.user?.active_platforms || "various platforms",
    currentTracking: Array.isArray(userData.user?.current_tracking)
      ? userData.user.current_tracking.join(", ")
      : userData.user?.current_tracking || "various methods",
    toneStyle: userData.toneProfile?.toneType || "professional",
    currentOffers:
      userData.offers
        ?.map((offer: Offer) => `${offer.name}: ${offer.content}`)
        .join("; ") || "various offers",
  };

  return formatPrompt(promptTemplate, variables);
}

async function getPersonalizedSidekickPrompt(params: {
  dbClient: any;
  promptType: keyof typeof PROMPTS;
  additionalVariables?: Record<string, string>;
  userId: string;
}) {
  const result = await getPersonalizedSidekickDataByUserId(
    params.dbClient,
    params.userId,
  );

  if (!result.success) {
    throw new Error(result.error || "Failed to fetch personalized data");
  }

  let finalPrompt = formatPersonalizedPrompt(
    PROMPTS[params.promptType].MAIN,
    result.data,
  );
  let finalSystem = formatPersonalizedPrompt(
    PROMPTS[params.promptType].SYSTEM,
    result.data,
  );

  for (const [key, value] of Object.entries(params.additionalVariables || {})) {
    finalPrompt = finalPrompt.split(`{${key}}`).join(value);
    finalSystem = finalSystem.split(`{${key}}`).join(value);
  }

  return {
    system: finalSystem,
    main: finalPrompt,
  };
}

export function getPersonalizedLeadAnalysisPrompt(
  dbClient: any,
  conversationHistory: string,
  userId: string,
) {
  return getPersonalizedSidekickPrompt({
    dbClient,
    promptType: "LEAD_ANALYSIS",
    additionalVariables: { conversationHistory },
    userId,
  });
}

export function getPersonalizedFollowUpPrompt(
  dbClient: any,
  params: {
    userId: string;
    customerName: string;
    stage: string;
    leadScore: number;
    lastMessage: string;
    conversationHistory: string;
  },
) {
  return getPersonalizedSidekickPrompt({
    dbClient,
    promptType: "FOLLOW_UP",
    additionalVariables: {
      customerName: params.customerName,
      stage: params.stage,
      leadScore: params.leadScore.toString(),
      lastMessage: params.lastMessage,
      conversationHistory: params.conversationHistory,
    },
    userId: params.userId,
  });
}

export function getPersonalizedAutoReplyPrompt(
  dbClient: any,
  conversationContext: string,
  userId: string,
) {
  return getPersonalizedSidekickPrompt({
    dbClient,
    promptType: "AUTO_REPLY",
    additionalVariables: { conversationContext },
    userId,
  });
}
