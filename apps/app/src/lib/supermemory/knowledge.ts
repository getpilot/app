"use server";

import { db } from "@pilot/db";
import {
  user,
  userFaq,
  userOffer,
  userOfferLink,
  userToneProfile,
} from "@pilot/db/schema";
import {
  buildKnowledgeDocuments,
  type BusinessKnowledgeSnapshot,
  deleteMemoryDocument,
  getKnowledgeContainerTag,
  listMemoryDocuments,
  upsertMemoryDocument,
} from "@pilot/core/memory/supermemory";
import { eq } from "drizzle-orm";

type DBClient = typeof db;

export async function getBusinessKnowledgeSnapshot(
  userId: string,
  dbClient: DBClient = db,
) {
  const [userData] = await dbClient
    .select({
      mainOffering: user.main_offering,
    })
    .from(user)
    .where(eq(user.id, userId));

  if (!userData) {
    throw new Error(`User not found for memory sync: ${userId}`);
  }

  const [faqs, offers, offerLinks, toneProfileRows] = await Promise.all([
    dbClient
      .select({
        id: userFaq.id,
        question: userFaq.question,
        answer: userFaq.answer,
      })
      .from(userFaq)
      .where(eq(userFaq.userId, userId)),
    dbClient
      .select({
        id: userOffer.id,
        name: userOffer.name,
        content: userOffer.content,
        value: userOffer.value,
      })
      .from(userOffer)
      .where(eq(userOffer.userId, userId)),
    dbClient
      .select({
        id: userOfferLink.id,
        type: userOfferLink.type,
        url: userOfferLink.url,
      })
      .from(userOfferLink)
      .where(eq(userOfferLink.userId, userId)),
    dbClient
      .select({
        id: userToneProfile.id,
        toneType: userToneProfile.toneType,
        sampleText: userToneProfile.sampleText,
        sampleFiles: userToneProfile.sampleFiles,
      })
      .from(userToneProfile)
      .where(eq(userToneProfile.userId, userId))
      .limit(1),
  ]);

  return {
    mainOffering: userData.mainOffering,
    faqs,
    offers,
    offerLinks,
    toneProfile: toneProfileRows[0] || null,
  } satisfies BusinessKnowledgeSnapshot;
}

export async function syncBusinessKnowledgeMemory(
  userId: string,
  dbClient: DBClient = db,
) {
  const snapshot = await getBusinessKnowledgeSnapshot(userId, dbClient);
  const desiredDocuments = buildKnowledgeDocuments({ snapshot, userId });
  const desiredByCustomId = new Map(
    desiredDocuments.map((document) => [document.customId, document]),
  );

  const existingDocuments = await listMemoryDocuments({
    filters: {
      AND: [
        { key: "userId", value: userId },
        { key: "scope", value: "knowledge" },
      ],
    },
  });

  const knowledgeTag = getKnowledgeContainerTag(userId);
  await Promise.all(
    desiredDocuments.map((document) =>
      upsertMemoryDocument({
        containerTag: knowledgeTag,
        content: document.content,
        customId: document.customId,
        entityContext: document.entityContext,
        metadata: document.metadata,
      }),
    ),
  );

  const staleDocumentIds = existingDocuments.reduce<string[]>(
    (documentIds, document) => {
      if (document.customId && !desiredByCustomId.has(document.customId)) {
        documentIds.push(document.id);
      }

      return documentIds;
    },
    [],
  );

  await Promise.all(staleDocumentIds.map((documentId) => deleteMemoryDocument(documentId)));

  return {
    upserted: desiredDocuments.length,
    deleted: staleDocumentIds.length,
    totalDesired: desiredDocuments.length,
  };
}
