-- Add some articles with tags
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