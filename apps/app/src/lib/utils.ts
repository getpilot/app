/**
 * Converts an option label string to a standardized value format
 * (lowercase with spaces and special characters replaced by underscores)
 */
export function optionToValue(option: string): string {
  return option
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[/&]/g, (match) => (match === "/" ? "_" : "and"));
}

export function sanitizeText(str: string): string {
  return str
    .replace(/[\x00-\x1F\x7F]/g, "") // control chars
    .replace(/[<>]/g, "") // prevent HTML/script tags
    .trim();
}
