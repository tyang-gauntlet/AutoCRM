-- Remove all articles from public.kb_articles
DELETE FROM public.kb_articles;


-- Add all articles
WITH category_ids AS (
    SELECT id, slug FROM public.kb_categories
)
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
    (SELECT id FROM category_ids WHERE slug = 'getting-started'),
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
    (SELECT id FROM category_ids WHERE slug = 'security'),
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
    (SELECT id FROM category_ids WHERE slug = 'api'),
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
    (SELECT id FROM category_ids WHERE slug = 'troubleshooting'),
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
    (SELECT id FROM category_ids WHERE slug = 'account'),
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
    (SELECT id FROM category_ids WHERE slug = 'integrations'),
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
    (SELECT id FROM category_ids WHERE slug = 'best-practices'),
    ARRAY['best-practices', 'support']
),
(
    'b7c8d9e0-f1a2-4b5b-8c7d-9e0f1a2b3c4d',
    'Introduction to Coffee Brewing Methods',
    E'# Introduction to Coffee Brewing Methods\n\n' ||
    E'Coffee brewing is both an art and a science. This guide will introduce you to the fundamental methods of brewing coffee.\n\n' ||
    E'## Popular Brewing Methods\n\n' ||
    E'1. Pour Over\n' ||
    E'2. French Press\n' ||
    E'3. Espresso\n' ||
    E'4. Cold Brew\n' ||
    E'5. AeroPress\n\n' ||
    E'## Key Factors\n\n' ||
    E'The key factors affecting coffee brewing are:\n\n' ||
    E'- Grind size\n' ||
    E'- Water temperature\n' ||
    E'- Brewing time\n' ||
    E'- Coffee-to-water ratio\n\n' ||
    E'Understanding these variables will help you make better coffee.',
    'introduction-to-coffee-brewing',
    'published',
    'f7c6d5e4-b3a2-4c91-8c7d-1a2b3c4d5e6f',
    NOW(),
    NOW(),
    (SELECT id FROM category_ids WHERE slug = 'general'),
    ARRAY['coffee', 'brewing', 'guide']
),
(
    'c8d9e0f1-a2b3-4b5b-8c7d-9e0f1a2b3c4d',
    'The Perfect Pour Over Technique',
    E'# The Perfect Pour Over Technique\n\n' ||
    E'Pour over brewing is a manual brewing method that gives you complete control over the extraction process.\n\n' ||
    E'## Required Equipment\n\n' ||
    E'- Pour over dripper\n' ||
    E'- Paper filter\n' ||
    E'- Kettle (gooseneck preferred)\n' ||
    E'- Scale\n' ||
    E'- Timer\n\n' ||
    E'## Step-by-Step Guide\n\n' ||
    E'1. Heat water to 195-205°F\n' ||
    E'2. Rinse paper filter\n' ||
    E'3. Add 20g medium-fine ground coffee\n' ||
    E'4. Pour 40g water for blooming (30 seconds)\n' ||
    E'5. Continue pouring in spirals to 320g total\n' ||
    E'6. Total brew time: 2:30-3:00 minutes',
    'perfect-pour-over-technique',
    'published',
    'f7c6d5e4-b3a2-4c91-8c7d-1a2b3c4d5e6f',
    NOW(),
    NOW(),
    (SELECT id FROM category_ids WHERE slug = 'general'),
    ARRAY['coffee', 'pour-over', 'tutorial']
),
(
    'd9e0f1a2-b3c4-4b5b-8c7d-9e0f1a2b3c4d',
    'French Press Mastery',
    E'# French Press Mastery\n\n' ||
    E'The French Press is beloved for its rich, full-bodied coffee. Learn how to master this classic brewing method.\n\n' ||
    E'## Key Principles\n\n' ||
    E'- Use coarse ground coffee\n' ||
    E'- Water temperature: 200°F\n' ||
    E'- Steep time: 4 minutes\n' ||
    E'- 1:15 coffee-to-water ratio\n\n' ||
    E'## Common Mistakes to Avoid\n\n' ||
    E'1. Using too fine grind\n' ||
    E'2. Not preheating the press\n' ||
    E'3. Pressing too hard\n' ||
    E'4. Leaving coffee in the press',
    'french-press-mastery',
    'published',
    'f7c6d5e4-b3a2-4c91-8c7d-1a2b3c4d5e6f',
    NOW(),
    NOW(),
    (SELECT id FROM category_ids WHERE slug = 'general'),
    ARRAY['coffee', 'french-press', 'tutorial']
),
(
    'e0f1a2b3-c4d5-4b5b-8c7d-9e0f1a2b3c4d',
    'Cold Brew Coffee Guide',
    E'# Cold Brew Coffee Guide\n\n' ||
    E'Cold brew produces a smooth, less acidic coffee perfect for hot days. This guide covers everything you need to know.\n\n' ||
    E'## Basic Recipe\n\n' ||
    E'1. Use coarse ground coffee\n' ||
    E'2. 1:5 ratio for concentrate\n' ||
    E'3. Steep 12-24 hours\n' ||
    E'4. Filter thoroughly\n\n' ||
    E'## Storage Tips\n\n' ||
    E'- Keep refrigerated\n' ||
    E'- Use within 2 weeks\n' ||
    E'- Dilute when serving\n\n' ||
    E'## Flavor Variations\n\n' ||
    E'- Add vanilla\n' ||
    E'- Use cinnamon\n' ||
    E'- Try different origins',
    'cold-brew-coffee-guide',
    'published',
    'f7c6d5e4-b3a2-4c91-8c7d-1a2b3c4d5e6f',
    NOW(),
    NOW(),
    (SELECT id FROM category_ids WHERE slug = 'general'),
    ARRAY['coffee', 'cold-brew', 'tutorial']
),
(
    'f1a2b3c4-d5e6-4b5b-8c7d-9e0f1a2b3c4d',
    'Coffee Bean Storage Best Practices',
    E'# Coffee Bean Storage Best Practices\n\n' ||
    E'Proper coffee storage is crucial for maintaining flavor and freshness. Follow these guidelines for optimal results.\n\n' ||
    E'## Storage Principles\n\n' ||
    E'1. Avoid light exposure\n' ||
    E'2. Keep away from heat\n' ||
    E'3. Minimize oxygen contact\n' ||
    E'4. Prevent moisture\n\n' ||
    E'## Container Requirements\n\n' ||
    E'- Airtight seal\n' ||
    E'- UV protection\n' ||
    E'- Non-reactive material\n\n' ||
    E'## Storage Duration\n\n' ||
    E'- Whole beans: 1 month\n' ||
    E'- Ground coffee: 2 weeks\n' ||
    E'- Green coffee: 6-12 months',
    'coffee-bean-storage',
    'published',
    'f7c6d5e4-b3a2-4c91-8c7d-1a2b3c4d5e6f',
    NOW(),
    NOW(),
    (SELECT id FROM category_ids WHERE slug = 'general'),
    ARRAY['coffee', 'storage', 'guide']
),
(
    'a2b3c4d5-e6f7-4b5b-8c7d-9e0f1a2b3c4d',
    'Understanding Coffee Roast Levels',
    E'# Understanding Coffee Roast Levels\n\n' ||
    E'Coffee roast levels significantly impact flavor. This guide explains the characteristics of different roasts.\n\n' ||
    E'## Light Roast\n\n' ||
    E'- Higher acidity\n' ||
    E'- More origin flavors\n' ||
    E'- Light brown color\n' ||
    E'- No oil on surface\n\n' ||
    E'## Medium Roast\n\n' ||
    E'- Balanced flavor\n' ||
    E'- Medium brown color\n' ||
    E'- No oil on surface\n' ||
    E'- Most popular in US\n\n' ||
    E'## Dark Roast\n\n' ||
    E'- Bold, bitter taste\n' ||
    E'- Dark brown color\n' ||
    E'- Oily surface\n' ||
    E'- Less caffeine',
    'understanding-coffee-roasts',
    'published',
    'f7c6d5e4-b3a2-4c91-8c7d-1a2b3c4d5e6f',
    NOW(),
    NOW(),
    (SELECT id FROM category_ids WHERE slug = 'general'),
    ARRAY['coffee', 'roasting', 'guide']
); 