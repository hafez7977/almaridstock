import { Capacitor } from "@capacitor/core";

const PUBLISHED_ORIGIN = "https://almaridstock.lovable.app";

function withReturnTo(baseCallbackUrl: string): string {
  // Pass the origin we started OAuth from so the callback can send the user back
  // to the same environment (Preview vs Published) after exchanging the code.
  // Query params are allowed in Supabase redirect URLs as long as the path matches.
  try {
    const u = new URL(baseCallbackUrl);
    u.searchParams.set("returnTo", window.location.origin);
    return u.toString();
  } catch {
    // Fallback: if URL parsing fails for any reason, return unchanged.
    return baseCallbackUrl;
  }
}

/**
 * In Lovable preview/iframe environments, Supabase redirect URL allowlists can be brittle
 * (multiple ephemeral domains). To make OAuth reliable, route web OAuth callbacks through
 * the stable Published domain while keeping native deep-links unchanged.
 */
export function getOAuthRedirectTo(): string {
  if (Capacitor.isNativePlatform()) {
    return "app.lovable.c3feb9cc1fe04d038d7113be0d8bcf85://auth/callback";
  }

  const fallback = `${window.location.origin}/auth/callback`;

  // If embedded in an iframe, prefer the stable published origin.
  try {
    if (window.self !== window.top) {
      return withReturnTo(`${PUBLISHED_ORIGIN}/auth/callback`);
    }
  } catch {
    // Cross-origin access to window.top can throw; if it does, assume iframe.
    return withReturnTo(`${PUBLISHED_ORIGIN}/auth/callback`);
  }

  const host = window.location.hostname;
  const isLovablePreview =
    host.endsWith("lovableproject.com") || host.startsWith("id-preview--");

  if (isLovablePreview) return withReturnTo(`${PUBLISHED_ORIGIN}/auth/callback`);

  return fallback;
}
