-- First create users in auth.users with all required fields
INSERT INTO auth.users (
    id,
    email,
    raw_user_meta_data,
    raw_app_meta_data,
    created_at,
    updated_at,
    aud,
    role,
    instance_id,
    email_confirmed_at,
    encrypted_password,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    last_sign_in_at,
    is_sso_user,
    deleted_at
)
VALUES
  (
    'd0d4dc14-7c31-4c26-87fa-31e0c0f40c91',
    'admin@example.com',
    jsonb_build_object(
        'full_name', 'Admin User'
    ),
    jsonb_build_object('role', 'admin'),
    now(),
    now(),
    'authenticated',
    'authenticated',
    '00000000-0000-0000-0000-000000000000',
    now(),
    crypt('admin123', gen_salt('bf')),
    encode(gen_random_bytes(32), 'hex'),
    encode(gen_random_bytes(32), 'hex'),
    encode(gen_random_bytes(32), 'hex'),
    'admin@example.com',
    now(),
    FALSE,
    NULL
  ),
  (
    'e16c304f-87f9-4d4c-a5c8-26a551a4c425',
    'user@example.com',
    jsonb_build_object(
        'full_name', 'Regular User'
    ),
    jsonb_build_object('role', 'user'),
    now(),
    now(),
    'authenticated',
    'authenticated',
    '00000000-0000-0000-0000-000000000000',
    now(),
    crypt('user123', gen_salt('bf')),
    encode(gen_random_bytes(32), 'hex'),
    encode(gen_random_bytes(32), 'hex'),
    encode(gen_random_bytes(32), 'hex'),
    'user@example.com',
    now(),
    FALSE,
    NULL
  ),
  (
    'f7c6d5e4-b3a2-4c91-8c7d-1a2b3c4d5e6f',
    'reviewer@example.com',
    jsonb_build_object(
        'full_name', 'Ticket Reviewer'
    ),
    jsonb_build_object('role', 'reviewer'),
    now(),
    now(),
    'authenticated',
    'authenticated',
    '00000000-0000-0000-0000-000000000000',
    now(),
    crypt('reviewer123', gen_salt('bf')),
    encode(gen_random_bytes(32), 'hex'),
    encode(gen_random_bytes(32), 'hex'),
    encode(gen_random_bytes(32), 'hex'),
    'reviewer@example.com',
    now(),
    FALSE,
    NULL
  );

-- Create identities for the users
INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
)
VALUES
  (
    'd0d4dc14-7c31-4c26-87fa-31e0c0f40c91',
    'd0d4dc14-7c31-4c26-87fa-31e0c0f40c91',
    jsonb_build_object(
        'sub', 'd0d4dc14-7c31-4c26-87fa-31e0c0f40c91',
        'email', 'admin@example.com',
        'email_verified', true
    ),
    'email',
    'admin@example.com',
    now(),
    now(),
    now()
  ),
  (
    'e16c304f-87f9-4d4c-a5c8-26a551a4c425',
    'e16c304f-87f9-4d4c-a5c8-26a551a4c425',
    jsonb_build_object(
        'sub', 'e16c304f-87f9-4d4c-a5c8-26a551a4c425',
        'email', 'user@example.com',
        'email_verified', true
    ),
    'email',
    'user@example.com',
    now(),
    now(),
    now()
  ),
  (
    'f7c6d5e4-b3a2-4c91-8c7d-1a2b3c4d5e6f',
    'f7c6d5e4-b3a2-4c91-8c7d-1a2b3c4d5e6f',
    jsonb_build_object(
        'sub', 'f7c6d5e4-b3a2-4c91-8c7d-1a2b3c4d5e6f',
        'email', 'reviewer@example.com',
        'email_verified', true
    ),
    'email',
    'reviewer@example.com',
    now(),
    now(),
    now()
  );

