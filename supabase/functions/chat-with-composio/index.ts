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
const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  chatId?: string;
  guestId?: string;
  userId?: string;
  integrations?: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, chatId, guestId, userId, integrations = [] }: ChatRequest = await req.json();
    
    console.log('Chat request:', { message, chatId, guestId, userId, integrations });

    // Get available tools from Composio based on user integrations
    const tools = await getComposioTools(integrations);
    
    // Create or get existing chat
    let currentChatId = chatId;
    if (!currentChatId) {
      const newChat = await createChat(guestId, userId, message);
      currentChatId = newChat?.id;
    }

    if (!currentChatId) {
      throw new Error('Failed to create or get chat');
    }

    // Save user message to database
    await saveMessage(currentChatId, message, 'user');

    // Get chat history for context
    const chatHistory = await getChatHistory(currentChatId);

    // Generate response using Gemini with Composio tools
    const response = await generateGeminiResponse(chatHistory, tools);

    // Save assistant message to database
    await saveMessage(currentChatId, response, 'assistant');

    return new Response(JSON.stringify({
      response,
      chatId: currentChatId,
      tools: tools.length > 0 ? tools.map(t => t.name) : []
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chat-with-composio function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to process chat request'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function getComposioTools(integrations: string[]) {
  if (!composioApiKey || integrations.length === 0) {
    return [];
  }

  try {
    const response = await fetch('https://backend.composio.dev/api/v1/tools', {
      headers: {
        'Authorization': `Bearer ${composioApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Composio API error:', response.status, await response.text());
      return [];
    }

    const data = await response.json();
    
    // Filter tools based on user's integrations
    const filteredTools = data.tools?.filter((tool: any) => 
      integrations.includes(tool.app_name?.toLowerCase())
    ) || [];

    console.log(`Found ${filteredTools.length} tools for integrations:`, integrations);
    return filteredTools;
  } catch (error) {
    console.error('Error fetching Composio tools:', error);
    return [];
  }
}

async function generateGeminiResponse(messages: Message[], tools: any[] = []) {
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured');
  }

  try {
    const systemPrompt = `You are Slashy, an AI assistant that helps users complete tasks across different applications. 
    You can access and use various tools when available to help users with their requests.
    
    ${tools.length > 0 ? `Available tools: ${tools.map(t => `- ${t.name}: ${t.description || 'No description'}`).join('\n')}` : 'No external tools currently available.'}
    
    Be helpful, concise, and action-oriented. When users ask you to do something that requires external tools, explain what you can do and guide them through the process.`;

    const geminiMessages = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      ...messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }))
    ];

    const requestBody = {
      contents: geminiMessages,
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.7
      }
    };

    // Add function calling capability if tools are available
    if (tools.length > 0) {
      requestBody.tools = [{
        functionDeclarations: tools.map(tool => ({
          name: tool.name,
          description: tool.description || `Execute ${tool.name} action`,
          parameters: tool.parameters || { type: 'object', properties: {} }
        }))
      }];
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Invalid Gemini response:', data);
      throw new Error('Invalid response from Gemini API');
    }

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error generating Gemini response:', error);
    throw new Error(`Failed to generate response: ${error.message}`);
  }
}

async function createChat(guestId?: string, userId?: string, title?: string) {
  const { data, error } = await supabase
    .from('chats')
    .insert({
      guest_id: guestId,
      user_id: userId,
      title: title?.substring(0, 100) || 'New Chat'
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating chat:', error);
    return null;
  }

  return data;
}

async function saveMessage(chatId: string, content: string, role: 'user' | 'assistant') {
  const { error } = await supabase
    .from('messages')
    .insert({
      chat_id: chatId,
      content,
      role
    });

  if (error) {
    console.error('Error saving message:', error);
  }
}

async function getChatHistory(chatId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('content, role')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })
    .limit(20); // Limit to recent messages

  if (error) {
    console.error('Error fetching chat history:', error);
    return [];
  }

  return (data || []).map(msg => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content
  }));
}