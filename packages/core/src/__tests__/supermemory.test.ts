import test from "node:test";
import assert from "node:assert/strict";

import {
  buildContactTranscriptDocuments,
  buildKnowledgeDocuments,
  buildKnowledgeFallbackText,
  formatMemoryContext,
  getContactTranscriptEntryCustomId,
  getContactContainerTag,
  getKnowledgeContainerTag,
  getWorkspaceChatCustomId,
} from "../memory/supermemory";

test("buildKnowledgeDocuments excludes personal fields and keeps business facts", () => {
  const documents = buildKnowledgeDocuments({
    userId: "user_123",
    snapshot: {
      mainOffering: "1:1 Instagram growth coaching",
      faqs: [
        {
          id: "faq_1",
          question: "What does it cost?",
          answer: "$20",
        },
      ],
      offers: [
        {
          id: "offer_1",
          name: "Starter Audit",
          content: "Audit and action plan",
          value: 20,
        },
      ],
      offerLinks: [
        {
          id: "link_1",
          type: "primary",
          url: "https://example.com",
        },
      ],
      toneProfile: {
        id: "tone_1",
        toneType: "friendly",
        sampleText: ["Hey, happy to help."],
      },
    },
  });

  const combined = documents.map((document) => document.content).join("\n");

  assert.match(combined, /1:1 Instagram growth coaching/);
  assert.match(combined, /\$20/);
  assert.doesNotMatch(combined, /email|gender|Arjun/i);
});

test("fallback text includes priced offers and FAQs", () => {
  const fallback = buildKnowledgeFallbackText({
    mainOffering: "Done-for-you DM sales support",
    faqs: [{ id: "faq_1", question: "Refunds?", answer: "No refunds." }],
    offers: [
      {
        id: "offer_1",
        name: "DM Sprint",
        content: "7-day sprint",
        value: 20,
      },
    ],
    offerLinks: [],
    toneProfile: null,
  });

  assert.match(fallback, /DM Sprint \(\$20\)/);
  assert.match(fallback, /Refunds\?: No refunds/);
});

test("formatMemoryContext combines profile and search hits", () => {
  const context = formatMemoryContext({
    title: "Business memory",
    profile: {
      static: ["Main offer is DM Sprint"],
      dynamic: ["Recently promised a 7-day turnaround"],
    },
    results: [
      {
        id: "1",
        similarity: 0.92,
        memory: "DM Sprint costs $20",
        metadata: null,
      },
    ],
  });

  assert.match(context, /Main offer is DM Sprint/);
  assert.match(context, /DM Sprint costs \$20/);
});

test("container and custom IDs stay deterministic", () => {
  assert.equal(
    getKnowledgeContainerTag("user_123"),
    "pilot:user:user_123:knowledge",
  );
  assert.equal(
    getContactContainerTag("user_123", "contact_456"),
    "pilot:user:user_123:contact:contact_456",
  );
  assert.equal(
    getWorkspaceChatCustomId("user_123", "session_789"),
    "workspace:chat:user_123:session_789",
  );
});

test("contact transcript appends create per-entry documents", () => {
  const documents = buildContactTranscriptDocuments({
    userId: "user_123",
    instagramUserId: "ig_123",
    contactId: "contact_456",
    entries: [
      {
        role: "user",
        content: "Need pricing",
        timestamp: "2026-03-26T10:00:00.000Z",
      },
      {
        role: "assistant",
        content: "It starts at $20",
        timestamp: "2026-03-26T10:01:00.000Z",
      },
    ],
  });

  assert.equal(documents.length, 2);
  assert.equal(
    documents[0]?.customId,
    getContactTranscriptEntryCustomId({
      instagramUserId: "ig_123",
      contactId: "contact_456",
      timestamp: "2026-03-26T10:00:00.000Z",
      index: 0,
    }),
  );
  assert.equal(
    documents[1]?.customId,
    getContactTranscriptEntryCustomId({
      instagramUserId: "ig_123",
      contactId: "contact_456",
      timestamp: "2026-03-26T10:01:00.000Z",
      index: 1,
    }),
  );
  assert.match(documents[0]?.content || "", /Customer: Need pricing/);
  assert.match(documents[1]?.content || "", /Business: It starts at \$20/);
});
