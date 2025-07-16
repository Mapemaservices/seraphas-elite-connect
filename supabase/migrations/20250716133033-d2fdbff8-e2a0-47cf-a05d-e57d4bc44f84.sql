
-- Add a messages_between_users table for storing chat messages from the discover feature
CREATE TABLE public.messages_between_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.messages_between_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for messages_between_users
CREATE POLICY "Users can view their messages" ON public.messages_between_users
  FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages" ON public.messages_between_users
  FOR INSERT WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update received messages" ON public.messages_between_users
  FOR UPDATE USING (receiver_id = auth.uid());

-- Create index for better performance
CREATE INDEX idx_messages_between_users_sender_receiver 
ON public.messages_between_users(sender_id, receiver_id, created_at DESC);

CREATE INDEX idx_messages_between_users_participants 
ON public.messages_between_users(least(sender_id, receiver_id), greatest(sender_id, receiver_id), created_at DESC);
