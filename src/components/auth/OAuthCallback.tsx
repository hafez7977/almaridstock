import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

/**
 * OAuth Callback Component for handling mobile OAuth redirects
 * This component is specifically designed for Capacitor mobile apps
 */
export const OAuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuthCallback = async () => {
      console.log('OAuth callback component mounted');
      console.log('Current URL:', window.location.href);
      
      try {
        // Extract the hash from the URL which contains the OAuth tokens
        const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
        const urlParams = new URLSearchParams(window.location.search);
        
        console.log('Hash params:', Object.fromEntries(hashParams.entries()));
        console.log('URL params:', Object.fromEntries(urlParams.entries()));
        
        // Check if we have OAuth parameters
        const hasTokens = hashParams.has('access_token') || 
                         hashParams.has('refresh_token') ||
                         urlParams.has('code') ||
                         urlParams.has('state');
        
        if (hasTokens) {
          console.log('OAuth tokens detected, processing...');
          
          // Let Supabase handle the OAuth callback by checking the session
          // This will automatically extract tokens from the URL
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Session retrieval error:', error);
            // Still redirect to home, the main auth context will handle the error
          } else if (session) {
            console.log('OAuth callback successful, session established');
          } else {
            console.log('No session found, but OAuth params present - waiting for auth state change');
          }
        } else {
          console.log('No OAuth parameters found in callback URL');
        }
        
        // Always redirect to home after processing
        // The auth context will handle the actual authentication state
        setTimeout(() => {
          console.log('Redirecting to home page...');
          navigate('/', { replace: true });
        }, 1000);
        
      } catch (error) {
        console.error('OAuth callback error:', error);
        // Still redirect to home on error
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 1000);
      }
    };

    handleOAuthCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <h2 className="text-lg font-semibold">Completing sign-in...</h2>
          <p className="text-sm text-muted-foreground text-center">
            Please wait while we complete your Google authentication.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};