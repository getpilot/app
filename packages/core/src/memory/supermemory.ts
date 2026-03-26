import Supermemory from "supermemory";

const MEMORY_THRESHOLD = 0.6;
const MEMORY_LIMIT = 10;
const MEMORY_FILTER_PROMPT = [
  "Keep durable facts that help Sidekick answer prospects and support the workspace owner.",
  "Retain prices, offers, FAQs, offer links, tone guidance, customer goals, objections, budget, timeline, follow-up promises, and buying stage.",
  "Skip greetings, retries, filler chat, UI chatter, and irrelevant personal details.",
].join(" ");

type MemoryMetadata = Record<string, string | number | boolean | string[]>;

export type MemoryProfile = {
  dynamic: string[];
  static: string[];
};

export type MemorySearchResult = {
  id: string;
  similarity: number;
  memory?: string;
  chunk?: string;
  metadata: Record<string, unknown> | null;
};

export type StoredMemoryDocument = {
  id: string;
  customId: string | null;
  content?: string;
  metadata: string | number | boolean | Record<string, unknown> | unknown[] | null;
  status: string;
};

export type BusinessKnowledgeSnapshot = {
  mainOffering?: string | null;
  faqs: Array<{
    id: string;
    question: string;
    answer?: string | null;
  }>;
  offers: Array<{
    id: string;
    name: string;
    content: string;
    value?: number | null;
  }>;
  offerLinks: Array<{
    id: string;
    type: "primary" | "calendar" | "notion" | "website";
    url: string;
  }>;
  toneProfile?: {
    id: string;
    toneType: "friendly" | "direct" | "like_me" | "custom";
    sampleText?: string[] | null;
    sampleFiles?: string[] | null;
  } | null;
};

export type MemoryDocument = {
  content: string;
  customId: string;
  entityContext?: string;
  metadata: MemoryMetadata;
};

let client: Supermemory | null = null;
let ensuredSettingsPromise: Promise<void> | null = null;
let clientApiKey: string | null = null;

function getClient() {
  const apiKey = process.env.SUPERMEMORY_API_KEY;

  if (!apiKey) {
    throw new Error("SUPERMEMORY_API_KEY is not configured");
  }

  // Cache the SDK client per process, but rebuild it if the API key changes.
  if (!client || clientApiKey !== apiKey) {
    client = new Supermemory({
      apiKey,
      timeout: 20_000,
      maxRetries: 1,
    });
    clientApiKey = apiKey;
    ensuredSettingsPromise = null;
  }

  return client;
}

async function ensureSupermemorySettings() {
  if (!ensuredSettingsPromise) {
    ensuredSettingsPromise = (async () => {
      const currentSettings = await getClient().settings.get();

      if (
        currentSettings.filterPrompt === MEMORY_FILTER_PROMPT &&
        currentSettings.shouldLLMFilter === true
      ) {
        return;
      }

      await getClient().settings.update({
        filterPrompt: MEMORY_FILTER_PROMPT,
        shouldLLMFilter: true,
      });
    })().catch((error) => {
      ensuredSettingsPromise = null;
      throw error;
    });
  }

  return ensuredSettingsPromise;
}

function trimLines(lines: string[], max = 5) {
  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, max);
}

function createMetadata(base: MemoryMetadata, extra?: MemoryMetadata): MemoryMetadata {
  return {
    ...base,
    ...extra,
    updatedAt: new Date().toISOString(),
  };
}

function sanitizeMemoryIdentifierSegment(value: string) {
  return value.replace(/[^A-Za-z0-9:_-]/g, "_");
}

export function getKnowledgeContainerTag(userId: string) {
  return `pilot:user:${sanitizeMemoryIdentifierSegment(userId)}:knowledge`;
}

export function getWorkspaceContainerTag(userId: string) {
  return `pilot:user:${sanitizeMemoryIdentifierSegment(userId)}:workspace`;
}

export function getContactContainerTag(userId: string, contactId: string) {
  return `pilot:user:${sanitizeMemoryIdentifierSegment(userId)}:contact:${sanitizeMemoryIdentifierSegment(contactId)}`;
}

export function getKnowledgeCustomId(kind: string, id?: string) {
  const safeKind = sanitizeMemoryIdentifierSegment(kind);
  return id
    ? `knowledge:${safeKind}:${sanitizeMemoryIdentifierSegment(id)}`
    : `knowledge:${safeKind}`;
}

