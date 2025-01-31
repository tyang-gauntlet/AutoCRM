# CRM System Test Cases

## Overview
This document outlines test cases for the AutoCRM system, focusing on common user requests and their expected outcomes. Each test case is structured to include input, expected output, context, and success criteria.

## Test Cases

### 1. Basic Knowledge Base Query
**Input**: "How do I make pour over coffee?"

**Expected Output**:
- RAG should retrieve relevant content from `kb_articles` where title = 'The Perfect Pour Over Technique'
- Response should include step-by-step brewing instructions
- Tool calls:
  - `searchKnowledge` with query
  - `addMessage` with response

**Context**:
- User is authenticated
- Knowledge base contains coffee brewing articles

**Success Criteria**:
- KRA metrics show relevance_score > 0.8
- RGQS metrics show overall_quality > 0.9
- Response includes specific brewing steps from the article

### 2. Multi-Context Knowledge Query
**Input**: "What's the difference between French Press and Pour Over coffee?"

**Expected Output**:
- RAG should retrieve content from multiple articles
- Response should compare both methods
- Tool calls:
  - `searchKnowledge` with query
  - `addMessage` with comparative response

**Context**:
- Multiple relevant articles exist in knowledge base
- User needs comparative information

**Success Criteria**:
- Response includes information from both articles
- RGQS metrics show accuracy > 0.9
- Clear comparison points presented

### 3. Create Support Ticket for Unknown Issue
**Input**: "My coffee machine is making strange noises"

**Expected Output**:
- System should create a new ticket
- Tool calls:
  - `createTicket` with:
    - title: "Coffee Machine Noise Issue"
    - priority: "medium"
    - description: [Detailed user report]

**Context**:
- Issue not covered in knowledge base
- Requires human support

**Success Criteria**:
- Ticket created in database
- Appropriate priority assigned
- Clear description of issue

### 4. Simple Greeting
**Input**: "Hi"

**Expected Output**:
- Friendly greeting response
- No ticket creation
- Tool calls:
  - `addMessage` with greeting

**Context**:
- First message in conversation
- No previous context

**Success Criteria**:
- RGQS metrics show tone > 0.9
- Response is welcoming and professional

### 5. Complex Technical Support Request
**Input**: "I'm getting error code 5 on my espresso machine and there's water leaking"

**Expected Output**:
- Create high-priority ticket
- Search knowledge base
- Tool calls:
  - `searchKnowledge` for error code
  - `createTicket` with urgent priority

**Context**:
- Potential safety issue
- Technical error code

**Success Criteria**:
- Ticket priority set to "urgent"
- Response acknowledges safety concerns
- Knowledge base search attempted

### 6. Knowledge Base Article Feedback
**Input**: "The cold brew instructions weren't clear enough"

**Expected Output**:
- Create feedback ticket
- Reference specific article
- Tool calls:
  - `createTicket` with:
    - title: "Knowledge Base Feedback - Cold Brew Guide"
    - priority: "low"

**Context**:
- Related to existing KB article
- User providing feedback

**Success Criteria**:
- Feedback captured in ticket
- Article reference included
- Appropriate routing for content review

### 7. Multi-Step Resolution Query
**Input**: "How do I clean and maintain my French Press?"

**Expected Output**:
- Retrieve maintenance instructions
- Provide step-by-step guide
- Tool calls:
  - `searchKnowledge` with maintenance focus
  - `addMessage` with structured response

**Context**:
- Requires information from multiple sections
- Maintenance-focused query

**Success Criteria**:
- Complete maintenance steps provided
- Clear, sequential instructions
- Safety precautions included

### 8. Satisfaction Confirmation
**Input**: "Yes, that solved my problem, thank you!"

**Expected Output**:
- Mark conversation as resolved
- Record satisfaction metrics
- Tool calls:
  - `resolveChat` with:
    - satisfaction_level: "satisfied"
    - resolution: "User confirmed solution"

**Context**:
- Following successful support interaction
- Positive user feedback

**Success Criteria**:
- Chat marked as resolved
- High satisfaction metrics recorded
- Proper conversation closure

### 9. PII Detection and Handling
**Input**: "My email is john@example.com and phone is 123-456-7890"

**Expected Output**:
- PII detected and redacted
- Security warning response
- Tool calls:
  - `addMessage` with sanitized content
  - Metrics recording PII detection

**Context**:
- Contains sensitive information
- Requires PII handling

**Success Criteria**:
- PII properly redacted
- Security warning issued
- Metrics show PII detection

### 10. Complex Product Comparison
**Input**: "What's the best coffee brewing method for low acidity?"

**Expected Output**:
- Compare multiple brewing methods
- Focus on acidity factors
- Tool calls:
  - `searchKnowledge` across methods
  - `addMessage` with comparative analysis

**Context**:
- Health-related inquiry
- Multiple relevant articles

**Success Criteria**:
- Comprehensive comparison
- Focus on acidity levels
- Clear recommendations

### 11. Urgent Support Request
**Input**: "Help! My machine is leaking hot water everywhere!"

**Expected Output**:
- Create urgent ticket
- Immediate safety instructions
- Tool calls:
  - `createTicket` with urgent priority
  - `addMessage` with safety warnings

**Context**:
- Safety hazard
- Requires immediate attention

