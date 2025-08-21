-- Create guests table to store guest user sessions
CREATE TABLE public.guests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    session_id TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    last_active_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chats table for conversations
CREATE TABLE public.chats (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    guest_id UUID REFERENCES public.guests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    CONSTRAINT chats_user_check CHECK (
        (guest_id IS NOT NULL AND user_id IS NULL) OR 
        (guest_id IS NULL AND user_id IS NOT NULL)
    )
);

-- Create messages table for chat messages
CREATE TABLE public.messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_guests_session_id ON public.guests(session_id);
CREATE INDEX idx_chats_guest_id ON public.chats(guest_id);
CREATE INDEX idx_chats_user_id ON public.chats(user_id);
CREATE INDEX idx_messages_chat_id ON public.messages(chat_id);

-- RLS Policies for guests table
CREATE POLICY "Guests can manage their own data" 
ON public.guests 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- RLS Policies for chats table
CREATE POLICY "Users can view their own chats" 
ON public.chats 
FOR SELECT 
USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR 
    (guest_id IS NOT NULL)
);

CREATE POLICY "Users can create their own chats" 
ON public.chats 
FOR INSERT 
WITH CHECK (
    (auth.uid() IS NOT NULL AND user_id = auth.uid() AND guest_id IS NULL) OR 
    (guest_id IS NOT NULL AND user_id IS NULL)
);

CREATE POLICY "Users can update their own chats" 
ON public.chats 
FOR UPDATE 
USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR 
    (guest_id IS NOT NULL)
);

CREATE POLICY "Users can delete their own chats" 
ON public.chats 
FOR DELETE 
USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR 
    (guest_id IS NOT NULL)
);

-- RLS Policies for messages table
CREATE POLICY "Users can view messages in their chats" 
ON public.messages 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.chats 
        WHERE chats.id = messages.chat_id 
        AND (
            (auth.uid() IS NOT NULL AND chats.user_id = auth.uid()) OR 
            (chats.guest_id IS NOT NULL)
        )
    )
);

CREATE POLICY "Users can create messages in their chats" 
ON public.messages 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.chats 
        WHERE chats.id = messages.chat_id 
        AND (
            (auth.uid() IS NOT NULL AND chats.user_id = auth.uid()) OR 
            (chats.guest_id IS NOT NULL)
        )
    )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_chats_updated_at
    BEFORE UPDATE ON public.chats
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_guests_last_active
    BEFORE UPDATE ON public.guests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();