export function getWorkspaceChatCustomId(userId: string, sessionId: string) {
  return `workspace:chat:${sanitizeMemoryIdentifierSegment(userId)}:${sanitizeMemoryIdentifierSegment(sessionId)}`;
}

export function getContactTranscriptCustomId(
  instagramUserId: string,
  contactId: string,
) {
  return `instagram:thread:${sanitizeMemoryIdentifierSegment(instagramUserId)}:${sanitizeMemoryIdentifierSegment(contactId)}`;
}

export function getContactTranscriptEntryCustomId(params: {
  instagramUserId: string;
  contactId: string;
  timestamp?: Date | string | null;
  index?: number;
}) {
  const baseId = getContactTranscriptCustomId(
    params.instagramUserId,
    params.contactId,
  );
  const rawTimestamp = params.timestamp
    ? new Date(params.timestamp).toISOString()
    : new Date().toISOString();
  const safeTimestamp = sanitizeMemoryIdentifierSegment(rawTimestamp);
  return `${baseId}:${safeTimestamp}:${params.index ?? 0}`;
}

export function getKnowledgeEntityContext() {
  return [
    "This container stores durable business knowledge for one Pilot workspace.",
    "Keep facts that help answer prospects and the workspace owner accurately.",
    "Retain prices, offers, FAQs, offer links, policies, main offering, and tone preferences.",
    "Do not retain irrelevant personal profile details.",
  ].join(" ");
}

export function getWorkspaceEntityContext() {
  return [
    "This container stores internal Sidekick chat context for one Pilot workspace.",
    "Retain durable business decisions, preferences, and recurring requests.",
    "Ignore filler chat and ephemeral phrasing.",
  ].join(" ");
}

export function getContactEntityContext() {
  return [
    "This container stores durable memory for one Instagram DM relationship.",
    "Retain customer goals, objections, budget, timeline, offer interest, promised follow-ups, and buying stage.",
    "Ignore greetings and low-value small talk.",
  ].join(" ");
}

export function buildKnowledgeDocuments(params: {
  snapshot: BusinessKnowledgeSnapshot;
  userId: string;
}) {
  const baseMetadata = {
    userId: params.userId,
    scope: "knowledge",
    platform: "pilot",
  } satisfies MemoryMetadata;
  const documents: MemoryDocument[] = [];

  if (params.snapshot.mainOffering?.trim()) {
    documents.push({
      customId: getKnowledgeCustomId("main-offering"),
      entityContext: getKnowledgeEntityContext(),
      metadata: createMetadata(baseMetadata, {
        kind: "main_offering",
      }),
      content: [
        "Business Main Offering",
        `Main offering: ${params.snapshot.mainOffering.trim()}`,
      ].join("\n"),
    });
  }

  for (const faq of params.snapshot.faqs) {
    documents.push({
      customId: getKnowledgeCustomId("faq", faq.id),
      entityContext: getKnowledgeEntityContext(),
      metadata: createMetadata(baseMetadata, {
        kind: "faq",
        recordId: faq.id,
      }),
      content: [
        "Business FAQ",
        `Question: ${faq.question.trim()}`,
        `Answer: ${(faq.answer || "No answer provided").trim()}`,
      ].join("\n"),
    });
  }

  for (const offer of params.snapshot.offers) {
    const lines = [
      "Business Offer",
      `Offer name: ${offer.name.trim()}`,
      `Offer details: ${offer.content.trim()}`,
    ];

    if (offer.value !== undefined && offer.value !== null) {
      lines.push(`Offer price: $${offer.value}`);
    }

    documents.push({
      customId: getKnowledgeCustomId("offer", offer.id),
      entityContext: getKnowledgeEntityContext(),
      metadata: createMetadata(baseMetadata, {
        kind: "offer",
        recordId: offer.id,
      }),
      content: lines.join("\n"),
    });
  }

  for (const offerLink of params.snapshot.offerLinks) {
    documents.push({
      customId: getKnowledgeCustomId("offer-link", offerLink.id),
      entityContext: getKnowledgeEntityContext(),
      metadata: createMetadata(baseMetadata, {
        kind: "offer_link",
        recordId: offerLink.id,
        linkType: offerLink.type,
      }),
      content: [
        "Business Offer Link",
        `Link type: ${offerLink.type}`,
        `URL: ${offerLink.url.trim()}`,
      ].join("\n"),
    });
  }

  if (params.snapshot.toneProfile?.id) {
    const toneLines = [
      "Business Tone Profile",
      `Tone type: ${params.snapshot.toneProfile.toneType}`,
    ];
    const sampleText = trimLines(params.snapshot.toneProfile.sampleText || []);
    if (sampleText.length > 0) {
      toneLines.push(`Example phrasing:\n- ${sampleText.join("\n- ")}`);
    }

    documents.push({
      customId: getKnowledgeCustomId("tone", params.snapshot.toneProfile.id),
      entityContext: getKnowledgeEntityContext(),
      metadata: createMetadata(baseMetadata, {
        kind: "tone_profile",
        recordId: params.snapshot.toneProfile.id,
      }),
      content: toneLines.join("\n"),
    });
  }

  return documents;
}

