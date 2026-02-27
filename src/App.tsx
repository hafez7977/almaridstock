import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleAuthProvider } from "@/contexts/GoogleAuthContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { supabase } from './integrations/supabase/client';
import { useEffect } from 'react';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthCallback from "./pages/AuthCallback";

const queryClient = new QueryClient();
const PUBLISHED_ORIGIN = "https://almaridstock.lovable.app";

const isLikelyEmbeddedWebView = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isAndroidWebView = /\bwv\b|Version\/\d+\.\d+.*Chrome\//i.test(ua);
  const isAppMySite = /appmysite/i.test(ua);
  return isAndroidWebView || isAppMySite;
};

const App = () => {
  useEffect(() => {
    // TEMPORARY DEBUG: Log the actual hostname to help diagnose AppMySite URL issues
    console.log('🌐 APP LOADED ON:', window.location.hostname, '| Full URL:', window.location.href);
    console.log('🌐 Is WebView:', isLikelyEmbeddedWebView(), '| UA:', navigator.userAgent);

    // If AppMySite/WebView is loading a Lovable preview URL, force it to published domain
    // to avoid Lovable auth walls and callback loops.
    if (!Capacitor.isNativePlatform() && isLikelyEmbeddedWebView()) {
      const host = window.location.hostname;
      const isLovablePreviewHost =
        host.endsWith('lovableproject.com') || host.startsWith('id-preview--');

      if (isLovablePreviewHost) {
        const targetUrl = `${PUBLISHED_ORIGIN}${window.location.pathname}${window.location.search}${window.location.hash}`;
        console.log('🔀 Embedded WebView on preview host; redirecting to published domain', {
          from: window.location.href,
          to: targetUrl,
        });
        window.location.replace(targetUrl);
        return;
      }
    }

    // iOS native optimizations
    if (Capacitor.isNativePlatform()) {
      // Set status bar to light content for better visibility
      StatusBar.setStyle({ style: Style.Light });
      
      // Hide status bar during auth flow for cleaner experience
      StatusBar.setOverlaysWebView({ overlay: true });
    }

    let listener: { remove: () => Promise<void> } | null = null;

    CapApp.addListener('appUrlOpen', async ({ url }) => {
      console.log('🔗 App URL opened:', url);

      if (!url) return;

      // Handle OAuth callback URLs for Google auth (native deep links)
      if (
        url.includes('auth/callback') ||
        url.includes('#access_token') ||
        url.startsWith('app.lovable.c3feb9cc1fe04d038d7113be0d8bcf85://')
      ) {
        console.log('🔐 OAuth callback detected, routing to /auth/callback');

        // Close the in-app browser when returning from OAuth
        if (Capacitor.isNativePlatform()) {
          try {
            await Browser.close();
          } catch {
            // ignore
          }
        }

        try {
          const callbackUrl = new URL(url);
          const code = callbackUrl.searchParams.get('code');

          // Route into our web callback handler so it can exchange the code and persist provider_token.
          if (code) {
            window.location.href = `/auth/callback?code=${encodeURIComponent(code)}`;
            return;
          }

          // Fallback for implicit flows (hash-based)
          if (callbackUrl.hash) {
            window.location.href = `/auth/callback${callbackUrl.hash}`;
            return;
          }

          // Last resort: just go home
          window.location.href = '/';
        } catch (err) {
          console.error('❌ Failed to route native OAuth callback:', err);
          window.location.href = '/';
        }
      }
    }).then((h) => {
      listener = h;
    });

    return () => {
      // Cleanup listener when component unmounts
      listener?.remove();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GoogleAuthProvider>
        <AdminProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/auth/*" element={<AuthCallback />} />
              <Route path="/callback" element={<AuthCallback />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          </TooltipProvider>
        </AdminProvider>
      </GoogleAuthProvider>
    </QueryClientProvider>
  );
};

export default App;
