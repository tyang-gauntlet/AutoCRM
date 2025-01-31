-- AI Metrics policies (version 20240401000002)
ALTER TABLE public.ai_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to insert metrics"
ON public.ai_metrics
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to view their own metrics"
ON public.ai_metrics
FOR SELECT
TO authenticated
USING (created_by = auth.uid() OR EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = ticket_id
    AND (t.created_by = auth.uid() OR t.assigned_to = auth.uid())
)); 