export function buildKnowledgeFallbackText(snapshot: BusinessKnowledgeSnapshot) {
  const sections: string[] = [];

  if (snapshot.mainOffering?.trim()) {
    sections.push(`Main offering: ${snapshot.mainOffering.trim()}`);
  }

  if (snapshot.offers.length > 0) {
    const offers = snapshot.offers
      .slice(0, 5)
      .map((offer) => {
        const price =
          offer.value !== undefined && offer.value !== null ? ` ($${offer.value})` : "";
        return `${offer.name}${price}: ${offer.content}`;
      })
      .join("; ");
    sections.push(`Offers: ${offers}`);
  }

  if (snapshot.faqs.length > 0) {
    const faqs = snapshot.faqs
      .slice(0, 5)
      .map((faq) => `${faq.question}: ${faq.answer || "No answer provided"}`)
      .join("; ");
    sections.push(`FAQs: ${faqs}`);
  }

  if (snapshot.offerLinks.length > 0) {
    const links = snapshot.offerLinks
      .slice(0, 4)
      .map((link) => `${link.type}: ${link.url}`)
      .join("; ");
    sections.push(`Offer links: ${links}`);
  }

  return sections.join("\n");
}

export function buildToneGuidance(
  toneProfile: BusinessKnowledgeSnapshot["toneProfile"] | null | undefined,
) {
  if (!toneProfile) {
    return "Write in a friendly, professional tone.";
  }

  const samples = trimLines(toneProfile.sampleText || [], 3);
  const sampleSuffix =
    samples.length > 0 ? ` Mirror this style: ${samples.join(" | ")}` : "";

  switch (toneProfile.toneType) {
    case "direct":
      return `Write in a direct, concise, businesslike tone.${sampleSuffix}`;
    case "like_me":
      return `Write in the user's own voice and phrasing.${sampleSuffix}`;
    case "custom":
      return `Follow the user's custom tone guidance.${sampleSuffix}`;
    default:
      return `Write in a warm, friendly, professional tone.${sampleSuffix}`;
  }
}

export function formatTranscriptLines(
  entries: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp?: Date | string | null;
  }>,
) {
  return entries
    .map((entry) => {
      const prefix = entry.role === "assistant" ? "Business" : "Customer";
      const time = entry.timestamp ? `[${new Date(entry.timestamp).toISOString()}] ` : "";
      return `${time}${prefix}: ${entry.content.trim()}`;
    })
    .join("\n");
}

export function buildContactTranscriptDocuments(params: {
  userId: string;
  instagramUserId: string;
  contactId: string;
  entries: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp?: Date | string | null;
  }>;
}) {
  return params.entries
    .filter((entry) => entry.content.trim())
    .map((entry, index) => ({
      containerTag: getContactContainerTag(params.userId, params.contactId),
      customId: getContactTranscriptEntryCustomId({
        instagramUserId: params.instagramUserId,
        contactId: params.contactId,
        timestamp: entry.timestamp,
        index,
      }),
      entityContext: getContactEntityContext(),
      metadata: createMetadata({
        userId: params.userId,
        scope: "contact",
        platform: "instagram",
        contactId: params.contactId,
        instagramUserId: params.instagramUserId,
      }),
      content: formatTranscriptLines([entry]),
    }));
}