-- Seed data for customers
INSERT INTO public.customers (id, name, email, phone, company, status)
VALUES
  ('f0742c9b-9d18-4b2e-940e-ac43ad89b6b6', 'John Smith', 'john.smith@example.com', '+1-555-0123', 'Tech Corp', 'active'),
  ('748d9f7d-7e75-4acd-9302-dddf597b3acb', 'Jane Doe', 'jane.doe@example.com', '+1-555-0124', 'Design Co', 'active'),
  ('3d53bd74-c4c3-4147-a825-c3d4fae485e7', 'Bob Johnson', 'bob.j@example.com', '+1-555-0125', 'Marketing Inc', 'inactive');

-- Update interactions to use regular user
INSERT INTO public.interactions (customer_id, user_id, type, content, metadata)
VALUES
  ('f0742c9b-9d18-4b2e-940e-ac43ad89b6b6', 'e16c304f-87f9-4d4c-a5c8-26a551a4c425', 'email', 'Initial contact regarding services', '{"source": "email", "status": "completed"}'),
  ('f0742c9b-9d18-4b2e-940e-ac43ad89b6b6', 'e16c304f-87f9-4d4c-a5c8-26a551a4c425', 'call', 'Follow-up call about proposal', '{"duration": "15min", "outcome": "positive"}'),
  ('748d9f7d-7e75-4acd-9302-dddf597b3acb', 'e16c304f-87f9-4d4c-a5c8-26a551a4c425', 'meeting', 'Product demo meeting', '{"location": "virtual", "duration": "30min"}'),
  ('3d53bd74-c4c3-4147-a825-c3d4fae485e7', 'e16c304f-87f9-4d4c-a5c8-26a551a4c425', 'email', 'Service renewal discussion', '{"source": "email", "status": "pending"}');

-- Update auth.users confirmation
UPDATE auth.users
SET email_confirmed_at = CURRENT_TIMESTAMP
WHERE email IN ('admin@example.com', 'user@example.com', 'reviewer@example.com');

-- Update the profiles with correct roles after trigger creates them
UPDATE public.profiles 
SET role = 'admin',
    full_name = 'Admin User'
WHERE id = 'd0d4dc14-7c31-4c26-87fa-31e0c0f40c91';

UPDATE public.profiles 
SET role = 'reviewer',
    full_name = 'Ticket Reviewer'
WHERE id = 'f7c6d5e4-b3a2-4c91-8c7d-1a2b3c4d5e6f';

UPDATE public.profiles 
SET role = 'user',
    full_name = 'Regular User'
WHERE id = 'e16c304f-87f9-4d4c-a5c8-26a551a4c425';

-- Add this after all updates to force metadata sync
DO $$
BEGIN
  -- Force trigger execution for all profiles
  UPDATE public.profiles 
  SET updated_at = NOW()
  WHERE id IN (
    'd0d4dc14-7c31-4c26-87fa-31e0c0f40c91',
    'e16c304f-87f9-4d4c-a5c8-26a551a4c425',
    'f7c6d5e4-b3a2-4c91-8c7d-1a2b3c4d5e6f'
  );
END $$;

-- Seed knowledge base categories
INSERT INTO public.kb_categories (name, slug, description)
VALUES
  ('Getting Started', 'getting-started', 'Essential guides and tutorials to help you get up and running with AutoCRM. Perfect for new users.'),
  ('Account Management', 'account', 'Learn how to manage your account settings, security, and user preferences effectively.'),
  ('Troubleshooting', 'troubleshooting', 'Solutions to common issues, error messages, and technical problems you might encounter.'),
  ('Best Practices', 'best-practices', 'Expert tips, recommendations, and industry standards for optimal usage of AutoCRM.'),
  ('API Documentation', 'api', 'Comprehensive technical documentation for API integration, including examples and use cases.'),
  ('Security & Privacy', 'security', 'Important information about security features, data protection, and privacy settings.'),
  ('Integrations', 'integrations', 'Guides for connecting AutoCRM with other tools and services in your workflow.');

