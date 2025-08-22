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
  toolName?: string;
  connectionRequestId?: string;
}

const getUserFromAuth = async (authHeader: string | null) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return null;
    }
    return user;
  } catch (error) {
    console.error('Error validating user token:', error);
    return null;
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate user authentication
    const authHeader = req.headers.get('Authorization');
    const user = await getUserFromAuth(authHeader);
    
    if (!user) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized: Valid authentication required' 
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, toolName, connectionRequestId }: AuthRequest = await req.json();
    
    console.log('Composio auth request:', { action, toolName, connectionRequestId, userId: user.id });

    if (!composioApiKey) {
      return new Response(JSON.stringify({ 
        error: 'Server configuration error: Composio API key not configured' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'initiate') {
      if (!toolName) {
        return new Response(JSON.stringify({ 
          error: 'Bad request: toolName is required for initiation' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Initiate connection with Composio v3 API using correct endpoint
      console.log('Calling Composio API with:', { toolName, userId: user.id });
      
      const response = await fetch('https://backend.composio.dev/api/v3/toolkits/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': composioApiKey,
        },
        body: JSON.stringify({
          toolName,
          userId: user.id,
        }),
      });
      
      console.log('Composio API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Composio API error:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorData
        });
        return new Response(JSON.stringify({ 
          error: `Failed to initiate connection: ${response.status} - ${errorData}` 
        }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const connectionData = await response.json();
      
      console.log('Composio connection initiated:', connectionData);

      // Store connection request in database for tracking
      const dbResult = await supabase
        .from('composio_connections')
        .upsert({
          user_id: user.id,
          integration_id: toolName,
          auth_config_id: toolName, // Using toolName as authConfigId for new API
          connection_request_id: connectionData.connectionStatus?.id || connectionData.id,
          status: 'pending',
          redirect_url: connectionData.redirectUrl,
          created_at: new Date().toISOString(),
        });

      if (dbResult.error) {
        console.error('Database error storing connection:', dbResult.error);
        // Continue anyway - don't fail the OAuth flow due to database issues
      }

      return new Response(JSON.stringify({
        redirectUrl: connectionData.redirectUrl,
        connectionRequestId: connectionData.connectionStatus?.id || connectionData.id,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'check_status') {
      if (!connectionRequestId) {
        return new Response(JSON.stringify({ 
          error: 'Bad request: connectionRequestId is required for status check' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Check connection status with Composio v3 API
      const response = await fetch(`https://backend.composio.dev/api/v3/connected-accounts/${connectionRequestId}`, {
        method: 'GET',
        headers: {
          'X-API-Key': composioApiKey,
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Composio status check error:', errorData);
        return new Response(JSON.stringify({ 
          error: `Failed to check status: ${response.status} - ${errorData}` 
        }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const statusData = await response.json();
      console.log('Composio connection status:', statusData);

      // Update database with current status
      if (statusData.connectionStatus === 'ACTIVE' || statusData.status === 'ACTIVE') {
        await supabase
          .from('composio_connections')
          .update({
            status: 'completed',
            connection_id: statusData.id,
            updated_at: new Date().toISOString(),
          })
          .eq('connection_request_id', connectionRequestId)
          .eq('user_id', user.id);

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

    return new Response(JSON.stringify({ 
      error: 'Bad request: Invalid action' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in composio-auth function:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});