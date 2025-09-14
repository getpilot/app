import { cookies } from "next/headers";
import { api } from "../../convex/_generated/api";
import { convex } from "./convex-client";

export const getSession = async () => {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("better-auth.session_token");

    if (!sessionToken) {
      return null;
    }

    return {
      session: {
        token: sessionToken.value,
      },
    };
  } catch (error) {
    console.error("Error getting session:", error);
    return null;
  }
};

export const getUser = async () => {
  try {
    const sessionToken = await getSessionToken();
    if (!sessionToken) {
      return null;
    }

    convex.setAuth(sessionToken);

    const user = await convex.query(api.auth.getCurrentUser);
    return user;
  } catch (error) {
    console.error("Error getting current user from Convex:", error);
    return null;
  }
};

export const isAuthenticated = async () => {
  const session = await getSession();
  return !!session;
};

export const getSessionToken = async () => {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("better-auth.session_token");
    return sessionToken?.value || null;
  } catch (error) {
    console.error("Error getting session token:", error);
    return null;
  }
};

export const getAuthHeaders = async () => {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("better-auth.session_token");

    if (!sessionToken) {
      return {};
    }

    return {
      cookie: `better-auth.session_token=${sessionToken.value}`,
    };
  } catch (error) {
    console.error("Error getting auth headers:", error);
    return {};
  }
};