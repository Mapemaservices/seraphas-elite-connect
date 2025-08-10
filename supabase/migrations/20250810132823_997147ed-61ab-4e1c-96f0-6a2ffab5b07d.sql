-- Add stream_url column to live_streams table to store camera feed URL
ALTER TABLE public.live_streams 
ADD COLUMN stream_url TEXT;

-- Create a table to store stream connection data for WebRTC
CREATE TABLE public.stream_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stream_id UUID NOT NULL,
  connection_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stream_connections ENABLE ROW LEVEL SECURITY;

-- Create policies for stream connections
CREATE POLICY "Anyone can view stream connections" 
ON public.stream_connections 
FOR SELECT 
USING (true);

CREATE POLICY "Streamers can manage their stream connections" 
ON public.stream_connections 
FOR ALL 
USING (
  stream_id IN (
    SELECT id FROM public.live_streams 
    WHERE streamer_id = auth.uid()
  )
);

-- Add trigger for timestamps
CREATE TRIGGER update_stream_connections_updated_at
BEFORE UPDATE ON public.stream_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for stream connections
ALTER TABLE public.stream_connections REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stream_connections;