"use server";

import { getUser } from "@/lib/auth-utils";
import { convex, api } from "@/lib/convex-client";
import { Id } from "../../../../convex/_generated/dataModel";

const toUserId = (id: string): Id<"user"> => id as Id<"user">;
const toFaqId = (id: string): Id<"userFaq"> => id as Id<"userFaq">;

export async function listFaqs() {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const faqs = await convex.query(api.sidekick.getUserFaqs, {
      userId: toUserId(currentUser.id),
    });

    return {
      success: true,
      faqs: faqs.map((faq) => ({
        id: faq._id,
        question: faq.question,
        answer: faq.answer,
        createdAt: new Date(faq.createdAt).toISOString(),
      })),
    };
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch FAQs",
    };
  }
}

export async function addFaq(question: string, answer?: string) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const questionTrimmed = question?.trim() ?? "";
    const answerTrimmed = answer?.trim() ?? "";

    if (!questionTrimmed) {
      return { success: false, error: "Question is required" };
    }

    const faqId = await convex.mutation(api.sidekick.createUserFaq, {
      userId: toUserId(currentUser.id),
      question: questionTrimmed,
      answer: answerTrimmed || undefined,
      createdAt: Date.now(),
    });

    return { success: true, faqId };
  } catch (error) {
    console.error("Error adding FAQ:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add FAQ",
    };
  }
}

export async function updateFaq(
  faqId: string,
  fields: {
    question?: string;
    answer?: string;
  }
) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    await convex.mutation(api.sidekick.updateUserFaq, {
      id: toFaqId(faqId),
      question: fields.question?.trim(),
      answer: fields.answer?.trim(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating FAQ:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update FAQ",
    };
  }
}

export async function deleteFaq(faqId: string) {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    await convex.mutation(api.sidekick.deleteUserFaq, {
      id: toFaqId(faqId),
    });

    return { success: true };
  } catch (error) {
    console.error("Error deleting FAQ:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete FAQ",
    };
  }
}