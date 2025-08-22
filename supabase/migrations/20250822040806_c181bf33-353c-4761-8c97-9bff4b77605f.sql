-- Drop the insecure guest policies
DROP POLICY IF EXISTS "Guests can manage their own data" ON public.guests;

-- Create secure RLS policies for guests table
-- Note: Since guests are unauthenticated, we restrict direct access
-- and handle guest operations through controlled edge functions

-- Policy 1: No direct SELECT access for unauthenticated users
CREATE POLICY "Restrict guest data access"
ON public.guests
FOR SELECT
TO anon
USING (false);

-- Policy 2: No direct INSERT access for unauthenticated users  
CREATE POLICY "Restrict guest data creation"
ON public.guests
FOR INSERT
TO anon
WITH CHECK (false);

-- Policy 3: No direct UPDATE access for unauthenticated users
CREATE POLICY "Restrict guest data updates"
ON public.guests
FOR UPDATE
TO anon
USING (false)
WITH CHECK (false);

-- Policy 4: No direct DELETE access for unauthenticated users
CREATE POLICY "Restrict guest data deletion"
ON public.guests
FOR DELETE
TO anon
USING (false);

-- Allow authenticated service role (edge functions) to manage guest data
CREATE POLICY "Service role can manage guests"
ON public.guests
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Update chat policies to be more restrictive for guest chats
DROP POLICY IF EXISTS "Users can view their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can create their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can update their own chats" ON public.chats;
DROP POLICY IF EXISTS "Users can delete their own chats" ON public.chats;

-- Restrictive chat policies - only service role can manage
CREATE POLICY "Service role manages chats"
ON public.chats
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can only see their own chats
CREATE POLICY "Users can view their own chats"
ON public.chats
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chats"
ON public.chats
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND guest_id IS NULL);

CREATE POLICY "Users can update their own chats"
ON public.chats
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chats"
ON public.chats
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Update message policies to be more restrictive
DROP POLICY IF EXISTS "Users can view messages in their chats" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages in their chats" ON public.messages;

-- Service role can manage all messages (for edge functions)
CREATE POLICY "Service role manages messages"
ON public.messages
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Authenticated users can only access messages in their own chats
CREATE POLICY "Users can view messages in their chats"
ON public.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.chats 
    WHERE chats.id = messages.chat_id 
    AND chats.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create messages in their chats"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chats 
    WHERE chats.id = messages.chat_id 
    AND chats.user_id = auth.uid()
  )
);