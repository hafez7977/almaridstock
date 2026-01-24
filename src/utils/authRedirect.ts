import { Capacitor } from "@capacitor/core";

const PUBLISHED_ORIGIN = "https://almaridstock.lovable.app";

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
      return `${PUBLISHED_ORIGIN}/auth/callback`;
    }
  } catch {
    // Cross-origin access to window.top can throw; if it does, assume iframe.
    return `${PUBLISHED_ORIGIN}/auth/callback`;
  }

  const host = window.location.hostname;
  const isLovablePreview =
    host.endsWith("lovableproject.com") || host.startsWith("id-preview--");

  if (isLovablePreview) return `${PUBLISHED_ORIGIN}/auth/callback`;

  return fallback;
}
