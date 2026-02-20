import { sanitizeText } from "@/lib/utils";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export type HRNDecision = {
  hrn: boolean;
  confidence: number;
  signals: string[];
  reason: string;
};

const geminiModel = google("gemini-2.5-flash");

// ── Pre-LLM guardrail constants ────────────────────────────────────────

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
  "👍",
  "🙏",
  "👌",
  "💯",
  "🔥",
];

const TRIVIAL_MAX_LENGTH = 20;

// ── Guardrail helpers ──────────────────────────────────────────────────

function containsAny(text: string, terms: string[]): string[] {
  const lower = text.toLowerCase();
  return terms.filter((t) => lower.includes(t));
}

function isRiskTerm(text: string): HRNDecision | null {
  const matched = containsAny(text, RISK_TERMS);
  if (matched.length > 0) {
    return {
      hrn: true,
      confidence: 0.95,
      signals: matched,
      reason: `Risk terms detected: ${matched.join(", ")}`,
    };
  }
  return null;
}

function isDocReview(text: string): HRNDecision | null {
  const docHits = containsAny(text, DOC_TERMS);
  const reviewHits = containsAny(text, REVIEW_VERBS);
  if (docHits.length > 0 && reviewHits.length > 0) {
    return {
      hrn: true,
      confidence: 0.9,
      signals: [...docHits, ...reviewHits],
      reason: `Document review requested: ${docHits.join(", ")} + ${reviewHits.join(", ")}`,
    };
  }
  return null;
}

function isTrivialAck(text: string): HRNDecision | null {
  const trimmed = text.trim();
  if (trimmed.length > TRIVIAL_MAX_LENGTH) return null;

  // Ensure no risk terms are hiding in a short message
  if (containsAny(trimmed, RISK_TERMS).length > 0) return null;

  const lower = trimmed
    .toLowerCase()
    .replace(/[.,!?\s]+/g, " ")
    .trim();
  const isTrivial = TRIVIAL_ACKS.some(
    (ack) => lower === ack || lower === `${ack}!` || lower === `${ack}.`,
  );

  if (isTrivial) {
    return {
      hrn: false,
      confidence: 0.15,
      signals: ["trivial_ack"],
      reason: "Benign acknowledgment — safe for auto-reply.",
    };
  }
  return null;
}

// ── Combined classifier (guardrails → LLM) ────────────────────────────

/**
 * Run pre-LLM guardrails first, then fall through to LLM for nuanced cases.
 */
export async function classifyHumanResponseNeeded(options: {
  message: string;
  contextSnippet?: string;
}): Promise<HRNDecision> {
  const text = sanitizeText(options.message || "")
    .slice(0, 1200)
    .trim();

  if (!text) {
    return { hrn: false, confidence: 0.1, signals: [], reason: "empty" };
  }

  // 1. Risk terms → force HRN
  const risk = isRiskTerm(text);
  if (risk) return risk;

  // 2. Doc + review verbs → force HRN
  const docReview = isDocReview(text);
  if (docReview) return docReview;

  // 3. Trivial ack → force AUTO_OK (skip LLM)
  const trivial = isTrivialAck(text);
  if (trivial) return trivial;

  // 4. Fall through to LLM for nuanced classification
  return classifyHumanResponseNeededLLM(options);
}

// ── LLM classifier ────────────────────────────────────────────────────

export async function classifyHumanResponseNeededLLM(options: {
  message: string;
  contextSnippet?: string;
}): Promise<HRNDecision> {
  const text = sanitizeText(options.message || "")
    .slice(0, 1200)
    .trim();
  const context = sanitizeText(options.contextSnippet || "")
    .slice(0, 1200)
    .trim();

  if (!text) {
    return { hrn: false, confidence: 0.1, signals: [], reason: "empty" };
  }

  const systemPrompt = `
You are a classifier that decides if an incoming prospect message requires a Human Response Needed (HRN) lockout or is safe for auto-reply (AUTO_OK).
- HRN: high-touch, risk, negotiation, custom terms, refunds/cancellations, legal, pricing changes, review/approval of docs/links/media, or ambiguous "can you check/approve/review" asks.
- AUTO_OK: simple greetings, yes/no, clear low-risk asks, or routine clarifications where an automated reply is safe.
- Stay concise. Use conservative bias toward HRN when in doubt, especially when review/approval/feedback is requested or external artifacts are referenced.
Return strict JSON only.
`.trim();

  const fewShot = `
Examples (respond as JSON):
1) "can you check the pdf i sent and sign?" -> {"hrn":true,"confidence":0.86,"signals":["doc","sign","review"],"reason":"Doc review/signature requested"}
2) "hey! yes would love to see options" -> {"hrn":false,"confidence":0.35,"signals":["simple_yes"],"reason":"Low-risk affirmative"}
3) "what do you think about the pricing change in the proposal?" -> {"hrn":true,"confidence":0.82,"signals":["pricing","proposal","opinion"],"reason":"Pricing negotiation on proposal"}
4) "send me the link" -> {"hrn":false,"confidence":0.25,"signals":["simple_request"],"reason":"Low-risk request"}
5) "here's the contract, can you review by tomorrow?" -> {"hrn":true,"confidence":0.9,"signals":["contract","review","deadline"],"reason":"Contract review with deadline needs human"}
6) "refund me now" -> {"hrn":true,"confidence":0.78,"signals":["refund"],"reason":"Refund requires human"}
7) "cool thanks" -> {"hrn":false,"confidence":0.2,"signals":["ack"],"reason":"Benign acknowledgment"}
`.trim();

  const prompt = `
Context (optional): ${context || "none"}
Message: """${text}"""
${fewShot}
Respond with JSON {hrn:boolean, confidence:number 0-1, signals:string[], reason:string}. No prose.
`.trim();

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
      ? parsed.signals.map((s) => String(s)).slice(0, 10)
      : [];
    const reason =
      typeof parsed.reason === "string" && parsed.reason.trim().length
        ? parsed.reason.trim()
        : hrn
          ? "Classifier favored HRN."
          : "Classifier favored AUTO_OK.";

    return { hrn, confidence, signals, reason };
  } catch {
    // SAFETY: if we cannot parse the LLM response, default to HRN.
    // A risky message that crashes the parser should never get an auto-reply.
    return {
      hrn: true,
      confidence: 0.5,
      signals: ["parse_fallback"],
      reason:
        "Failed to parse HRN classification; defaulting to HRN for safety.",
    };
  }
}