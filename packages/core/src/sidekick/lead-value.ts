type OfferLike = {
  name: string;
  value?: number | null;
};

type EstimateLeadValueParams = {
  offers: OfferLike[];
  texts: string[];
};

const PRICE_KEYWORDS = [
  "price",
  "pricing",
  "cost",
  "budget",
  "pay",
  "paid",
  "package",
  "offer",
  "offers",
  "plan",
  "plans",
  "quote",
  "rates",
  "rate",
  "investment",
  "usd",
  "dollar",
  "dollars",
];

function normalizeAmount(rawAmount: string, suffix?: string) {
  const parsed = Number.parseFloat(rawAmount.replace(/,/g, ""));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  const normalized = suffix?.toLowerCase() === "k" ? parsed * 1000 : parsed;
  return Math.round(normalized);
}

export function extractCurrencyMentions(text: string) {
  if (!text.trim()) {
    return [];
  }

  const matches: number[] = [];
  const amountPattern =
    /(?:\$|usd\s*)?(\d{1,3}(?:,\d{3})+|\d{2,6})(?:\s?(k))?\b/gi;

  for (const match of text.matchAll(amountPattern)) {
    const fullMatch = match[0] || "";
    const rawAmount = match[1];
    const suffix = match[2];
    const index = match.index ?? 0;
    const previousChar = text[index - 1] || "";
    const nextChar = text[index + fullMatch.length] || "";
    const context = text.slice(Math.max(0, index - 24), index + fullMatch.length + 24);
    const hasCurrencyMarker =
      fullMatch.includes("$") || /\busd\b/i.test(fullMatch) || /\busd\b/i.test(context);
    const hasPriceContext = PRICE_KEYWORDS.some((keyword) =>
      context.toLowerCase().includes(keyword),
    );

    if (previousChar === "-" || previousChar === "/" || nextChar === "-" || nextChar === "/") {
      continue;
    }

    if (!hasCurrencyMarker && !hasPriceContext) {
      continue;
    }

    const normalized = normalizeAmount(rawAmount, suffix);
    if (normalized !== null) {
      matches.push(normalized);
    }
  }

  return matches;
}

export function estimateLeadValue(params: EstimateLeadValueParams) {
  const offerValues = params.offers
    .map((offer) => offer.value)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);

  const normalizedTexts = params.texts
    .map((text) => text.trim())
    .filter(Boolean);

  const matchedOfferValues = params.offers
    .filter((offer): offer is OfferLike & { value: number } =>
      typeof offer.value === "number" && offer.value > 0,
    )
    .filter((offer) => {
      const offerName = offer.name.trim().toLowerCase();
      if (!offerName) {
        return false;
      }

      return normalizedTexts.some((text) => text.toLowerCase().includes(offerName));
    })
    .map((offer) => offer.value);

  if (matchedOfferValues.length > 0) {
    return Math.max(...matchedOfferValues);
  }

  const mentionedAmounts = normalizedTexts.flatMap((text) => extractCurrencyMentions(text));

  if (mentionedAmounts.length > 0) {
    if (offerValues.length === 0) {
      return Math.max(...mentionedAmounts);
    }

    const minOfferValue = offerValues[0];
    const maxOfferValue = offerValues[offerValues.length - 1];
    const exactOfferMatch = mentionedAmounts.find((amount) => offerValues.includes(amount));

    if (exactOfferMatch !== undefined) {
      return exactOfferMatch;
    }

    const boundedMentions = mentionedAmounts.filter(
      (amount) => amount >= Math.floor(minOfferValue * 0.5) && amount <= maxOfferValue * 2,
    );

    if (boundedMentions.length > 0) {
      return Math.max(...boundedMentions);
    }
  }

  if (offerValues.length > 0) {
    return offerValues[0];
  }

  return 0;
}
