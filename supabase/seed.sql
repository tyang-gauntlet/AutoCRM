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
    '# Getting Started with AutoCRM

Welcome to AutoCRM! This guide demonstrates all Markdown features.

## Text Formatting

**Bold text** and *italic text* are supported.
***Bold and italic*** together work too.
~~Strikethrough~~ is available.

## Lists

Ordered list:
1. First item
2. Second item
   1. Sub-item 1
   2. Sub-item 2
3. Third item

Unordered list:
- Main point
  - Sub point
  - Another sub point
    - Even deeper
- Another point

## Code Blocks

Inline code: `const greeting = "Hello World!"`

```javascript
// Multi-line code block
function welcome() {
    console.log("Welcome to AutoCRM!");
    return true;
}
```

## Tables

| Feature | Status | Notes |
|---------|--------|-------|
| Login   | ✅     | Working|
| API     | 🚧     | In progress|
| Search  | ✅     | Optimized|

## Quotes and Notes

> Important note: This is a blockquote
> It can span multiple lines

## Links and Images

[Visit our website](https://example.com)
![AutoCRM Logo](https://example.com/logo.png)

## Task Lists

- [x] Create account
- [x] Setup profile
- [ ] Configure settings
- [ ] Start using features

## Horizontal Rule

---

## Advanced Formatting

Here''s a `code` span.

### Mathematical Expressions

When $a \ne 0$, there are two solutions to $(ax^2 + bx + c = 0)$:
$$x = {-b \pm \sqrt{b^2-4ac} \over 2a}$$

## Need Help?

Contact support or use the AI assistant for immediate help.',
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
    '# Security Best Practices

## Authentication Guidelines

1. **Password Requirements**
   - Minimum 12 characters
   - Mix of uppercase and lowercase
   - Include numbers and symbols

```bash
# Example of secure password generation
openssl rand -base64 16
```

## Two-Factor Authentication

| Method | Security Level | Recommended |
|--------|---------------|-------------|
| SMS    | ⭐⭐         | No         |
| TOTP   | ⭐⭐⭐⭐     | Yes        |
| Keys   | ⭐⭐⭐⭐⭐   | Best       |

> 🔔 **Important**: Enable 2FA for all admin accounts

## Data Protection

1. All data is encrypted at rest
2. TLS 1.3 for data in transit
3. Regular security audits

### Code Example

```python
# Example of secure data handling
def secure_data(sensitive_info):
    return encrypt(hash(sensitive_info))
```

---

*Updated: Monthly security review required*',
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
    '# API Integration Guide

## REST API Overview

```javascript
// Example API request
const response = await fetch("/api/v1/customers", {
  headers: {
    "Authorization": "Bearer ${API_KEY}",
    "Content-Type": "application/json"
  }
});
```

## Authentication

> **Important**: Never share your API keys in public repositories!

### API Key Types

| Type | Usage | Expiry |
|------|--------|--------|
| Test | Development | 30 days |
| Production | Live system | 1 year |
| Temporary | CI/CD | 24 hours |

## Endpoints

1. **Customers**
   - `GET /api/v1/customers`
   - `POST /api/v1/customers`
   - `PUT /api/v1/customers/{id}`

2. **Tickets**
   - `GET /api/v1/tickets`
   - `POST /api/v1/tickets`

## Rate Limits

- 1000 requests/hour for free tier
- 10000 requests/hour for premium
- ~~500 requests/hour for trial~~ *Deprecated*

### Error Handling

```json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "Too many requests"
  }
}
```

## SDK Examples

- [x] JavaScript
- [x] Python
- [ ] Ruby
- [ ] Go

---

*See our [documentation](https://docs.example.com) for more details.*',
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
    'Troubleshooting Guide',
    '# Common Troubleshooting Guide

## Known Issues

### 1. Connection Problems

```bash
# Check connection status
ping api.autocrm.com
```

> 📝 **Note**: Always check your network connection first

### 2. Authentication Errors

| Error Code | Meaning | Solution |
|------------|---------|----------|
| AUTH001 | Invalid token | Refresh token |
| AUTH002 | Expired session | Re-login |
| AUTH003 | Missing credentials | Check config |

## Debug Steps

1. **Check Logs**
   ```shell
   tail -f /var/log/autocrm.log
   ```

2. **Verify Configuration**
   - [x] API keys
   - [x] Environment variables
   - [ ] Permissions
   - [ ] Network access

### Common Solutions

* Clear cache: `rm -rf ./cache/*`
* Reset settings: *Settings > Reset > Confirm*
* Update client: `npm update @autocrm/client`

## Performance Issues

```mermaid
graph TD
    A[Slow Response] --> B{Check CPU}
    B -->|High| C[Scale Resources]
    B -->|Normal| D[Check Network]
```

---

**Still stuck?** Contact support with error code.',
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
    '# Account Management Guide

## Profile Settings

### Personal Information

```json
{
  "profile": {
    "name": "John Doe",
    "email": "john@example.com",
    "preferences": {
      "theme": "dark",
      "notifications": true
    }
  }
}
```

## Subscription Management

| Plan | Features | Price |
|------|----------|-------|
| Basic | Core features | $10/mo |
| Pro | Advanced tools | $25/mo |
| Enterprise | Custom setup | Contact |

### Billing Cycle

1. **Monthly Billing**
   - Automatic renewal
   - Cancel anytime
   - Pro-rated refunds

2. **Annual Billing**
   - 20% discount
   - Priority support
   - Extended features

## Team Management

> 🔑 **Tip**: Assign roles carefully to maintain security

### Available Roles

- [x] Admin
- [x] Manager
- [x] User
- [ ] Custom roles (*coming soon*)

## Security Settings

```typescript
interface SecuritySettings {
  mfa: boolean;
  ipWhitelist: string[];
  sessionTimeout: number;
}
```

---

*Need help? Contact our [support team](mailto:support@example.com)*',
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
    '# Popular Integrations Guide

## Available Integrations

### 1. Email Platforms

```yaml
integrations:
  gmail:
    enabled: true
    scopes:
      - email.read
      - email.send
  outlook:
    enabled: true
    scopes:
      - mail.read
```

## Setup Process

| Platform | Setup Time | Difficulty |
|----------|------------|------------|
| Slack | 5 mins | Easy ⭐ |
| Salesforce | 30 mins | Medium ⭐⭐⭐ |
| Custom API | 60 mins | Hard ⭐⭐⭐⭐ |

### Authentication Methods

1. **OAuth 2.0**
   ```javascript
   const auth = new OAuth2Client({
     clientId: process.env.CLIENT_ID,
     clientSecret: process.env.CLIENT_SECRET
   });
   ```

2. **API Keys**
   > 🔒 Store your API keys securely!

## Testing Integrations

- [x] Configure credentials
- [x] Test connection
- [ ] Set up webhooks
- [ ] Monitor events

### Troubleshooting

```mermaid
flowchart TD
    A[Connection Error] --> B{Check Credentials}
    B --> |Invalid| C[Update Keys]
    B --> |Valid| D[Check Permissions]
```

---

*For detailed setup guides, visit our [integration docs](https://docs.example.com/integrations)*',
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
    '# Support Team Best Practices

## Communication Guidelines

### Response Templates

```markdown
# Greeting Template
Hi {customer_name},

Thank you for reaching out to AutoCRM support.

Best regards,
{agent_name}
```

## Ticket Management

| Priority | Response Time | Update Frequency |
|----------|--------------|------------------|
| Critical | 15 mins | Every hour |
| High | 2 hours | Every 4 hours |
| Normal | 24 hours | Daily |

### Best Practices

1. **Initial Response**
   - [x] Acknowledge receipt
   - [x] Set expectations
   - [ ] Gather information

2. **Follow-up**
   > Always update tickets before ending your shift

## Knowledge Base Usage

```typescript
interface ArticleReference {
  id: string;
  title: string;
  relevance: number;
}
```

### Documentation

* Keep articles updated
* Cross-reference solutions
* Tag appropriately

## Performance Metrics

```chart
type: bar
labels: [Response Time, Resolution Rate, Customer Satisfaction]
data: [92, 87, 95]
```

---

*Remember: Quality support drives customer success!*',
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