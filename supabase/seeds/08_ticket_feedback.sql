-- Seed ticket feedback for closed tickets
INSERT INTO public.ticket_feedback (id, ticket_id, rating, comment, created_at, updated_at)
VALUES
  (
    '67890abc-def0-1234-5678-9abcdef01234',
    'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
    5,
    'Great support! Issue was resolved quickly and the solution worked perfectly.',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  ),
  (
    '89abcdef-0123-4567-89ab-cdef01234567',
    'b2c3d4e5-f6a7-5b6c-9d8e-0f1a2b3c4d5e',
    4,
    'Good response to feature request, looking forward to the dark mode implementation.',
    NOW() - INTERVAL '12 hours',
    NOW() - INTERVAL '12 hours'
  ); 