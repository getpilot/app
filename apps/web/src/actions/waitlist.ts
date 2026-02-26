"use server";

import axios from "axios";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const API_BASE_URL = "https://pilot-ops-app.vercel.app";
const API_TOKEN = process.env.WAITLIST_API_TOKEN;

if (!API_TOKEN) {
  throw new Error("WAITLIST_API_TOKEN environment variable is not configured");
}

/**
 * Add a user to the waitlist via the API endpoint
 *
 * @param email - User's email address
 * @param name - User's full name
 * @returns Promise with success/error response matching your existing server action format
 */
export async function addToWaitlist(
  email: string,
  name: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!EMAIL_REGEX.test(email)) {
      return { success: false, error: "Please enter a valid email" };
    }

    if (!name.trim()) {
      return { success: false, error: "Please enter your name" };
    }

    const response = await axios.post(
      `${API_BASE_URL}/api/waitlist`,
      {
        email: email.trim().toLowerCase(),
        name: name.trim(),
        token: API_TOKEN,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data;

    if (data.success) {
      return { success: true };
    } else {
      return {
        success: false,
        error: data.error || "Failed to add to waitlist",
      };
    }
  } catch (error) {
    console.error("Error in addToWaitlist action:", error);

    if (axios.isAxiosError(error)) {
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        "Failed to add to waitlist";
      return { success: false, error: errorMessage };
    }

    return { success: false, error: "Failed to add to waitlist" };
  }
}

/**
 * Server action for form submission that accepts FormData
 */
export async function submitWaitlistAction(
  formData: FormData
): Promise<{ success: true } | { success: false; error: string }> {
  const email = String(formData.get("email") || "").trim();
  const name = String(formData.get("name") || "").trim();

  return await addToWaitlist(email, name);
}

/**
 * Alternative async function for use in React Server Components
 * Returns the same format as your existing server action
 */
export async function submitWaitlistForm(
  email: string,
  name: string
): Promise<{ success: true } | { success: false; error: string }> {
  return await addToWaitlist(email, name);
}

/**
 * Validate email format (client-side validation helper)
 */
export async function validateEmail(email: string): Promise<boolean> {
  return EMAIL_REGEX.test(email);
}

/**
 * Validate name (client-side validation helper)
 */
export async function validateName(name: string): Promise<boolean> {
  return name.trim().length > 0;
}