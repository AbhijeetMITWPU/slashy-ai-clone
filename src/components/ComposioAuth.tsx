import { useState } from 'react';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

interface ComposioAuthProps {
  toolName: string; // This is actually the auth config ID
  onAuthComplete?: (connectionId: string) => void;
  onAuthError?: (error: string) => void;
}

export const ComposioAuth = ({ 
  toolName, 
  onAuthComplete, 
  onAuthError 
}: ComposioAuthProps) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { toast } = useToast();

  const initiateAuth = async () => {
    setIsAuthenticating(true);
    
    console.log('ComposioAuth initiateAuth called with auth config ID:', {
      toolName
    });
    
    try {
      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Authentication required. Please login first.');
      }

      // Call our edge function to initiate Composio authentication
      const response = await supabase.functions.invoke('composio-auth', {
        body: {
          action: 'initiate',
          toolName
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      console.log('composio-auth response:', response);

      if (response.error) {
        throw new Error(response.error.message || 'Failed to initiate authentication');
      }

      const { redirectUrl, connectionRequestId } = response.data;

      console.log('Redirecting to Composio OAuth:', redirectUrl);
      
      // Redirect user to Composio OAuth flow - they will be redirected back to /auth/callback after completion
      window.location.href = redirectUrl;

    } catch (error) {
      console.error('Authentication error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      onAuthError?.(errorMessage);
      toast({
        title: "Authentication failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={initiateAuth}
      disabled={isAuthenticating}
      className="text-xs whitespace-nowrap"
    >
      {isAuthenticating ? (
        <>
          <AlertCircle className="w-3 h-3 mr-1 animate-spin" />
          Connecting...
        </>
      ) : (
        <>
          <ExternalLink className="w-3 h-3 mr-1" />
          Connect
        </>
      )}
    </Button>
  );
};