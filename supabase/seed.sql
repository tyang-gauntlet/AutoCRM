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
insert into public.kb_categories (name, slug, description) values
    ('Getting Started', 'getting-started', 'Essential guides to help you get up and running'),
    ('Account Management', 'account', 'Learn how to manage your account settings'),
    ('Troubleshooting', 'troubleshooting', 'Common issues and their solutions'),
    ('Best Practices', 'best-practices', 'Tips and recommendations for optimal usage'),
    ('API Documentation', 'api', 'Technical documentation for API integration');

-- Seed knowledge base articles
insert into public.kb_articles (title, slug, content, category_id, status) values
    (
        'Welcome to AutoCRM',
        'welcome-to-autocrm',
        '# Welcome to AutoCRM

Welcome to AutoCRM! This guide will help you get started with our platform. AutoCRM is a powerful customer relationship management system designed to help you manage customer interactions effectively.

## Key Features

- **Customer Management**: Track and manage customer information
- **Ticket Tracking**: Handle support requests efficiently
- **Knowledge Base**: Access helpful documentation
- **AI-powered Support**: Get instant assistance

## Getting Started

1. **Sign Up**: Create your account
2. **Setup Profile**: Complete your organization details
3. **Import Data**: Bring your existing customer data
4. **Customize**: Configure settings to match your workflow

## Need Help?

- Check our documentation
- Contact support
- Join our community

Follow our getting started guide to make the most of AutoCRM.',
        (select id from public.kb_categories where slug = 'getting-started'),
        'published'
    ),
    (
        'How to Reset Your Password',
        'how-to-reset-password',
        '# How to Reset Your Password

Forgot your password? No worries! Follow these simple steps to reset it.

## Step-by-Step Guide

1. **Access the Login Page**
   - Go to the login page
   - Click on the "Forgot Password" link

2. **Request Reset**
   - Enter your email address
   - Click "Send Reset Instructions"

3. **Check Your Email**
   - Look for the reset email
   - Click the reset link in the email
   - *Note: Check spam folder if not found*

4. **Create New Password**
   - Enter your new password
   - Confirm the password
   - Click "Reset Password"

## Troubleshooting

If you don''t receive the reset email:
- Check your spam/junk folder
- Verify the email address is correct
- Contact support if issues persist

## Security Tips

- Choose a strong password
- Don''t reuse passwords
- Enable two-factor authentication',
        (select id from public.kb_categories where slug = 'account'),
        'published'
    ),
    (
        'Common Login Issues',
        'common-login-issues',
        '# Common Login Issues

Having trouble logging in? Here are some common issues and their solutions.

## 1. Incorrect Password

### Symptoms
- "Invalid password" error
- Multiple failed login attempts

### Solutions
- Make sure caps lock is off
- Reset your password if needed
- Check for extra spaces

## 2. Account Locked

### Why It Happens
- Too many failed login attempts
- Security precaution

### What to Do
- Wait 15 minutes and try again
- Contact support if the issue persists
- Reset your password

## 3. Browser Issues

### Common Problems
- Cached credentials
- Cookie issues
- Browser compatibility

### Solutions
- Clear your browser cache
- Try a different browser
- Enable cookies
- Update your browser

## Prevention Tips

1. Use a password manager
2. Keep your browser updated
3. Enable two-factor authentication
4. Bookmark the correct login page',
        (select id from public.kb_categories where slug = 'troubleshooting'),
        'published'
    ),
    (
        'Best Practices for Customer Support',
        'customer-support-best-practices',
        '# Best Practices for Customer Support

Learn how to provide excellent customer support with these proven practices.

## 1. Response Time

### Business Hours
- Aim to respond within 1 hour
- Set realistic expectations
- Use auto-acknowledgments

### After Hours
- Set up auto-responses
- Clearly communicate availability
- Provide emergency contact info

## 2. Communication

### Best Practices
- Be clear and concise
- Use a professional tone
- Provide step-by-step instructions

### Language Tips
- Avoid technical jargon
- Use positive language
- Be empathetic

## 3. Follow-up

### After Resolution
- Check back with customers
- Ask for feedback
- Document the solution

### Long-term Success
- Monitor satisfaction trends
- Identify common issues
- Update documentation

## 4. Tools and Resources

- Use templates for common issues
- Maintain updated knowledge base
- Track customer interactions
- Use customer feedback surveys',
        (select id from public.kb_categories where slug = 'best-practices'),
        'published'
    ),
    (
        'API Authentication Guide',
        'api-authentication',
        '# API Authentication Guide

Learn how to authenticate with the AutoCRM API.

## 1. API Keys

Generate and use API keys for authentication:

- Generate an API key in your dashboard settings
- Include the key in the Authorization header:
  ```http
  Authorization: Bearer your_api_key_here
  ```
- Keep your API key secure and never expose it in client-side code

## 2. OAuth2 Authentication

For secure application integration:

1. Register your application in the developer portal
2. Implement the OAuth2 flow:
   - Redirect users to our authorization endpoint
   - Receive the authorization code
   - Exchange code for access token
   - Use token for API requests
3. Handle token refresh and expiration

## 3. Rate Limits and Usage

Monitor and manage your API usage:

- **Standard Rate Limits:**
  - 1000 requests per hour per API key
  - 100 requests per minute per endpoint
  
- **Usage Monitoring:**
  - Track usage in real-time via dashboard
  - Set up usage alerts
  - View detailed usage analytics

## Best Practices

1. Implement proper error handling
2. Use retry logic with exponential backoff
3. Cache responses when appropriate
4. Monitor API health and status

Need help? Contact our developer support team.',
        (select id from public.kb_categories where slug = 'api'),
        'published'
    );