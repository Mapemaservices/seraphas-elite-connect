-- Enable realtime for live stream tables
ALTER TABLE public.live_streams REPLICA IDENTITY FULL;
ALTER TABLE public.live_stream_messages REPLICA IDENTITY FULL;
ALTER TABLE public.live_stream_viewers REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_streams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_stream_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_stream_viewers;