-- First, ensure we have all our tags
insert into public.kb_tags (name, description) values
    ('getting-started', 'Basic introduction and setup guides'),
    ('troubleshooting', 'Common issues and their solutions'),
    ('api', 'API documentation and examples'),
    ('security', 'Security-related information'),
    ('deployment', 'Deployment guides and best practices'),
    ('configuration', 'Configuration and settings'),
    ('best-practices', 'Recommended approaches and patterns'),
    ('faq', 'Frequently asked questions'),
    ('features', 'Feature documentation and usage'),
    ('integrations', 'Third-party integration guides'),
    ('updates', 'Product updates and changelog'),
    ('tutorials', 'Step-by-step tutorials'),
    ('reference', 'Technical reference documentation'),
    ('architecture', 'System architecture documentation'),
    ('performance', 'Performance optimization guides')
on conflict (name) do nothing;

-- Update existing articles with tags
update public.kb_articles
set tags = array['getting-started', 'configuration']
where slug = 'getting-started-guide';

update public.kb_articles
set tags = array['security', 'best-practices']
where slug = 'security-best-practices';

update public.kb_articles
set tags = array['troubleshooting', 'api']
where slug = 'common-troubleshooting';

update public.kb_articles
set tags = array['api', 'integration']
where slug = 'api-integration';

update public.kb_articles
set tags = array['account', 'getting-started']
where slug = 'account-management';

update public.kb_articles
set tags = array['integration', 'configuration']
where slug = 'popular-integrations';

update public.kb_articles
set tags = array['best-practices', 'support']
where slug = 'support-team-best-practices';

-- Add some new articles with tags
INSERT INTO public.kb_articles (
    id,
    title,
    content,
    slug,
    status,
    created_by,
    created_at,
    updated_at,
    category_id,
    tags
) VALUES
(
    'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
    'Getting Started with AutoCRM',
    '# Getting Started with AutoCRM\n\nWelcome to AutoCRM! This comprehensive guide will help you get started with our platform and make the most of its features.\n\n## Quick Setup Guide\n\n1. **Account Setup**\n   - Log in to your account\n   - Complete your profile information\n   - Set up your preferences\n\n2. **Key Features**\n   - Ticket Management\n   - Knowledge Base\n   - AI Assistant\n   - Analytics Dashboard\n\n3. **First Steps**\n   - Create your first ticket\n   - Browse the knowledge base\n   - Set up notifications\n\n## Best Practices\n\n- Keep your profile updated\n- Check notifications regularly\n- Use ticket categories effectively\n\n## Need Help?\n\nContact our support team or use the AI assistant for immediate help.',
    'getting-started-guide',
    'published',
    'f7c6d5e4-b3a2-4c91-8c7d-1a2b3c4d5e6f',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days',
    (SELECT id FROM public.kb_categories WHERE slug = 'getting-started'),
    ARRAY['getting-started', 'configuration']
),
(
    'b2c3d4e5-f6a7-4b5b-8c7d-9e0f1a2b3c4d',
    'Security Best Practices',
    '# Security Best Practices\n\nProtect your account and data with these essential security guidelines.',
    'security-best-practices',
    'published',
    'f7c6d5e4-b3a2-4c91-8c7d-1a2b3c4d5e6f',
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '25 days',
    (SELECT id FROM public.kb_categories WHERE slug = 'security'),
    ARRAY['security', 'best-practices']
),
(
    'c3d4e5f6-a7b8-4b5b-8c7d-9e0f1a2b3c4d',
    'API Integration Guide',
    '# API Integration Guide\n\nComplete guide to integrating with our API platform.',
    'api-integration',
    'published',
    'f7c6d5e4-b3a2-4c91-8c7d-1a2b3c4d5e6f',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '20 days',
    (SELECT id FROM public.kb_categories WHERE slug = 'api'),
    ARRAY['api', 'integration']
),
(
    'd4e5f6a7-b8c9-4b5b-8c7d-9e0f1a2b3c4d',
    'Troubleshooting Common Issues',
    '# Troubleshooting Guide\n\nSolutions to frequently encountered problems.',
    'common-troubleshooting',
    'published',
    'f7c6d5e4-b3a2-4c91-8c7d-1a2b3c4d5e6f',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '15 days',
    (SELECT id FROM public.kb_categories WHERE slug = 'troubleshooting'),
    ARRAY['troubleshooting', 'api']
),
(
    'e5f6a7b8-c9d0-4b5b-8c7d-9e0f1a2b3c4d',
    'Account Management Guide',
    '# Account Management\n\nLearn how to manage your account effectively.',
    'account-management',
    'published',
    'f7c6d5e4-b3a2-4c91-8c7d-1a2b3c4d5e6f',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days',
    (SELECT id FROM public.kb_categories WHERE slug = 'account'),
    ARRAY['account', 'getting-started']
),
(
    'f6a7b8c9-d0e1-4b5b-8c7d-9e0f1a2b3c4d',
    'Integration with Popular Tools',
    '# Popular Integrations\n\nConnect AutoCRM with your favorite tools.',
    'popular-integrations',
    'published',
    'f7c6d5e4-b3a2-4c91-8c7d-1a2b3c4d5e6f',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days',
    (SELECT id FROM public.kb_categories WHERE slug = 'integrations'),
    ARRAY['integration', 'configuration']
),
(
    'a7b8c9d0-e1f2-4b5b-8c7d-9e0f1a2b3c4d',
    'Best Practices for Support Teams',
    '# Support Team Best Practices\n\nOptimize your support workflow.',
    'support-team-best-practices',
    'published',
    'f7c6d5e4-b3a2-4c91-8c7d-1a2b3c4d5e6f',
    NOW(),
    NOW(),
    (SELECT id FROM public.kb_categories WHERE slug = 'best-practices'),
    ARRAY['best-practices', 'support']
);

