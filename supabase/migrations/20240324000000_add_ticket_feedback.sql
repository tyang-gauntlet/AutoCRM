-- Create trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create ticket feedback table
CREATE TABLE IF NOT EXISTS public.ticket_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment to table
COMMENT ON TABLE public.ticket_feedback IS 'Stores user feedback for closed tickets';

-- Enable RLS
ALTER TABLE public.ticket_feedback ENABLE ROW LEVEL SECURITY;

-- Grant access to authenticated users
GRANT ALL ON public.ticket_feedback TO authenticated;

-- RLS Policies

-- Allow users to insert feedback for their tickets
CREATE POLICY "Users can insert feedback for their tickets"
ON public.ticket_feedback
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.tickets
        WHERE tickets.id = ticket_feedback.ticket_id
        AND tickets.created_by = auth.uid()
        AND tickets.status = 'closed'
    )
);

-- Allow users to view feedback for their tickets
CREATE POLICY "Users can view feedback for their tickets"
ON public.ticket_feedback
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.tickets
        WHERE tickets.id = ticket_feedback.ticket_id
        AND tickets.created_by = auth.uid()
    )
);

-- Allow staff to view all feedback
CREATE POLICY "Staff can view all feedback"
ON public.ticket_feedback
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'reviewer')
    )
);

-- Add trigger for updated_at
CREATE TRIGGER set_timestamp
    BEFORE UPDATE ON public.ticket_feedback
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_timestamp(); 