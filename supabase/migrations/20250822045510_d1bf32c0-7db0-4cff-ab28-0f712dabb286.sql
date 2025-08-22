-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', 'User'),
    NEW.raw_user_meta_data ->> 'avatar_url',
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add trigger for automatic timestamp updates on profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update chats table policies to work with authenticated users only
DROP POLICY IF EXISTS "Service role manages chats" ON public.chats;
DROP POLICY IF EXISTS "Users can create their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can delete their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can update their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can view their own chats" ON public.chats;

-- Remove guest_id column from chats (no longer needed)
ALTER TABLE public.chats DROP COLUMN IF EXISTS guest_id;

-- Make user_id required for chats
ALTER TABLE public.chats ALTER COLUMN user_id SET NOT NULL;

-- Create new RLS policies for chats
CREATE POLICY "Users can create their own chats" 
ON public.chats 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own chats" 
ON public.chats 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own chats" 
ON public.chats 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chats" 
ON public.chats 
FOR DELETE 
USING (auth.uid() = user_id);

-- Service role can still manage all chats for edge functions
CREATE POLICY "Service role can manage all chats" 
ON public.chats 
FOR ALL 
USING (current_user = 'service_role');

-- Update composio_connections policies to use proper user authentication
DROP POLICY IF EXISTS "Users can create their own composio connections" ON public.composio_connections;
DROP POLICY IF EXISTS "Users can view their own composio connections" ON public.composio_connections;
DROP POLICY IF EXISTS "Users can update their own composio connections" ON public.composio_connections;

-- Create new policies for composio_connections
CREATE POLICY "Users can create their own composio connections" 
ON public.composio_connections 
FOR INSERT 
WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can view their own composio connections" 
ON public.composio_connections 
FOR SELECT 
USING (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own composio connections" 
ON public.composio_connections 
FOR UPDATE 
USING (user_id = auth.uid()::text);