**Success Criteria**:
- Urgent ticket created
- Safety instructions provided
- Clear escalation path

### 12. Equipment Recommendation
**Input**: "What grinder should I buy for pour over coffee?"

**Expected Output**:
- Retrieve equipment recommendations
- Provide options and criteria
- Tool calls:
  - `searchKnowledge` for equipment info
  - `addMessage` with structured advice

**Context**:
- Purchase guidance needed
- Technical specifications required

**Success Criteria**:
- Clear recommendations provided
- Technical details included
- Price ranges mentioned

### 13. Troubleshooting Flow
**Input**: "My coffee is too bitter"

**Expected Output**:
- Systematic troubleshooting steps
- Multiple potential solutions
- Tool calls:
  - `searchKnowledge` for troubleshooting
  - `addMessage` with diagnostic steps

**Context**:
- Common quality issue
- Multiple potential causes

**Success Criteria**:
- Structured troubleshooting steps
- Clear explanations
- Multiple solution options

### 14. Feature Request
**Input**: "Can you add a timer function to the app?"

**Expected Output**:
- Create feature request ticket
- Acknowledge suggestion
- Tool calls:
  - `createTicket` with:
    - title: "Feature Request - Timer Function"
    - priority: "low"

**Context**:
- Product improvement suggestion
- Requires development review

**Success Criteria**:
- Feature request captured
- Appropriate routing
- User acknowledgment

### 15. Multiple Questions
**Input**: "What's the best water temperature for pour over, and how long should it brew?"

**Expected Output**:
- Address both questions
- Structured response
- Tool calls:
  - `searchKnowledge` for both topics
  - `addMessage` with organized response

**Context**:
- Multiple related questions
- Technical parameters

**Success Criteria**:
- Both questions answered
- Clear organization
- Technical accuracy

### 16. Warranty Inquiry
**Input**: "Is my coffee maker still under warranty?"

**Expected Output**:
- Create support ticket
- Request serial number
- Tool calls:
  - `createTicket` for warranty check
  - `addMessage` requesting details

**Context**:
- Requires additional information
- Policy verification needed

**Success Criteria**:
- Clear information request
- Ticket created
- Next steps outlined

### 17. Recipe Modification
**Input**: "How do I adjust my cold brew recipe for a stronger taste?"

**Expected Output**:
- Provide ratio adjustments
- Explain impact on strength
- Tool calls:
  - `searchKnowledge` for recipes
  - `addMessage` with modifications

**Context**:
- Recipe customization
- Technical parameters

**Success Criteria**:
- Clear ratio guidance
- Time adjustments
- Safety considerations

### 18. Storage Advice
**Input**: "How long can I store coffee beans?"

**Expected Output**:
- Retrieve storage guidelines
- Provide best practices
- Tool calls:
  - `searchKnowledge` for storage info
  - `addMessage` with detailed advice

**Context**:
- Storage article available
- Multiple factors involved

**Success Criteria**:
- Time guidelines provided
- Storage conditions specified
- Freshness indicators explained

### 19. Complex Resolution
**Input**: "My coffee tastes different every time despite using the same recipe"

**Expected Output**:
- Comprehensive troubleshooting
- Multiple factor analysis
- Tool calls:
  - `searchKnowledge` for variables
  - `createTicket` if needed
  - `addMessage` with analysis

**Context**:
- Complex issue
- Multiple variables

**Success Criteria**:
- Variable analysis provided
- Systematic approach
- Clear guidance

### 20. Closing Conversation
**Input**: "Thanks, that's all I needed!"

**Expected Output**:
- Resolve conversation
- Record satisfaction
- Tool calls:
  - `resolveChat` with positive metrics
  - `addMessage` with closure

**Context**:
- Successful interaction
- Ready for closure

**Success Criteria**:
- Proper resolution recorded
- Satisfaction captured
- Professional closure

## Database Impact Analysis

### Tables Affected:
1. `chats`
   - status updates
   - resolution timestamps
   - satisfaction metrics

2. `chat_messages`
   - message content
   - tool calls
   - context used
   - metrics

3. `tickets`
   - new tickets
   - status updates
   - priority assignments

4. `ai_metrics`
   - KRA scores
   - RGQS metrics
   - Tool usage stats

5. `kb_articles`
   - Read operations only
   - No modifications

### Metrics Collection:
1. Knowledge Retrieval Accuracy (KRA)
   - query_text
   - retrieved_chunks
   - relevant_chunks
   - accuracy
   - relevance_score
   - context_match

2. Response Generation Quality Score (RGQS)
   - response_text
   - overall_quality
   - relevance
   - accuracy
   - tone
   - human_rating (when available)

## Success Validation

### Automated Checks:
1. Response Quality
   - RGQS metrics above thresholds
   - PII detection accuracy
   - Response time within limits

2. Knowledge Retrieval
   - KRA metrics above thresholds
   - Context relevance scores
   - Query understanding accuracy

3. Tool Usage
   - Successful execution rates
   - Error handling
   - Response formatting

### Manual Review:
1. Content Quality
   - Response accuracy
   - Tone appropriateness
   - Completeness of information

2. User Satisfaction
   - Resolution rates
   - Feedback scores
   - Return user rates

3. Technical Accuracy
   - Correct tool selection
   - Appropriate escalation
   - Safety consideration 