export async function appendContactTranscriptMemory(params: {
  userId: string;
  instagramUserId: string;
  contactId: string;
  entries: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp?: Date | string | null;
  }>;
}) {
  const documents = buildContactTranscriptDocuments(params);
  return Promise.all(
    documents.map((document) =>
      upsertMemoryDocument({
        containerTag: document.containerTag,
        customId: document.customId,
        entityContext: document.entityContext,
        metadata: document.metadata,
        content: document.content,
      }),
    ),
  );
}

export async function appendWorkspaceTranscriptMemory(params: {
  userId: string;
  sessionId: string;
  entries: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp?: Date | string | null;
  }>;
}) {
  return upsertMemoryDocument({
    containerTag: getWorkspaceContainerTag(params.userId),
    customId: getWorkspaceChatCustomId(params.userId, params.sessionId),
    entityContext: getWorkspaceEntityContext(),
    metadata: createMetadata({
      userId: params.userId,
      scope: "workspace",
      platform: "pilot",
      sessionId: params.sessionId,
    }),
    content: formatTranscriptLines(params.entries),
  });
}

export async function upsertMemoryDocument(params: {
  containerTag: string;
  content: string;
  customId: string;
  entityContext?: string;
  metadata?: MemoryMetadata;
}) {
  if (!params.content.trim()) {
    return null;
  }

  await ensureSupermemorySettings();

  return getClient().documents.add({
    content: params.content,
    containerTag: params.containerTag,
    customId: params.customId,
    entityContext: params.entityContext,
    metadata: params.metadata,
  });
}

export async function deleteMemoryDocument(documentIdOrCustomId: string) {
  return getClient().documents.delete(documentIdOrCustomId);
}

export async function listMemoryDocuments(params?: {
  filters?: Record<string, unknown>;
  includeContent?: boolean;
}) {
  const response = await getClient().documents.list({
    includeContent: params?.includeContent ?? false,
    ...(params?.filters ? { filters: params.filters as never } : {}),
  });

  return response.memories.map((memory) => ({
    id: memory.id,
    customId: memory.customId,
    content: memory.content,
    metadata: memory.metadata,
    status: memory.status,
  })) satisfies StoredMemoryDocument[];
}

export async function getMemoryProfile(params: {
  containerTag: string;
  q?: string;
  filters?: Record<string, unknown>;
}) {
  const response = await getClient().profile({
    containerTag: params.containerTag,
    q: params.q,
    threshold: MEMORY_THRESHOLD,
    ...(params.filters ? { filters: params.filters as never } : {}),
  });

  return response.profile satisfies MemoryProfile;
}

export async function searchMemory(params: {
  containerTag: string;
  q: string;
  limit?: number;
  searchMode?: "memories" | "hybrid" | "documents";
  filters?: Record<string, unknown>;
}) {
  if (!params.q.trim()) {
    return [] as MemorySearchResult[];
  }

  const response = await getClient().search.memories({
    containerTag: params.containerTag,
    q: params.q,
    limit: params.limit ?? MEMORY_LIMIT,
    searchMode: params.searchMode ?? "hybrid",
    rerank: true,
    threshold: MEMORY_THRESHOLD,
    ...(params.filters ? { filters: params.filters as never } : {}),
  });

  return response.results.map((result) => ({
    id: result.id,
    similarity: result.similarity,
    memory: result.memory,
    chunk: result.chunk,
    metadata: result.metadata,
  }));
}

export function formatMemoryContext(params: {
  title: string;
  profile?: MemoryProfile | null;
  results?: MemorySearchResult[];
}) {
  const sections: string[] = [];

  if (params.profile?.static?.length) {
    sections.push(
      `Static:\n- ${params.profile.static.slice(0, 5).join("\n- ")}`,
    );
  }

  if (params.profile?.dynamic?.length) {
    sections.push(
      `Dynamic:\n- ${params.profile.dynamic.slice(0, 5).join("\n- ")}`,
    );
  }

  if (params.results?.length) {
    const resultLines = params.results
      .slice(0, MEMORY_LIMIT)
      .map((result) => result.memory || result.chunk)
      .filter((value): value is string => Boolean(value))
      .map((value) => `- ${value.trim()}`);

    if (resultLines.length > 0) {
      sections.push(`Relevant:\n${resultLines.join("\n")}`);
    }
  }

  if (sections.length === 0) {
    return "";
  }

  return `${params.title}\n${sections.join("\n\n")}`;
}
