-- Seed interactions data
INSERT INTO public.interactions (customer_id, user_id, type, content, metadata)
VALUES
  (
    'f0742c9b-9d18-4b2e-940e-ac43ad89b6b6',
    'e16c304f-87f9-4d4c-a5c8-26a551a4c425',
    'email',
    'Initial contact regarding services',
    jsonb_build_object(
      'source', 'email',
      'status', 'completed',
      'response_time', '2h',
      'sentiment', 'positive'
    )
  ),
  (
    'f0742c9b-9d18-4b2e-940e-ac43ad89b6b6',
    'e16c304f-87f9-4d4c-a5c8-26a551a4c425',
    'call',
    'Follow-up call about proposal',
    jsonb_build_object(
      'duration', '15min',
      'outcome', 'positive',
      'next_steps', 'Send proposal'
    )
  ),
  (
    '748d9f7d-7e75-4acd-9302-dddf597b3acb',
    'e16c304f-87f9-4d4c-a5c8-26a551a4c425',
    'meeting',
    'Product demo meeting',
    jsonb_build_object(
      'location', 'virtual',
      'duration', '30min',
      'attendees', 3,
      'demo_version', '2.1.0'
    )
  ),
  (
    '3d53bd74-c4c3-4147-a825-c3d4fae485e7',
    'e16c304f-87f9-4d4c-a5c8-26a551a4c425',
    'email',
    'Service renewal discussion',
    jsonb_build_object(
      'source', 'email',
      'status', 'pending',
      'renewal_date', '2024-06-01',
      'current_plan', 'enterprise'
    )
  ); 