import {
  streamText,
  convertToModelMessages,
  smoothStream,
  stepCountIs,
  tool,
} from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { DEFAULT_SIDEKICK_PROMPT } from "@/lib/constants/sidekick";
import {
  getUserProfile,
  updateUserProfile,
} from "@/actions/sidekick/ai-tools/user-profile";
import {
  listUserOffers,
  createUserOffer,
  updateUserOffer,
  deleteUserOffer,
  listUserOfferLinks,
  addUserOfferLink,
} from "@/actions/sidekick/ai-tools/offers";
import {
  getToneProfile,
  updateToneProfile,
  addToneSample,
} from "@/actions/sidekick/ai-tools/tone-profile";
import {
  listFaqs,
  addFaq,
  updateFaq,
  deleteFaq,
} from "@/actions/sidekick/ai-tools/faqs";
import {
  getSidekickSettings,
  updateSystemPrompt,
} from "@/actions/sidekick/settings";
import {
  getActionLog,
  listActionLogs,
} from "@/actions/sidekick/ai-tools/actions";

export const maxDuration = 40;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const isDev = process.env.NODE_ENV !== "production";

  const system = isDev
    ? `${DEFAULT_SIDEKICK_PROMPT} You may answer general questions to help the user. Weather questions are allowed in development via the weather tool.`
    : `${DEFAULT_SIDEKICK_PROMPT} If a request is unrelated to Sidekick or this app (e.g., weather), briefly refuse and mention supported Sidekick tasks.`;

  const tools = {
    // user profile tools
    getUserProfile: tool({
      description:
        "Get the user's profile information including name, email, gender, use case, business type, and main offering",
      inputSchema: z.object({}),
      async execute() {
        return await getUserProfile();
      },
    }),
    updateUserProfile: tool({
      description: "Update the user's profile information",
      inputSchema: z.object({
        name: z.string().optional(),
        gender: z.string().optional(),
        use_case: z.array(z.string()).optional(),
        business_type: z.string().optional(),
        main_offering: z.string().optional(),
      }),
      async execute(fields) {
        return await updateUserProfile(fields);
      },
    }),

    // offers tools
    listUserOffers: tool({
      description: "List all user offers",
      inputSchema: z.object({}),
      async execute() {
        return await listUserOffers();
      },
    }),
    createUserOffer: tool({
      description: "Create a new user offer",
      inputSchema: z.object({
        name: z.string().describe("The name of the offer"),
        content: z.string().describe("The content/description of the offer"),
        value: z.number().optional().describe("The value/price of the offer"),
      }),
      async execute({ name, content, value }) {
        return await createUserOffer(name, content, value);
      },
    }),
    updateUserOffer: tool({
      description: "Update an existing user offer",
      inputSchema: z.object({
        offerId: z.string().describe("The ID of the offer to update"),
        name: z.string().optional(),
        content: z.string().optional(),
        value: z.number().optional(),
      }),
      async execute({ offerId, ...fields }) {
        return await updateUserOffer(offerId, fields);
      },
    }),
    deleteUserOffer: tool({
      description: "Delete a user offer",
      inputSchema: z.object({
        offerId: z.string().describe("The ID of the offer to delete"),
      }),
      async execute({ offerId }) {
        return await deleteUserOffer(offerId);
      },
    }),
    listUserOfferLinks: tool({
      description: "List all user offer links",
      inputSchema: z.object({}),
      async execute() {
        return await listUserOfferLinks();
      },
    }),
    addUserOfferLink: tool({
      description: "Add a new user offer link",
      inputSchema: z.object({
        type: z
          .enum(["primary", "calendar", "notion", "website"])
          .describe("The type of link"),
        url: z.string().describe("The URL of the link"),
      }),
      async execute({ type, url }) {
        return await addUserOfferLink(type, url);
      },
    }),

    // tone & training tools
    getToneProfile: tool({
      description:
        "Get the user's tone profile including tone type, sample text, and files",
      inputSchema: z.object({}),
      async execute() {
        return await getToneProfile();
      },
    }),
    updateToneProfile: tool({
      description: "Update the user's tone profile",
      inputSchema: z.object({
        toneType: z
          .enum(["friendly", "direct", "like_me", "custom"])
          .optional(),
        sampleText: z.array(z.string()).optional(),
        sampleFiles: z.array(z.string()).optional(),
        trainedEmbeddingId: z.string().optional(),
      }),
      async execute(fields) {
        return await updateToneProfile(fields);
      },
    }),
    addToneSample: tool({
      description: "Add a sample text to the user's tone profile",
      inputSchema: z.object({
        text: z.string().describe("The sample text to add"),
      }),
      async execute({ text }) {
        return await addToneSample(text);
      },
    }),

    // faqs tools
    listFaqs: tool({
      description: "List all user FAQs",
      inputSchema: z.object({}),
      async execute() {
        return await listFaqs();
      },
    }),
    addFaq: tool({
      description: "Add a new FAQ",
      inputSchema: z.object({
        question: z.string().describe("The FAQ question"),
        answer: z.string().optional().describe("The FAQ answer"),
      }),
      async execute({ question, answer }) {
        return await addFaq(question, answer);
      },
    }),
    updateFaq: tool({
      description: "Update an existing FAQ",
      inputSchema: z.object({
        faqId: z.string().describe("The ID of the FAQ to update"),
        question: z.string().optional(),
        answer: z.string().optional(),
      }),
      async execute({ faqId, ...fields }) {
        return await updateFaq(faqId, fields);
      },
    }),
    deleteFaq: tool({
      description: "Delete an FAQ",
      inputSchema: z.object({
        faqId: z.string().describe("The ID of the FAQ to delete"),
      }),
      async execute({ faqId }) {
        return await deleteFaq(faqId);
      },
    }),

    // sidekick settings tools
    getSidekickSettings: tool({
      description: "Get the user's sidekick settings including system prompt",
      inputSchema: z.object({}),
      async execute() {
        return await getSidekickSettings();
      },
    }),
    updateSidekickSettings: tool({
      description: "Update the user's sidekick settings",
      inputSchema: z.object({
        systemPrompt: z.string().describe("The new system prompt"),
      }),
      async execute({ systemPrompt }) {
        return await updateSystemPrompt(systemPrompt);
      },
    }),

    // action logs tools
    listActionLogs: tool({
      description: "List recent action logs for the user",
      inputSchema: z.object({
        limit: z
          .number()
          .optional()
          .default(20)
          .describe("Number of logs to return"),
      }),
      async execute({ limit }) {
        return await listActionLogs(limit);
      },
    }),
    getActionLog: tool({
      description: "Get a specific action log by ID",
      inputSchema: z.object({
        actionId: z.string().describe("The ID of the action log"),
      }),
      async execute({ actionId }) {
        return await getActionLog(actionId);
      },
    }),
  };

  const result = streamText({
    model: google("gemini-2.5-flash"),
    messages: convertToModelMessages(messages),
    system,
    tools,
    stopWhen: stepCountIs(5),
    experimental_transform: smoothStream({
      delayInMs: 20,
      chunking: "line",
    }),
  });

  return result.toUIMessageStreamResponse();
}