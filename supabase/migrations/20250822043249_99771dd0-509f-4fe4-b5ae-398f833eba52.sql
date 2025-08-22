-- Create table for tracking Composio connections
CREATE TABLE public.composio_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  integration_id TEXT NOT NULL,
  auth_config_id TEXT NOT NULL,
  connection_request_id TEXT,
  connection_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  redirect_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.composio_connections ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
CREATE POLICY "Users can view their own composio connections" 
ON public.composio_connections 
FOR SELECT 
USING (user_id = COALESCE(auth.uid()::text, current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users can create their own composio connections" 
ON public.composio_connections 
FOR INSERT 
WITH CHECK (user_id = COALESCE(auth.uid()::text, current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Users can update their own composio connections" 
ON public.composio_connections 
FOR UPDATE 
USING (user_id = COALESCE(auth.uid()::text, current_setting('request.jwt.claims', true)::json->>'sub'));

CREATE POLICY "Service role can manage all composio connections" 
ON public.composio_connections 
FOR ALL 
USING (current_user = 'service_role');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_composio_connections_updated_at
BEFORE UPDATE ON public.composio_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for better performance
CREATE INDEX idx_composio_connections_user_id ON public.composio_connections(user_id);
CREATE INDEX idx_composio_connections_status ON public.composio_connections(status);
CREATE INDEX idx_composio_connections_integration_id ON public.composio_connections(integration_id);