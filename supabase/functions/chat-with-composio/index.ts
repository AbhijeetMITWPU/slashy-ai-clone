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

    // Get available tools from Composio based on user integrations and connections
    const tools = await getComposioTools(integrations, userId || guestId);
    
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
    const response = await generateGeminiResponse(chatHistory, tools, userId || guestId);

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

async function getComposioTools(integrations: string[], userId?: string) {
  if (!composioApiKey || integrations.length === 0 || !userId) {
    console.log('No Composio API key, integrations, or user ID provided');
    return [];
  }

  try {
    console.log('Fetching tools for integrations and user:', integrations, userId);
    
    // First, check which integrations the user has connected
    const { data: connectedIntegrations } = await supabase
      .from('composio_connections')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .in('integration_id', integrations);

    if (!connectedIntegrations || connectedIntegrations.length === 0) {
      console.log('No connected integrations found for user');
      return [];
    }

    console.log('Connected integrations:', connectedIntegrations);

    // Get tools from Composio API for the connected user
    const response = await fetch(`https://backend.composio.dev/api/v1/actions?userId=${userId}`, {
      method: 'GET',
      headers: {
        'X-API-Key': composioApiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch tools from Composio:', response.status);
      return [];
    }

    const allTools = await response.json();
    console.log('Total tools available for user:', allTools.length);

    // Filter tools based on user's connected integrations
    const connectedAppNames = connectedIntegrations.map(conn => conn.integration_id.toLowerCase());
    const filteredTools = allTools.filter((tool: any) => {
      const toolApp = tool.appName?.toLowerCase();
      return connectedAppNames.some(appName => 
        toolApp?.includes(appName) || 
        appName.includes(toolApp)
      );
    });

    console.log('Filtered tools for connected integrations:', filteredTools.length);
    return filteredTools;

  } catch (error) {
    console.error('Error fetching Composio tools:', error);
    return [];
  }
}

async function generateGeminiResponse(messages: Message[], tools: any[] = [], userId?: string) {
  if (!geminiApiKey) {
    console.error('Gemini API key not found');
    return 'I apologize, but the AI service is not properly configured. Please contact support.';
  }

  try {
    console.log('Generating response with Gemini, tools available:', tools.length);

    // Create system message for Slashy - intelligent task handling
    const systemMessage = `You are Slashy, an advanced AI assistant with access to various productivity tools and integrations. 

    Your core capabilities:
    - Smart task analysis and workflow automation
    - Cross-application data management
    - Intelligent tool selection and execution
    - Proactive task suggestions and optimization
    
    Behavioral guidelines:
    1. ANALYZE user intent thoroughly before taking action
    2. SUGGEST the most efficient workflow for complex tasks
    3. USE available tools when they can genuinely help the user
    4. EXPLAIN what you're doing and why
    5. BE PROACTIVE in offering related helpful actions
    6. MAINTAIN context across the conversation
    
    Available integrations and tools: ${tools.length > 0 ? 
      tools.map(t => `${t.name} (${t.appName}) - ${t.description || 'No description'}`).join('\n') : 
      'No connected integrations. Suggest connecting relevant tools for specific tasks.'}
    
    Current conversation context: Help the user accomplish their goals efficiently and intelligently.`;

    // Format messages for Gemini
    const formattedMessages = [
      {
        role: 'user',
        parts: [{ text: systemMessage }]
      },
      ...messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }))
    ];

    // Prepare the request body
    const requestBody: any = {
      contents: formattedMessages,
      generationConfig: {
        temperature: 0.8, // Slightly higher for more creative problem-solving
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    };

    // Add function declarations if tools are available
    if (tools.length > 0) {
      requestBody.tools = [{
        functionDeclarations: tools.map(tool => ({
          name: tool.name,
          description: tool.description || `Execute ${tool.name} action for ${tool.appName}`,
          parameters: tool.parameters || {
            type: 'object',
            properties: {
              task_description: {
                type: 'string',
                description: 'Description of the task to perform'
              }
            },
            required: ['task_description']
          }
        }))
      }];
    }

    console.log('Sending request to Gemini with', formattedMessages.length, 'messages and', tools.length, 'tools');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini response received');

    // Handle function calls if present
    if (data.candidates?.[0]?.content?.parts?.some((part: any) => part.functionCall)) {
      console.log('Function calls detected in response');
      
      const functionCalls = data.candidates[0].content.parts
        .filter((part: any) => part.functionCall);
      
      // For each function call, we could execute it via Composio
      const toolResults = [];
      for (const call of functionCalls) {
        console.log('Would execute tool:', call.functionCall.name, 'with args:', call.functionCall.args);
        
        // Here you would call the actual Composio tool execution
        // For now, we'll simulate the response
        toolResults.push({
          toolName: call.functionCall.name,
          status: 'simulated',
          result: 'Tool execution simulation - integration coming soon!'
        });
      }
      
      const responseText = data.candidates?.[0]?.content?.parts
        ?.find((part: any) => part.text)?.text || 
        `I've identified ${functionCalls.length} action(s) to help you: ${functionCalls.map((call: any) => call.functionCall.name).join(', ')}. Full tool execution is being implemented!`;
      
      return responseText;
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, but I could not generate a response.';

  } catch (error) {
    console.error('Error generating Gemini response:', error);
    return 'I apologize, but I encountered an error while processing your request. Please try again.';
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