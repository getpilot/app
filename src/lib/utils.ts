import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts an option label string to a standardized value format
 * (lowercase with spaces and special characters replaced by underscores)
 */
export function optionToValue(option: string): string {
  return option
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[\/&]/g, (match) => (match === "/" ? "_" : "and"));
}