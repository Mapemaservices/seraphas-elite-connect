-- Create live stream messages table for real-time chat
CREATE TABLE public.live_stream_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create live stream viewers table to track who's watching
CREATE TABLE public.live_stream_viewers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    stream_id UUID NOT NULL REFERENCES public.live_streams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(stream_id, user_id)
);

-- Enable RLS
ALTER TABLE public.live_stream_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_stream_viewers ENABLE ROW LEVEL SECURITY;

-- RLS policies for live_stream_messages
CREATE POLICY "Users can view all stream messages" 
ON public.live_stream_messages 
FOR SELECT 
USING (true);

CREATE POLICY "Users can send messages to streams" 
ON public.live_stream_messages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS policies for live_stream_viewers
CREATE POLICY "Users can view stream viewers" 
ON public.live_stream_viewers 
FOR SELECT 
USING (true);

CREATE POLICY "Users can join/leave streams" 
ON public.live_stream_viewers 
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Enable realtime for new tables
ALTER publication supabase_realtime ADD TABLE public.live_stream_messages;
ALTER publication supabase_realtime ADD TABLE public.live_stream_viewers;
ALTER publication supabase_realtime ADD TABLE public.live_streams;

-- Set replica identity for realtime updates
ALTER TABLE public.live_stream_messages REPLICA IDENTITY FULL;
ALTER TABLE public.live_stream_viewers REPLICA IDENTITY FULL;
ALTER TABLE public.live_streams REPLICA IDENTITY FULL;