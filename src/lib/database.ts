import { supabase } from '@/integrations/supabase/client';

export interface Guest {
  id: string;
  name: string;
  session_id: string;
  created_at: string;
  last_active_at: string;
}

export interface Chat {
  id: string;
  guest_id?: string;
  user_id?: string;
  title?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
}

// Guest Management
export const createGuest = async (name: string, sessionId: string): Promise<Guest | null> => {
  try {
    const { data, error } = await supabase
      .from('guests')
      .insert({
        name,
        session_id: sessionId
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating guest:', error);
    return null;
  }
};

export const getGuestBySessionId = async (sessionId: string): Promise<Guest | null> => {
  try {
    const { data, error } = await supabase
      .from('guests')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching guest:', error);
    return null;
  }
};

export const updateGuestActivity = async (sessionId: string): Promise<void> => {
  try {
    await supabase
      .from('guests')
      .update({ last_active_at: new Date().toISOString() })
      .eq('session_id', sessionId);
  } catch (error) {
    console.error('Error updating guest activity:', error);
  }
};

// Chat Management
export const createChat = async (guestId?: string, userId?: string, title?: string): Promise<Chat | null> => {
  try {
    const { data, error } = await supabase
      .from('chats')
      .insert({
        guest_id: guestId,
        user_id: userId,
        title
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating chat:', error);
    return null;
  }
};

export const getChatsByGuest = async (guestId: string): Promise<Chat[]> => {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('guest_id', guestId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching guest chats:', error);
    return [];
  }
};

export const getChatsByUser = async (userId: string): Promise<Chat[]> => {
  try {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user chats:', error);
    return [];
  }
};

export const updateChatTitle = async (chatId: string, title: string): Promise<void> => {
  try {
    await supabase
      .from('chats')
      .update({ title })
      .eq('id', chatId);
  } catch (error) {
    console.error('Error updating chat title:', error);
  }
};

// Message Management
export const createMessage = async (chatId: string, content: string, role: 'user' | 'assistant'): Promise<Message | null> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        content,
        role
      })
      .select()
      .single();

    if (error) throw error;
    return data as Message;
  } catch (error) {
    console.error('Error creating message:', error);
    return null;
  }
};

export const getMessagesByChat = async (chatId: string): Promise<Message[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []) as Message[];
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
};

export const deleteChat = async (chatId: string): Promise<void> => {
  try {
    await supabase
      .from('chats')
      .delete()
      .eq('id', chatId);
  } catch (error) {
    console.error('Error deleting chat:', error);
  }
};