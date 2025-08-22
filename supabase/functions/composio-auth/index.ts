import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const composioApiKey = Deno.env.get('COMPOSIO_API_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface AuthRequest {
  action: 'initiate' | 'check_status';
  userId: string;
  authConfigId?: string;
  integrationId?: string;
  connectionRequestId?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, userId, authConfigId, integrationId, connectionRequestId }: AuthRequest = await req.json();
    
    console.log('Composio auth request:', { action, userId, authConfigId, integrationId, connectionRequestId });

    if (!composioApiKey) {
      throw new Error('Composio API key not configured');
    }

    if (action === 'initiate') {
      if (!authConfigId || !integrationId) {
        throw new Error('Missing required parameters for initiation');
      }

      // Initiate connection with Composio v3 API
      const response = await fetch('https://backend.composio.dev/api/v3/connected-accounts/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': composioApiKey,
        },
        body: JSON.stringify({
          integrationId: integrationId,
          data: {},
          authConfig: authConfigId,
          userUuid: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Composio API error:', errorData);
        throw new Error(`Failed to initiate connection: ${response.status}`);
      }

      const connectionData = await response.json();
      
      console.log('Composio connection initiated:', connectionData);

      // Store connection request in database for tracking
      await supabase
        .from('composio_connections')
        .upsert({
          user_id: userId,
          integration_id: integrationId,
          auth_config_id: authConfigId,
          connection_request_id: connectionData.connectionStatus?.id || connectionData.id,
          status: 'pending',
          redirect_url: connectionData.redirectUrl,
          created_at: new Date().toISOString(),
        });

      return new Response(JSON.stringify({
        redirectUrl: connectionData.redirectUrl,
        connectionRequestId: connectionData.connectionStatus?.id || connectionData.id,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'check_status') {
      if (!connectionRequestId) {
        throw new Error('Missing connection request ID');
      }

      // Check connection status with Composio
      const response = await fetch(`https://backend.composio.dev/api/v1/connectedAccounts/${connectionRequestId}`, {
        method: 'GET',
        headers: {
          'X-API-Key': composioApiKey,
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Composio status check error:', errorData);
        throw new Error(`Failed to check status: ${response.status}`);
      }

      const statusData = await response.json();
      console.log('Composio connection status:', statusData);

      // Update database with current status
      if (statusData.status === 'ACTIVE') {
        await supabase
          .from('composio_connections')
          .update({
            status: 'completed',
            connection_id: statusData.id,
            updated_at: new Date().toISOString(),
          })
          .eq('connection_request_id', connectionRequestId)
          .eq('user_id', userId);

        return new Response(JSON.stringify({
          status: 'completed',
          connectionId: statusData.id,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({
        status: 'pending',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error in composio-auth function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});