import { generateText, geminiModel } from "../ai/model";
import { sanitizeText } from "../utils";

export type HRNDecision = {
  hrn: boolean;
  confidence: number;
  signals: string[];
  reason: string;
};

const RISK_TERMS = [
  "refund",
  "cancel",
  "chargeback",
  "legal",
  "lawyer",
  "terms",
  "pricing",
  "discount",
  "custom",
  "scope",
  "deadline",
];

const DOC_TERMS = [
  "pdf",
  "doc",
  "contract",
  "proposal",
  "deck",
  "slides",
  "notion",
  "loom",
  "drive",
  "invoice",
  "quote",
  "estimate",
];

const REVIEW_VERBS = [
  "review",
  "check",
  "sign",
  "approve",
  "confirm",
  "verify",
  "look over",
  "feedback",
  "thoughts",
];

const TRIVIAL_ACKS = [
  "ok",
  "okay",
  "k",
  "kk",
  "sure",
  "thanks",
  "thank you",
  "ty",
  "thx",
  "yep",
  "yup",
  "yes",
  "yeah",
  "ya",
  "got it",
  "cool",
  "sounds good",
  "great",
  "perfect",
  "nice",
  "awesome",
  "??",
  "??",
  "??",
  "??",
  "??",
];

const TRIVIAL_MAX_LENGTH = 20;

function containsAny(text: string, terms: string[]): string[] {
  const lower = text.toLowerCase();
  return terms.filter((term) => lower.includes(term));
}

function isRiskTerm(text: string): HRNDecision | null {
  const matched = containsAny(text, RISK_TERMS);
  if (matched.length === 0) {
    return null;
  }

  return {
    hrn: true,
    confidence: 0.95,
    signals: matched,
    reason: `Risk terms detected: ${matched.join(", ")}`,
  };
}

function isDocReview(text: string): HRNDecision | null {
  const docHits = containsAny(text, DOC_TERMS);
  const reviewHits = containsAny(text, REVIEW_VERBS);
  if (docHits.length === 0 || reviewHits.length === 0) {
    return null;
  }

  return {
    hrn: true,
    confidence: 0.9,
    signals: [...docHits, ...reviewHits],
    reason: `Document review requested: ${docHits.join(", ")} + ${reviewHits.join(", ")}`,
  };
}

function isTrivialAck(text: string): HRNDecision | null {
  const trimmed = text.trim();
  if (trimmed.length > TRIVIAL_MAX_LENGTH) {
    return null;
  }

  if (containsAny(trimmed, RISK_TERMS).length > 0) {
    return null;
  }

  const lower = trimmed.toLowerCase().replace(/[.,!?\s]+/g, " ").trim();
  const isTrivial = TRIVIAL_ACKS.some(
    (ack) => lower === ack || lower === `${ack}!` || lower === `${ack}.`,
  );

  if (!isTrivial) {
    return null;
  }

  return {
    hrn: false,
    confidence: 0.15,
    signals: ["trivial_ack"],
    reason: "Benign acknowledgment; safe for auto-reply.",
  };
}

export async function classifyHumanResponseNeeded(options: {
  message: string;
  contextSnippet?: string;
}): Promise<HRNDecision> {
  const text = sanitizeText(options.message || "").slice(0, 1200).trim();

  if (!text) {
    return { hrn: false, confidence: 0.1, signals: [], reason: "empty" };
  }

  const risk = isRiskTerm(text);
  if (risk) {
    return risk;
  }

  const docReview = isDocReview(text);
  if (docReview) {
    return docReview;
  }

  const trivial = isTrivialAck(text);
  if (trivial) {
    return trivial;
  }

  return classifyHumanResponseNeededLLM(options);
}

export async function classifyHumanResponseNeededLLM(options: {
  message: string;
  contextSnippet?: string;
}): Promise<HRNDecision> {
  const text = sanitizeText(options.message || "").slice(0, 1200).trim();
  const context = sanitizeText(options.contextSnippet || "").slice(0, 1200).trim();

  if (!text) {
    return { hrn: false, confidence: 0.1, signals: [], reason: "empty" };
  }

  const systemPrompt = [
    "You are a classifier that decides if an incoming prospect message requires a Human Response Needed (HRN) lockout or is safe for auto-reply (AUTO_OK).",
    "- HRN: high-touch, risk, negotiation, custom terms, refunds/cancellations, legal, pricing changes, review/approval of docs/links/media, or ambiguous asks to check, approve, or review.",
    "- AUTO_OK: simple greetings, yes/no, clear low-risk asks, or routine clarifications where an automated reply is safe.",
    "- Stay concise. Use conservative bias toward HRN when in doubt, especially when review/approval/feedback is requested or external artifacts are referenced.",
    "Return strict JSON only.",
  ].join(" ");

  const fewShot = [
    '1) "can you check the pdf i sent and sign?" -> {"hrn":true,"confidence":0.86,"signals":["doc","sign","review"],"reason":"Doc review/signature requested"}',
    '2) "hey! yes would love to see options" -> {"hrn":false,"confidence":0.35,"signals":["simple_yes"],"reason":"Low-risk affirmative"}',
    '3) "what do you think about the pricing change in the proposal?" -> {"hrn":true,"confidence":0.82,"signals":["pricing","proposal","opinion"],"reason":"Pricing negotiation on proposal"}',
    '4) "send me the link" -> {"hrn":false,"confidence":0.25,"signals":["simple_request"],"reason":"Low-risk request"}',
    `5) "here's the contract, can you review by tomorrow?" -> {"hrn":true,"confidence":0.9,"signals":["contract","review","deadline"],"reason":"Contract review with deadline needs human"}`,
    '6) "refund me now" -> {"hrn":true,"confidence":0.78,"signals":["refund"],"reason":"Refund requires human"}',
    '7) "cool thanks" -> {"hrn":false,"confidence":0.2,"signals":["ack"],"reason":"Benign acknowledgment"}',
  ].join("\n");

  const prompt = [
    `Context (optional): ${context || "none"}`,
    `Message: """${text}"""`,
    fewShot,
    "Respond with JSON {hrn:boolean, confidence:number 0-1, signals:string[], reason:string}. No prose.",
  ].join("\n");

  const result = await generateText({
    model: geminiModel,
    system: systemPrompt,
    prompt,
    temperature: 0.4,
  });

  const raw = result.text?.trim() || "";

  try {
    const parsed = JSON.parse(raw) as Partial<HRNDecision>;
    const hrn = Boolean(parsed.hrn);
    const confidence =
      typeof parsed.confidence === "number"
        ? Math.min(Math.max(parsed.confidence, 0), 1)
        : hrn
          ? 0.6
          : 0.3;
    const signals = Array.isArray(parsed.signals)
      ? parsed.signals.map((signal) => String(signal)).slice(0, 10)
      : [];
    const reason =
      typeof parsed.reason === "string" && parsed.reason.trim().length > 0
        ? parsed.reason.trim()
        : hrn
          ? "Classifier favored HRN."
          : "Classifier favored AUTO_OK.";

    return { hrn, confidence, signals, reason };
  } catch {
    return {
      hrn: true,
      confidence: 0.2,
      signals: ["parse_fallback"],
      reason: "Failed to parse HRN classification; defaulting to HRN for safety.",
    };
  }
}
