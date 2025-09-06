"use server";

import { getUser } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { userFaq } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function listFaqs() {
  try {
    const currentUser = await getUser();
    if (!currentUser) {
      return { success: false, error: "Unauthorized" };
    }

    const faqs = await db.query.userFaq.findMany({
      where: eq(userFaq.userId, currentUser.id),
      orderBy: (faqs, { desc }) => [desc(faqs.createdAt)],
    });

    return {
      success: true,
      faqs: faqs.map((faq) => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        createdAt: faq.createdAt,
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

    const faqId = crypto.randomUUID();
    const now = new Date();

    await db.insert(userFaq).values({
      id: faqId,
      userId: currentUser.id,
      question,
      answer,
      createdAt: now,
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

    const updateData: any = {};

    if (fields.question !== undefined) updateData.question = fields.question;
    if (fields.answer !== undefined) updateData.answer = fields.answer;

    await db
      .update(userFaq)
      .set(updateData)
      .where(and(eq(userFaq.id, faqId), eq(userFaq.userId, currentUser.id)));

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

    await db
      .delete(userFaq)
      .where(and(eq(userFaq.id, faqId), eq(userFaq.userId, currentUser.id)));

    return { success: true };
  } catch (error) {
    console.error("Error deleting FAQ:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete FAQ",
    };
  }
}