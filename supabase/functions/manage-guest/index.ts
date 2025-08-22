import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Create admin client with service role key for secure operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface GuestRequest {
  action: 'create' | 'get' | 'update_activity';
  name?: string;
  session_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, name, session_id }: GuestRequest = await req.json();
    
    console.log('Guest management request:', { action, session_id, name });

    // Validate session_id format to prevent injection attacks
    if (!session_id || !session_id.match(/^guest_\d+$/)) {
      throw new Error('Invalid session ID format');
    }

    switch (action) {
      case 'create':
        if (!name) {
          throw new Error('Name is required for guest creation');
        }
        
        // Check if guest already exists
        const { data: existing } = await supabase
          .from('guests')
          .select('*')
          .eq('session_id', session_id)
          .maybeSingle();

        if (existing) {
          return new Response(JSON.stringify(existing), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Create new guest
        const { data: newGuest, error: createError } = await supabase
          .from('guests')
          .insert({
            name,
            session_id
          })
          .select()
          .single();

        if (createError) throw createError;

        console.log('Created new guest:', newGuest.id);
        return new Response(JSON.stringify(newGuest), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'get':
        const { data: guestData, error: getError } = await supabase
          .from('guests')
          .select('*')
          .eq('session_id', session_id)
          .maybeSingle();

        if (getError) throw getError;

        return new Response(JSON.stringify(guestData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      case 'update_activity':
        const { error: updateError } = await supabase
          .from('guests')
          .update({ last_active_at: new Date().toISOString() })
          .eq('session_id', session_id);

        if (updateError) throw updateError;

        console.log('Updated guest activity for session:', session_id);
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in manage-guest function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to manage guest data'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});