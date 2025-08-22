import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');
  const { toast } = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Check if we have success or error parameters from Composio
        const error = searchParams.get('error');
        const connectionRequestId = searchParams.get('connection_request_id');
        const state = searchParams.get('state');

        if (error) {
          setStatus('error');
          setMessage(`Authentication failed: ${error}`);
          toast({
            title: "Authentication Failed",
            description: error,
            variant: "destructive",
          });
          return;
        }

        if (connectionRequestId) {
          // Connection was successful
          setStatus('success');
          setMessage('Integration connected successfully!');
          toast({
            title: "Integration Connected",
            description: "You can now use this tool in your chat.",
            variant: "default",
          });
          
          // Wait a moment to show success, then redirect to chat
          setTimeout(() => {
            navigate('/chat');
          }, 2000);
        } else {
          // Check for any other success indicators
          setStatus('success');
          setMessage('Authentication completed successfully!');
          setTimeout(() => {
            navigate('/chat');
          }, 2000);
        }
      } catch (error) {
        console.error('Error handling auth callback:', error);
        setStatus('error');
        setMessage('An unexpected error occurred during authentication.');
        toast({
          title: "Authentication Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive",
        });
      }
    };

    handleCallback();
  }, [searchParams, navigate, toast]);

  const handleReturnToChat = () => {
    navigate('/chat');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="space-y-6">
          {status === 'loading' && (
            <>
              <div className="flex justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Processing Authentication</h2>
                <p className="text-muted-foreground">{message}</p>
              </div>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="flex justify-center">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2 text-green-700">Success!</h2>
                <p className="text-muted-foreground">{message}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Redirecting to chat in a moment...
                </p>
              </div>
            </>
          )}
          
          {status === 'error' && (
            <>
              <div className="flex justify-center">
                <AlertCircle className="w-12 h-12 text-red-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2 text-red-700">Authentication Failed</h2>
                <p className="text-muted-foreground">{message}</p>
              </div>
              <Button onClick={handleReturnToChat} className="w-full">
                Return to Chat
              </Button>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};