-- Seed tickets for testing
INSERT INTO public.tickets (id, title, description, priority, status, created_by, customer_id, assigned_to, created_at, updated_at)
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
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
  );

-- Seed ticket messages
INSERT INTO public.ticket_messages (id, ticket_id, content, sender_id, is_ai, created_at)
VALUES
  (
    'd4e5f6a7-b8c9-7d0e-1f2a-3b4c5d6e7f8a',
    'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
    'I tried resetting my password but still cannot log in.',
    'e16c304f-87f9-4d4c-a5c8-26a551a4c425',
    false,
    NOW() - INTERVAL '5 days'
  ),
  (
    'e5f6a7b8-c9d0-8e1f-2a3b-4c5d6e7f8a9b',
    'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
    'Have you cleared your browser cache? This often helps with login issues.',
    'f7c6d5e4-b3a2-4c91-8c7d-1a2b3c4d5e6f',
    false,
    NOW() - INTERVAL '4 days'
  ),
  (
    'f6a7b8c9-d0e1-9f2a-3b4c-5d6e7f8a9b0c',
    'b2c3d4e5-f6a7-5b6c-9d8e-0f1a2b3c4d5e',
    'Would love to see a dark mode option for better night-time usage.',
    'e16c304f-87f9-4d4c-a5c8-26a551a4c425',
    false,
    NOW() - INTERVAL '3 days'
  ),
  (
    'a7b8c9d0-e1f2-a3b4-c5d6-e7f8a9b0c1d2',
    'b2c3d4e5-f6a7-5b6c-9d8e-0f1a2b3c4d5e',
    'Thanks for the suggestion. We''ll add this to our roadmap.',
    'f7c6d5e4-b3a2-4c91-8c7d-1a2b3c4d5e6f',
    false,
    NOW() - INTERVAL '2 days'
  ),
  (
    'b8c9d0e1-f2a3-b4c5-d6e7-f8a9b0c1d2e3',
    'c3d4e5f6-a7b8-6c7d-0e9f-1a2b3c4d5e6f',
    'I need help integrating your API with our system.',
    'e16c304f-87f9-4d4c-a5c8-26a551a4c425',
    false,
    NOW() - INTERVAL '1 day'
  );

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