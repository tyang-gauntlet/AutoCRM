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

-- Seed knowledge base articles with comprehensive content
INSERT INTO public.kb_articles (title, slug, content, category_id, status, metadata)
VALUES
  (
    'Getting Started with AutoCRM',
    'getting-started-guide',
    '# Getting Started with AutoCRM

Welcome to AutoCRM! This comprehensive guide will help you get started with our platform and make the most of its features.

## Quick Setup Guide

1. **Account Setup**
   - Log in to your account
   - Complete your profile information
   - Set up your preferences

2. **Key Features**
   - Ticket Management
   - Knowledge Base
   - AI Assistant
   - Analytics Dashboard

3. **First Steps**
   - Create your first ticket
   - Browse the knowledge base
   - Set up notifications

## Best Practices

- Keep your profile updated
- Check notifications regularly
- Use ticket categories effectively

## Need Help?

Contact our support team or use the AI assistant for immediate help.',
    (SELECT id FROM public.kb_categories WHERE slug = 'getting-started'),
    'published',
    '{"view_count": 150, "helpful_count": 45}'
  ),
  (
    'Security Best Practices',
    'security-best-practices',
    '# Security Best Practices

Protect your account and data with these essential security practices.

## Password Guidelines

- Use strong, unique passwords
- Enable two-factor authentication
- Change passwords regularly

## Access Management

1. **User Roles**
   - Admin
   - Support Agent
   - Regular User

2. **Permissions**
   - Understanding access levels
   - Managing team permissions
   - Audit logs

## Data Protection

- Regular backups
- Encryption standards
- Privacy compliance',
    (SELECT id FROM public.kb_categories WHERE slug = 'security'),
    'published',
    '{"view_count": 120, "helpful_count": 38}'
  ),
  (
    'Troubleshooting Common Issues',
    'common-troubleshooting',
    '# Troubleshooting Common Issues

Solutions to frequently encountered problems and how to resolve them quickly.

## Login Issues

1. **Cannot Log In**
   - Clear browser cache
   - Reset password
   - Check email verification

2. **Account Locked**
   - Multiple failed attempts
   - Security triggers
   - Resolution steps

## Performance

- Browser compatibility
- Cache clearing
- System requirements

## Error Messages

Common error codes and their solutions:
- Error 404: Page not found
- Error 403: Access denied
- Error 500: Server error',
    (SELECT id FROM public.kb_categories WHERE slug = 'troubleshooting'),
    'published',
    '{"view_count": 200, "helpful_count": 75}'
  ),
  (
    'API Integration Guide',
    'api-integration',
    '# API Integration Guide

Complete guide to integrating AutoCRM with your applications.

## Authentication

```javascript
const api = new AutoCRM({
  apiKey: "your-api-key",
  environment: "production"
});
```

## Common Endpoints

1. **Tickets**
   - GET /api/tickets
   - POST /api/tickets
   - PUT /api/tickets/{id}

2. **Users**
   - GET /api/users
   - POST /api/users
   - PUT /api/users/{id}

## Rate Limits

- 1000 requests per minute
- Burst limit: 100 requests
- Rate limit headers

## Error Handling

Best practices for handling API errors and responses.',
    (SELECT id FROM public.kb_categories WHERE slug = 'api'),
    'published',
    '{"view_count": 180, "helpful_count": 60}'
  ),
  (
    'Account Management Guide',
    'account-management',
    '# Account Management Guide

Learn how to manage your AutoCRM account effectively.

## Profile Settings

1. **Personal Information**
   - Update contact details
   - Change profile picture
   - Set time zone

2. **Notification Preferences**
   - Email notifications
   - In-app alerts
   - Mobile push notifications

## Subscription Management

- View current plan
- Upgrade options
- Billing history

## Team Management

- Invite team members
- Assign roles
- Manage permissions',
    (SELECT id FROM public.kb_categories WHERE slug = 'account'),
    'published',
    '{"view_count": 90, "helpful_count": 30}'
  ),
  (
    'Integration with Popular Tools',
    'popular-integrations',
    '# Integration with Popular Tools

Connect AutoCRM with your favorite tools and services.

## Available Integrations

1. **Communication**
   - Slack
   - Microsoft Teams
   - Discord

2. **Project Management**
   - Jira
   - Trello
   - Asana

3. **CRM Systems**
   - Salesforce
   - HubSpot
   - Zoho

## Setup Guides

Step-by-step instructions for each integration.

## Troubleshooting

Common integration issues and solutions.',
    (SELECT id FROM public.kb_categories WHERE slug = 'integrations'),
    'published',
    '{"view_count": 85, "helpful_count": 28}'
  ),
  (
    'Best Practices for Support Teams',
    'support-team-best-practices',
    '# Best Practices for Support Teams

Optimize your support operations with these proven practices.

## Ticket Management

1. **Prioritization**
   - Understanding urgency
   - Response time goals
   - Escalation procedures

2. **Communication**
   - Professional tone
   - Clear explanations
   - Follow-up protocols

## Quality Assurance

- Regular reviews
- Customer feedback
- Team training

## Metrics & KPIs

- Response time
- Resolution rate
- Customer satisfaction',
    (SELECT id FROM public.kb_categories WHERE slug = 'best-practices'),
    'published',
    '{"view_count": 110, "helpful_count": 42}'
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