import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { GoogleAuthProvider } from "@/contexts/GoogleAuthContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { App as CapApp } from '@capacitor/app';
import { supabase } from './integrations/supabase/client';
import { useEffect } from 'react';
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    CapApp.addListener('appUrlOpen', async ({ url }) => {
      if (url && url.includes('login-callback')) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(url);

        if (error) {
          console.error('Login exchange failed:', error.message);
        } else {
          console.log('Login successful:', data.session);
          // Optional: redirect to dashboard here
        }
      }
    });
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
