import { useState } from 'react';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ExternalLink, CheckCircle, AlertCircle } from 'lucide-react';

interface ComposioAuthProps {
  integrationId: string;
  authConfigId: string;
  userId: string;
  onAuthComplete?: (connectionId: string) => void;
  onAuthError?: (error: string) => void;
}

export const ComposioAuth = ({ 
  integrationId, 
  authConfigId, 
  userId, 
  onAuthComplete, 
  onAuthError 
}: ComposioAuthProps) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { toast } = useToast();

  const initiateAuth = async () => {
    setIsAuthenticating(true);
    
    console.log('ComposioAuth initiateAuth called with:', {
      integrationId,
      authConfigId,
      userId
    });
    
    try {
      // Call our edge function to initiate Composio authentication
      const response = await supabase.functions.invoke('composio-auth', {
        body: {
          action: 'initiate',
          userId,
          authConfigId,
          integrationId
        }
      });

      console.log('composio-auth response:', response);

      if (response.error) {
        throw new Error(response.error.message || 'Failed to initiate authentication');
      }

      const { redirectUrl, connectionRequestId } = response.data;

      // Open auth window
      const authWindow = window.open(
        redirectUrl,
        'composio-auth',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      if (!authWindow) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Poll for completion
      const pollForCompletion = async () => {
        const maxAttempts = 60; // 5 minutes
        let attempts = 0;

        const checkStatus = async () => {
          if (attempts >= maxAttempts) {
            authWindow.close();
            throw new Error('Authentication timed out');
          }

          if (authWindow.closed) {
            throw new Error('Authentication window was closed');
          }

          try {
            const statusResponse = await supabase.functions.invoke('composio-auth', {
              body: {
                action: 'check_status',
                connectionRequestId,
                userId
              }
            });

            if (statusResponse.data?.status === 'completed') {
              authWindow.close();
              onAuthComplete?.(statusResponse.data.connectionId);
              toast({
                title: "Authentication successful",
                description: `${integrationId} has been connected successfully.`,
              });
              // Redirect to chat after successful connection
              window.location.href = '/chat';
              return;
            }

            attempts++;
            setTimeout(checkStatus, 5000); // Check every 5 seconds
          } catch (error) {
            console.error('Error checking auth status:', error);
            setTimeout(checkStatus, 5000);
          }
        };

        checkStatus();
      };

      pollForCompletion();

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