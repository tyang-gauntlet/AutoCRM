-- Seed tickets data
INSERT INTO public.tickets (
    id,
    title,
    description,
    priority,
    status,
    created_by,
    customer_id,
    assigned_to,
    ai_handled,
    metadata,
    created_at,
    updated_at
)
VALUES
  (
    'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
    'Login Issue',
    'Unable to access account after password reset',
    'high',
    'closed',
    'e16c304f-87f9-4d4c-a5c8-26a551a4c425',
    'f0742c9b-9d18-4b2e-940e-ac43ad89b6b6',
    'f7c6d5e4-b3a2-4c91-8c7d-1a2b3c4d5e6f',
    true,
    jsonb_build_object(
      'browser', 'Chrome',
      'os', 'Windows',
      'resolution_time', '2h 15m',
      'ai_confidence', 0.92
    ),
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '1 day'
  ),
  (
    'b2c3d4e5-f6a7-5b6c-9d8e-0f1a2b3c4d5e',
    'Feature Request',
    'Add dark mode support',
    'medium',
    'closed',
    'e16c304f-87f9-4d4c-a5c8-26a551a4c425',
    '748d9f7d-7e75-4acd-9302-dddf597b3acb',
    'f7c6d5e4-b3a2-4c91-8c7d-1a2b3c4d5e6f',
    false,
    jsonb_build_object(
      'category', 'UI/UX',
      'impact', 'medium',
      'user_votes', 15,
      'planned_release', '2024-Q2'
    ),
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '12 hours'
  ),
  (
    'c3d4e5f6-a7b8-6c7d-0e9f-1a2b3c4d5e6f',
    'Integration Help',
    'Need assistance with API integration',
    'urgent',
    'open',
    'e16c304f-87f9-4d4c-a5c8-26a551a4c425',
    '3d53bd74-c4c3-4147-a825-c3d4fae485e7',
    null,
    false,
    jsonb_build_object(
      'api_version', 'v2',
      'integration_type', 'REST',
      'environment', 'production',
      'blocking_issue', true
    ),
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  );

-- Seed ticket messages
INSERT INTO public.ticket_messages (
    id,
    ticket_id,
    content,
    sender_id,
    is_ai,
    metadata,
    created_at
)
VALUES
  (
    'd4e5f6a7-b8c9-7d0e-1f2a-3b4c5d6e7f8a',
    'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
    'I tried resetting my password but still cannot log in.',
    'e16c304f-87f9-4d4c-a5c8-26a551a4c425',
    false,
    jsonb_build_object(
      'client_info', 'Web Browser',
      'ip_location', 'US',
      'sentiment', 'frustrated'
    ),
    NOW() - INTERVAL '5 days'
  ),
  (
    'e5f6a7b8-c9d0-8e1f-2a3b-4c5d6e7f8a9b',
    'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
    'Have you cleared your browser cache? This often helps with login issues.',
    'f7c6d5e4-b3a2-4c91-8c7d-1a2b3c4d5e6f',
    true,
    jsonb_build_object(
      'ai_model', 'gpt-4',
      'confidence', 0.95,
      'knowledge_source', 'troubleshooting-guide'
    ),
    NOW() - INTERVAL '4 days'
  ),
  (
    'f6a7b8c9-d0e1-9f2a-3b4c-5d6e7f8a9b0c',
    'b2c3d4e5-f6a7-5b6c-9d8e-0f1a2b3c4d5e',
    'Would love to see a dark mode option for better night-time usage.',
    'e16c304f-87f9-4d4c-a5c8-26a551a4c425',
    false,
    jsonb_build_object(
      'user_type', 'premium',
      'usage_time', 'evening',
      'device', 'desktop'
    ),
    NOW() - INTERVAL '3 days'
  ); 