export function sanitizeText(str: string): string {
  return str
    .replace(/[\x00-\x1F\x7F]/g, "")
    .replace(/[<>]/g, "")
    .trim();
}
