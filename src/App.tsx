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

const App = () => {
  useEffect(() => {
    // iOS native optimizations
    if (Capacitor.isNativePlatform()) {
      // Set status bar to light content for better visibility
      StatusBar.setStyle({ style: Style.Light });
      
      // Hide status bar during auth flow for cleaner experience
      StatusBar.setOverlaysWebView({ overlay: true });
    }

    CapApp.addListener('appUrlOpen', async ({ url }) => {
      console.log('🔗 App URL opened:', url);

      // Handle OAuth callback URLs for Google auth
      if (
        url &&
        (url.includes('auth/callback') ||
          url.includes('#access_token') ||
          url.includes('app.lovable.c3feb9cc1fe04d038d7113be0d8bcf85://'))
      ) {
        console.log('🔐 OAuth callback detected, processing...', url);

        // Close the in-app browser when returning from OAuth
        if (Capacitor.isNativePlatform()) {
          try {
            await Browser.close();
          } catch (e) {
            console.log('Browser already closed or not open');
          }
        }

        try {
          // On native, Supabase won't automatically see the deep-link URL.
          // Exchange the PKCE code manually so the session is persisted.
          const callbackUrl = new URL(url);
          const code = callbackUrl.searchParams.get('code');

          if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              console.error('❌ exchangeCodeForSession failed:', error.message);
            } else {
              console.log('✅ Session established from native deep link');
            }
          }
        } catch (err) {
          console.error('❌ Failed to process native OAuth callback:', err);
        } finally {
          // Ensure the webview returns to the app
          window.location.href = '/';
        }
      }
    });

    return () => {
      // Cleanup listeners when component unmounts
      CapApp.removeAllListeners();
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
