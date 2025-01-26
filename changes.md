# Code Refactoring and Stylistic Changes

## 1. TypeScript Enhancements

### Type Definitions
- Create dedicated type files for AI-related interfaces
```typescript:src/types/ai.ts
interface AIResponse {
  content: string
  metadata: {
    model: string
    tokens: number
    latency: number
    quality_score: number
  }
  context_used: string[]
  pii_detected: boolean
}

interface RAGResult {
  relevance_score: number
  source_documents: string[]
  context_chunks: string[]
}
```

### Constants Organization
- Move all AI-related constants to dedicated files
```typescript:src/constants/ai.ts
export const AI_TIMEOUTS = {
  INITIAL_RESPONSE: 2000,
  TOOL_EXECUTION: 5000,
  EMBEDDING_GENERATION: 10000
}

export const RATE_LIMITS = {
  AI_REQUESTS_PER_MIN: 60,
  EMBEDDINGS_PER_MIN: 100,
  TOOL_CALLS_PER_MIN: 30
}
```

## 2. Component Architecture Improvements

### Shared Components
- Extract repeated prose styling into a shared component:
```typescript:src/components/ui/prose.tsx
import { cn } from "@/lib/utils"

interface ProseProps {
  children: React.ReactNode
  className?: string
  isCompact?: boolean
}

export function Prose({ children, className, isCompact }: ProseProps) {
  return (
    <div
      className={cn(
        "prose dark:prose-invert max-w-none",
        isCompact && "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        // Headings
        "[&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-4",
        "[&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-4",
        "[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2",
        // Other existing prose styles...
        className
      )}
    >
      {children}
    </div>
  )
}
```

### AI Components
- Create reusable AI-specific components:
```typescript:src/components/ai/response-generator.tsx
interface ResponseGeneratorProps {
  ticketId: string
  onResponse: (response: AIResponse) => void
  onError: (error: Error) => void
}
```

## 3. Hook Refactoring

### AI Hooks
- Split useTicketDetails into smaller, focused hooks:
```typescript:src/hooks/use-ai-response.ts
export function useAIResponse(ticketId: string) {
  const [response, setResponse] = useState<AIResponse | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Implementation...
}
```

### Real-time Updates
- Enhance real-time subscription handling:
```typescript:src/hooks/use-realtime.ts
export function useRealtimeSubscription(
  table: string,
  filter?: Record<string, any>
) {
  // Implementation...
}
```

## 4. API Route Organization

### Route Structure
```plaintext
src/app/api/
  ├── ai/
  │   ├── generate/
  │   │   └── route.ts
  │   ├── suggest/
  │   │   └── route.ts
  │   └── route-ticket/
  │       └── route.ts
  ├── kb/
  │   ├── upload/
  │   │   └── route.ts
  │   └── search/
  │       └── route.ts
  └── tools/
      └── execute/
          └── route.ts
```

### API Handlers
- Implement consistent error handling and response formatting:
```typescript:src/lib/api-utils.ts
export function createApiHandler<T>(
  handler: (req: Request) => Promise<T>
) {
  return async function(req: Request) {
    try {
      const result = await handler(req)
      return Response.json({ data: result })
    } catch (error) {
      // Error handling...
    }
  }
}
```

## 5. Styling Improvements

### Tailwind Organization
- Create consistent color scheme variables:
```css:src/app/globals.css
@layer base {
  :root {
    --ai-primary: 142 76% 36%;
    --ai-secondary: 142 76% 46%;
    --ai-accent: 142 76% 56%;
    /* Other AI-specific colors... */
  }
}
```

### Component Styling
- Use consistent spacing and layout utilities:
```typescript:src/constants/styles.ts
export const LAYOUT_STYLES = {
  page: "container mx-auto p-8",
  section: "space-y-6",
  card: "p-6 rounded-lg border bg-card",
}
```

## 6. Performance Optimizations

### Code Splitting
- Implement dynamic imports for AI features:
```typescript:src/components/ai/index.ts
export const AIResponseGenerator = dynamic(() =>
  import('./response-generator').then(mod => mod.AIResponseGenerator)
)
```

### Caching Strategy
- Add React Query for AI responses:
```typescript:src/hooks/use-cached-ai-response.ts
export function useCachedAIResponse(ticketId: string) {
  return useQuery(['ai-response', ticketId], () =>
    fetchAIResponse(ticketId),
    {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 30, // 30 minutes
    }
  )
}
```

## 7. Testing Infrastructure

### Test Utils
```typescript:src/test/ai-utils.ts
export function mockAIResponse(overrides?: Partial<AIResponse>): AIResponse {
  return {
    content: "Mocked response",
    metadata: {
      model: "gpt-4",
      tokens: 150,
      latency: 1200,
      quality_score: 0.95
    },
    ...overrides
  }
}
```

### Component Testing
```typescript:src/components/ai/__tests__/response-generator.test.tsx
describe('AIResponseGenerator', () => {
  it('should handle rate limiting correctly', async () => {
    // Test implementation...
  })
})
```

## Implementation Priority

1. Type System Improvements
   - Add AI-related types
   - Enhance existing interfaces
   - Add strict type checking

2. Component Architecture
   - Extract Prose component
   - Create AI components
   - Implement shared utilities

3. Hook Refactoring
   - Split complex hooks
   - Add AI-specific hooks
   - Enhance real-time functionality

4. API Organization
   - Restructure routes
   - Add consistent error handling
   - Implement rate limiting

5. Styling Updates
   - Add AI-specific theme
   - Create shared layouts
   - Implement responsive designs

6. Performance
   - Add code splitting
   - Implement caching
   - Optimize real-time updates

7. Testing
   - Add test utilities
   - Create test suites
   - Add integration tests

## Security Considerations

- Add rate limiting middleware
- Implement PII detection
- Add input validation
- Enhance error handling
- Add audit logging

## Monitoring

- Add performance tracking
- Implement error logging
- Add usage analytics
- Track AI metrics

These changes will improve code organization, maintainability, and prepare the codebase for the AI features outlined in step2.md while following the architectural guidelines from instructions.md. 