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
    E'# Comprehensive Guide to Coffee Brewing Methods\n\n' ||
    E'Coffee brewing is a sophisticated blend of art and science, where precision and technique combine to create the perfect cup. This comprehensive guide explores the fundamental principles and methods of coffee brewing.\n\n' ||
    E'## Understanding Coffee Extraction\n\n' ||
    E'Coffee extraction is the process where water dissolves compounds from ground coffee beans. Key soluble compounds include:\n\n' ||
    E'- Acids (extracted first)\n' ||
    E'- Sugars and other carbohydrates (extracted second)\n' ||
    E'- Plant fibers and bitter compounds (extracted last)\n\n' ||
    E'## Popular Brewing Methods\n\n' ||
    E'### 1. Pour Over\n' ||
    E'- Produces clean, bright flavors\n' ||
    E'- Highlights complex notes\n' ||
    E'- Best for light to medium roasts\n' ||
    E'- Optimal temperature: 195-205°F\n\n' ||
    E'### 2. French Press\n' ||
    E'- Full-bodied, rich flavor\n' ||
    E'- Retains essential oils\n' ||
    E'- Ideal for medium to dark roasts\n' ||
    E'- Steep time: 4-5 minutes\n\n' ||
    E'### 3. Espresso\n' ||
    E'- Concentrated and intense\n' ||
    E'- High pressure extraction (9 bars)\n' ||
    E'- 25-30 second extraction\n' ||
    E'- Forms base for many drinks\n\n' ||
    E'### 4. Cold Brew\n' ||
    E'- Smooth, low acidity\n' ||
    E'- 12-24 hour steep time\n' ||
    E'- Higher caffeine content\n' ||
    E'- Concentrate can be stored\n\n' ||
    E'### 5. AeroPress\n' ||
    E'- Versatile brewing method\n' ||
    E'- Quick extraction (1-2 minutes)\n' ||
    E'- Pressure-assisted extraction\n' ||
    E'- Great for travel\n\n' ||
    E'## Critical Brewing Variables\n\n' ||
    E'### 1. Grind Size\n' ||
    E'- Extra Fine: Turkish coffee\n' ||
    E'- Fine: Espresso\n' ||
    E'- Medium-Fine: Pour Over\n' ||
    E'- Medium: Drip Coffee\n' ||
    E'- Coarse: French Press, Cold Brew\n\n' ||
    E'### 2. Water Temperature\n' ||
    E'- Optimal range: 195-205°F (90-96°C)\n' ||
    E'- Light roasts: Higher temp (200-205°F)\n' ||
    E'- Dark roasts: Lower temp (195-200°F)\n' ||
    E'- Cold brew: Room temperature or cold\n\n' ||
    E'### 3. Brewing Time\n' ||
    E'- Espresso: 20-30 seconds\n' ||
    E'- Pour Over: 2-3 minutes\n' ||
    E'- French Press: 4-5 minutes\n' ||
    E'- Cold Brew: 12-24 hours\n\n' ||
    E'### 4. Coffee-to-Water Ratio\n' ||
    E'- General brewing: 1:16-1:17\n' ||
    E'- Espresso: 1:2\n' ||
    E'- Cold Brew concentrate: 1:4\n' ||
    E'- French Press: 1:12\n\n' ||
    E'## Water Quality\n\n' ||
    E'Water composition significantly affects extraction:\n' ||
    E'- Total Dissolved Solids (TDS): 150-200 ppm\n' ||
    E'- pH level: 6.5-7.5\n' ||
    E'- Mineral content: Moderate hardness\n' ||
    E'- Filtered, not distilled water\n\n' ||
    E'## Troubleshooting Common Issues\n\n' ||
    E'### Over-extraction\n' ||
    E'- Bitter, harsh taste\n' ||
    E'- Dark, muddy appearance\n' ||
    E'- Solutions: Coarser grind, shorter brew time\n\n' ||
    E'### Under-extraction\n' ||
    E'- Sour, sharp taste\n' ||
    E'- Thin body\n' ||
    E'- Solutions: Finer grind, longer brew time\n\n' ||
    E'Understanding these variables will help you consistently brew excellent coffee.',
    'introduction-to-coffee-brewing',
    'published',
    'f7c6d5e4-b3a2-4c91-8c7d-1a2b3c4d5e6f',
    NOW(),
    NOW(),
    (SELECT id FROM category_ids WHERE slug = 'general'),
    ARRAY['coffee', 'brewing', 'guide', 'extraction', 'temperature', 'grind-size']
),
(
    'c8d9e0f1-a2b3-4b5b-8c7d-9e0f1a2b3c4d',
    'The Perfect Pour Over Technique',
    E'# Mastering Pour Over Coffee: A Complete Guide\n\n' ||
    E'Pour over brewing is a precise manual method that offers unparalleled control over the extraction process, allowing you to highlight the subtle nuances in your coffee.\n\n' ||
    E'## Scientific Principles\n\n' ||
    E'### Extraction Dynamics\n' ||
    E'- Controlled flow rate affects extraction\n' ||
    E'- Turbulence aids even extraction\n' ||
    E'- Bed depth influences resistance\n' ||
    E'- Temperature stability crucial\n\n' ||
    E'## Essential Equipment\n\n' ||
    E'### Primary Tools\n' ||
    E'1. Pour Over Dripper\n' ||
    E'   - Ceramic (best heat retention)\n' ||
    E'   - Glass (good visibility)\n' ||
    E'   - Plastic (travel-friendly)\n\n' ||
    E'2. Filter Options\n' ||
    E'   - Bleached (no paper taste)\n' ||
    E'   - Natural (environmental choice)\n' ||
    E'   - Cloth (reusable, unique flavor)\n\n' ||
    E'3. Kettle Requirements\n' ||
    E'   - Gooseneck design\n' ||
    E'   - Temperature control\n' ||
    E'   - 600-1000ml capacity\n\n' ||
    E'4. Additional Tools\n' ||
    E'   - Scale (0.1g precision)\n' ||
    E'   - Timer\n' ||
    E'   - Thermometer\n\n' ||
    E'## Detailed Process\n\n' ||
    E'### 1. Setup (2 minutes)\n' ||
    E'- Heat water to 195-205°F\n' ||
    E'- Rinse filter thoroughly\n' ||
    E'- Pre-heat brewing vessel\n' ||
    E'- Measure 20-22g coffee\n\n' ||
    E'### 2. Grinding (1 minute)\n' ||
    E'- Medium-fine consistency\n' ||
    E'- Even particle distribution\n' ||
    E'- Grind immediately before brewing\n\n' ||
    E'### 3. Blooming Phase (30-45 seconds)\n' ||
    E'- Add 2-3 times coffee weight in water\n' ||
    E'- Ensure all grounds are saturated\n' ||
    E'- Watch for even bubble formation\n' ||
    E'- Allow gases to escape\n\n' ||
    E'### 4. Main Pour (2-3 minutes)\n' ||
    E'- Spiral pattern from center\n' ||
    E'- Maintain consistent water level\n' ||
    E'- Total water: 320-350g\n' ||
    E'- Keep bed flat\n\n' ||
    E'### 5. Drawdown (30-45 seconds)\n' ||
    E'- Even bed surface\n' ||
    E'- No high spots or channels\n' ||
    E'- Final drips should be light\n\n' ||
    E'## Advanced Techniques\n\n' ||
    E'### Pulse Pouring\n' ||
    E'- Multiple small pours\n' ||
    E'- Controls extraction rate\n' ||
    E'- Maintains temperature\n' ||
    E'- Creates turbulence\n\n' ||
    E'### Continuous Pouring\n' ||
    E'- Single steady stream\n' ||
    E'- Consistent water level\n' ||
    E'- Requires skill\n' ||
    E'- Better temperature stability\n\n' ||
    E'## Troubleshooting\n\n' ||
    E'### Slow Drawdown\n' ||
    E'- Grind too fine\n' ||
    E'- Too much coffee\n' ||
    E'- Filter collapsed\n' ||
    E'- Solution: Adjust grind coarser\n\n' ||
    E'### Fast Drawdown\n' ||
    E'- Grind too coarse\n' ||
    E'- Channeling in bed\n' ||
    E'- Uneven pouring\n' ||
    E'- Solution: Adjust grind finer\n\n' ||
    E'### Uneven Extraction\n' ||
    E'- Poor pouring technique\n' ||
    E'- Uneven grind size\n' ||
    E'- Incorrect water temperature\n' ||
    E'- Solution: Practice technique\n\n' ||
    E'## Quality Control\n\n' ||
    E'### Visual Indicators\n' ||
    E'- Even color in cup\n' ||
    E'- Clear, not cloudy\n' ||
    E'- Minimal sediment\n' ||
    E'- Proper flow rate\n\n' ||
    E'### Taste Profile\n' ||
    E'- Clean, bright flavors\n' ||
    E'- No bitterness\n' ||
    E'- Complex aromatics\n' ||
    E'- Sweet finish\n\n' ||
    E'Perfect your pour over technique by practicing these methods consistently.',
    'perfect-pour-over-technique',
    'published',
    'f7c6d5e4-b3a2-4c91-8c7d-1a2b3c4d5e6f',
    NOW(),
    NOW(),
    (SELECT id FROM category_ids WHERE slug = 'general'),
    ARRAY['coffee', 'pour-over', 'tutorial', 'brewing', 'technique']
),
(
    'd9e0f1a2-b3c4-4b5b-8c7d-9e0f1a2b3c4d',
    'French Press Mastery',
    E'# Complete French Press Brewing Guide\n\n' ||
    E'The French Press is renowned for producing rich, full-bodied coffee through a full-immersion brewing process. This comprehensive guide covers everything from basic principles to advanced techniques.\n\n' ||
    E'## Brewing Science\n\n' ||
    E'### Immersion Extraction\n' ||
    E'- Full contact between water and grounds\n' ||
    E'- Even extraction through saturation\n' ||
    E'- Oils retained in final cup\n' ||
    E'- Temperature stability advantages\n\n' ||
    E'### Filtration Mechanics\n' ||
    E'- Metal mesh screen\n' ||
    E'- Pressure-driven separation\n' ||
    E'- Suspended solids retention\n' ||
    E'- Oil preservation\n\n' ||
    E'## Equipment Requirements\n\n' ||
    E'### French Press Design\n' ||
    E'1. Body Construction\n' ||
    E'   - Glass (classic, visible)\n' ||
    E'   - Stainless steel (durable)\n' ||
    E'   - Ceramic (heat retention)\n\n' ||
    E'2. Plunger Assembly\n' ||
    E'   - Mesh quality\n' ||
    E'   - Frame stability\n' ||
    E'   - Seal effectiveness\n\n' ||
    E'3. Size Options\n' ||
    E'   - 3-cup (350ml)\n' ||
    E'   - 8-cup (1000ml)\n' ||
    E'   - 12-cup (1500ml)\n\n' ||
    E'## Brewing Parameters\n\n' ||
    E'### Coffee Specifications\n' ||
    E'- Grind: Coarse, even particles\n' ||
    E'- Ratio: 1:12 coffee to water\n' ||
    E'- Dose: 30g per 350ml water\n' ||
    E'- Temperature: 200°F (93°C)\n\n' ||
    E'### Time Management\n' ||
    E'1. Pre-heat: 30 seconds\n' ||
    E'2. Bloom: 30 seconds\n' ||
    E'3. Steep: 4 minutes\n' ||
    E'4. Press: 30 seconds\n\n' ||
    E'## Step-by-Step Process\n\n' ||
    E'### 1. Preparation\n' ||
    E'- Clean press thoroughly\n' ||
    E'- Pre-heat with hot water\n' ||
    E'- Measure coffee and water\n' ||
    E'- Grind coffee fresh\n\n' ||
    E'### 2. Initial Pour\n' ||
    E'- Add coffee to press\n' ||
    E'- Start timer\n' ||
    E'- Pour water evenly\n' ||
    E'- Break crust gently\n\n' ||
    E'### 3. Steeping\n' ||
    E'- Place plunger on top\n' ||
    E'- Wait 4 minutes\n' ||
    E'- No stirring needed\n' ||
    E'- Maintain temperature\n\n' ||
    E'### 4. Plunging\n' ||
    E'- Press slowly (30 seconds)\n' ||
    E'- Even pressure\n' ||
    E'- Stop before grounds\n' ||
    E'- Serve immediately\n\n' ||
    E'## Advanced Techniques\n\n' ||
    E'### Double Filtering\n' ||
    E'- Two mesh screens\n' ||
    E'- Cleaner cup\n' ||
    E'- Less sediment\n' ||
    E'- Maintains body\n\n' ||
    E'### Cold Press Method\n' ||
    E'- Room temperature water\n' ||
    E'- 12-hour steep\n' ||
    E'- Gentler extraction\n' ||
    E'- Unique flavor profile\n\n' ||
    E'## Troubleshooting\n\n' ||
    E'### Common Issues\n' ||
    E'1. Difficult Plunging\n' ||
    E'   - Grind too fine\n' ||
    E'   - Plunger misaligned\n' ||
    E'   - Too much coffee\n\n' ||
    E'2. Excessive Sediment\n' ||
    E'   - Worn mesh\n' ||
    E'   - Poor grind quality\n' ||
    E'   - Aggressive plunging\n\n' ||
    E'3. Weak Coffee\n' ||
    E'   - Grind too coarse\n' ||
    E'   - Short steep time\n' ||
    E'   - Wrong ratio\n\n' ||
    E'## Cleaning and Maintenance\n\n' ||
    E'### Daily Care\n' ||
    E'- Disassemble completely\n' ||
    E'- Rinse thoroughly\n' ||
    E'- Air dry components\n' ||
    E'- Check mesh integrity\n\n' ||
    E'### Deep Cleaning\n' ||
    E'- Weekly soap wash\n' ||
    E'- Descale monthly\n' ||
    E'- Replace mesh annually\n' ||
    E'- Inspect seals regularly\n\n' ||
    E'Master these techniques for consistently excellent French Press coffee.',
    'french-press-mastery',
    'published',
    'f7c6d5e4-b3a2-4c91-8c7d-1a2b3c4d5e6f',
    NOW(),
    NOW(),
    (SELECT id FROM category_ids WHERE slug = 'general'),
    ARRAY['coffee', 'french-press', 'tutorial', 'brewing', 'immersion']
),
(
    'e0f1a2b3-c4d5-4b5b-8c7d-9e0f1a2b3c4d',
    'Cold Brew Coffee Guide',
    E'# Definitive Cold Brew Coffee Guide\n\n' ||
    E'Cold brew coffee offers a smooth, low-acid alternative to traditional brewing methods. This comprehensive guide covers the science, techniques, and best practices for creating exceptional cold brew.\n\n' ||
    E'## Cold Brew Science\n\n' ||
    E'### Chemical Process\n' ||
    E'- Slow extraction rate\n' ||
    E'- Reduced acid formation\n' ||
    E'- Different compound solubility\n' ||
    E'- Oxidation prevention\n\n' ||
    E'### Temperature Effects\n' ||
    E'- Slower molecular movement\n' ||
    E'- Selective extraction\n' ||
    E'- Stability advantages\n' ||
    E'- Microbiological considerations\n\n' ||
    E'## Equipment Essentials\n\n' ||
    E'### Container Options\n' ||
    E'1. Large Mason Jars\n' ||
    E'   - Airtight seal\n' ||
    E'   - Easy cleaning\n' ||
    E'   - Visual monitoring\n\n' ||
    E'2. Cold Brew Systems\n' ||
    E'   - Built-in filtration\n' ||
    E'   - Controlled draining\n' ||
    E'   - Easy handling\n\n' ||
    E'3. Commercial Towers\n' ||
    E'   - Large capacity\n' ||
    E'   - Slow drip option\n' ||
    E'   - Temperature control\n\n' ||
    E'### Filtration Methods\n' ||
    E'- Cloth filters\n' ||
    E'- Paper filters\n' ||
    E'- Metal mesh\n' ||
    E'- Combined systems\n\n' ||
    E'## Recipe Specifications\n\n' ||
    E'### Basic Ratios\n' ||
    E'- Concentrate (1:4)\n' ||
    E'- Ready-to-drink (1:8)\n' ||
    E'- Light brew (1:12)\n' ||
    E'- Commercial (1:3)\n\n' ||
    E'### Time Variables\n' ||
    E'- Minimum: 12 hours\n' ||
    E'- Optimal: 16-18 hours\n' ||
    E'- Maximum: 24 hours\n' ||
    E'- Temperature dependent\n\n' ||
    E'## Production Process\n\n' ||
    E'### 1. Preparation\n' ||
    E'- Coarse grind coffee\n' ||
    E'- Filtered water\n' ||
    E'- Clean containers\n' ||
    E'- Measured ratios\n\n' ||
    E'### 2. Steeping\n' ||
    E'- Even saturation\n' ||
    E'- Room temperature\n' ||
    E'- Dark location\n' ||
    E'- No agitation\n\n' ||
    E'### 3. Filtration\n' ||
    E'- Two-stage process\n' ||
    E'- Careful decanting\n' ||
    E'- Clean equipment\n' ||
    E'- Minimal agitation\n\n' ||
    E'### 4. Storage\n' ||
    E'- Airtight container\n' ||
    E'- Refrigeration\n' ||
    E'- Maximum 2 weeks\n' ||
    E'- Away from light\n\n' ||
    E'## Advanced Methods\n\n' ||
    E'### Hot Bloom Cold Brew\n' ||
    E'- Initial hot water bloom\n' ||
    E'- Enhanced aromatics\n' ||
    E'- Faster extraction start\n' ||
    E'- Complex flavor profile\n\n' ||
    E'### Nitrogen Infusion\n' ||
    E'- Creamy texture\n' ||
    E'- Enhanced presentation\n' ||
    E'- Extended shelf life\n' ||
    E'- Commercial applications\n\n' ||
    E'## Flavor Variations\n\n' ||
    E'### Natural Additions\n' ||
    E'- Vanilla bean\n' ||
    E'- Cinnamon stick\n' ||
    E'- Citrus peel\n' ||
    E'- Cacao nibs\n\n' ||
    E'### Serving Suggestions\n' ||
    E'- Over ice\n' ||
    E'- With milk/cream\n' ||
    E'- Cocktail base\n' ||
    E'- Culinary applications\n\n' ||
    E'## Quality Control\n\n' ||
    E'### Testing Methods\n' ||
    E'- TDS measurements\n' ||
    E'- pH monitoring\n' ||
    E'- Visual clarity\n' ||
    E'- Taste evaluation\n\n' ||
    E'### Storage Guidelines\n' ||
    E'- Temperature control\n' ||
    E'- Container material\n' ||
    E'- Oxidation prevention\n' ||
    E'- Shelf life monitoring\n\n' ||
    E'Follow these guidelines for consistently excellent cold brew coffee.',
    'cold-brew-coffee-guide',
    'published',
    'f7c6d5e4-b3a2-4c91-8c7d-1a2b3c4d5e6f',
    NOW(),
    NOW(),
    (SELECT id FROM category_ids WHERE slug = 'general'),
    ARRAY['coffee', 'cold-brew', 'tutorial', 'brewing', 'concentrate']
),
(
    'f1a2b3c4-d5e6-4b5b-8c7d-9e0f1a2b3c4d',
    'Coffee Bean Storage Best Practices',
    E'# Comprehensive Coffee Bean Storage Guide\n\n' ||
    E'Proper coffee storage is crucial for preserving flavor compounds and ensuring optimal freshness. This detailed guide covers everything you need to know about storing coffee beans.\n\n' ||
    E'## Understanding Coffee Degradation\n\n' ||
    E'Coffee beans degrade through four primary mechanisms:\n\n' ||
    E'1. Oxidation\n' ||
    E'   - Causes stale flavors\n' ||
    E'   - Accelerated by air exposure\n' ||
    E'   - Affects oils and aromatics\n\n' ||
    E'2. Moisture Absorption\n' ||
    E'   - Leads to mold growth\n' ||
    E'   - Affects flavor stability\n' ||
    E'   - Can cause premature aging\n\n' ||
    E'3. Light Exposure\n' ||
    E'   - Breaks down compounds\n' ||
    E'   - UV rays particularly harmful\n' ||
    E'   - Causes chemical changes\n\n' ||
    E'4. Temperature Fluctuations\n' ||
    E'   - Release volatile compounds\n' ||
    E'   - Create condensation\n' ||
    E'   - Speed up aging process\n\n' ||
    E'## Optimal Storage Conditions\n\n' ||
    E'### Temperature\n' ||
    E'- Ideal: 68°F (20°C)\n' ||
    E'- Range: 60-75°F (15-24°C)\n' ||
    E'- Avoid freezer unless vacuum sealed\n' ||
    E'- Never refrigerate\n\n' ||
    E'### Humidity\n' ||
    E'- Optimal: 50-60%\n' ||
    E'- Below 70% to prevent mold\n' ||
    E'- Use moisture-absorbing packets\n\n' ||
    E'### Light Exposure\n' ||
    E'- Store in dark place\n' ||
    E'- Use opaque containers\n' ||
    E'- Avoid direct sunlight\n' ||
    E'- UV-protective storage\n\n' ||
    E'### Air Contact\n' ||
    E'- Use airtight containers\n' ||
    E'- One-way degassing valve\n' ||
    E'- Minimize headspace\n\n' ||
    E'## Container Requirements\n\n' ||
    E'### Essential Features\n' ||
    E'- Airtight seal\n' ||
    E'- UV protection\n' ||
    E'- Non-reactive material\n' ||
    E'- Proper size options\n\n' ||
    E'### Best Materials\n' ||
    E'1. Ceramic\n' ||
    E'   - Temperature stable\n' ||
    E'   - Light blocking\n' ||
    E'   - Non-reactive\n\n' ||
    E'2. Stainless Steel\n' ||
    E'   - Durable\n' ||
    E'   - Non-reactive\n' ||
    E'   - Light blocking\n\n' ||
    E'3. Glass (opaque)\n' ||
    E'   - Easy to clean\n' ||
    E'   - Non-reactive\n' ||
    E'   - Visual monitoring\n\n' ||
    E'## Storage Duration Guidelines\n\n' ||
    E'### Whole Beans\n' ||
    E'- Peak freshness: 2-4 weeks\n' ||
    E'- Maximum: 6 months\n' ||
    E'- Frozen: up to 1 year\n\n' ||
    E'### Ground Coffee\n' ||
    E'- Peak freshness: 1-2 weeks\n' ||
    E'- Maximum: 1 month\n' ||
    E'- Avoid freezing\n\n' ||
    E'### Green Coffee\n' ||
    E'- Standard: 6-12 months\n' ||
    E'- Optimal conditions: 1-2 years\n' ||
    E'- Monitor moisture content\n\n' ||
    E'## Special Storage Considerations\n\n' ||
    E'### Freezing Guidelines\n' ||
    E'- Use vacuum sealing\n' ||
    E'- Single-dose portions\n' ||
    E'- Thaw completely before opening\n' ||
    E'- No refreezing\n\n' ||
    E'### Bulk Storage\n' ||
    E'- Rotate stock regularly\n' ||
    E'- Monitor humidity levels\n' ||
    E'- Use multiple smaller containers\n' ||
    E'- Check regularly for issues\n\n' ||
    E'### Commercial Storage\n' ||
    E'- Climate control essential\n' ||
    E'- Regular quality checks\n' ||
    E'- Inventory management system\n' ||
    E'- Professional grade containers\n\n' ||
    E'Following these guidelines will help maintain coffee freshness and flavor quality.',
    'coffee-bean-storage',
    'published',
    'f7c6d5e4-b3a2-4c91-8c7d-1a2b3c4d5e6f',
    NOW(),
    NOW(),
    (SELECT id FROM category_ids WHERE slug = 'general'),
    ARRAY['coffee', 'storage', 'guide', 'freshness', 'preservation']
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