import { render, screen } from '@testing-library/react'
import { MetricsDisplay } from '../metrics-display'
import { useAIMetrics } from '@/hooks/use-ai-metrics'
import { vi } from 'vitest'

// Mock the components
vi.mock('@/components/ui/progress', () => ({
    Progress: ({ value }: { value: number }) => (
        <div data-testid="progress-bar" data-value={value}>
            Progress: {value}%
        </div>
    )
}))

// Mock the hook
vi.mock('@/hooks/use-ai-metrics')

describe('MetricsDisplay', () => {
    const mockUseAIMetrics = useAIMetrics as jest.MockedFunction<typeof useAIMetrics>

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('shows loading state', () => {
        mockUseAIMetrics.mockReturnValue({
            loading: true,
            error: null,
            kraMetrics: undefined,
            rgqsMetrics: undefined,
            recordMetrics: vi.fn(),
            refreshMetrics: vi.fn()
        })

        render(<MetricsDisplay ticketId="test-123" />)
        expect(screen.getByTestId('metrics-loading')).toBeInTheDocument()
    })

    it('shows error state', () => {
        mockUseAIMetrics.mockReturnValue({
            loading: false,
            error: 'Failed to load metrics',
            kraMetrics: undefined,
            rgqsMetrics: undefined,
            recordMetrics: vi.fn(),
            refreshMetrics: vi.fn()
        })

        render(<MetricsDisplay ticketId="test-123" />)
        expect(screen.getByText(/Failed to load metrics/i)).toBeInTheDocument()
    })

    it('displays metrics correctly', () => {
        mockUseAIMetrics.mockReturnValue({
            loading: false,
            error: null,
            kraMetrics: {
                avg_score: 0.85,
                count: 2
            },
            rgqsMetrics: {
                avg_score: 0.78,
                count: 1
            },
            recordMetrics: vi.fn(),
            refreshMetrics: vi.fn()
        })

        render(<MetricsDisplay ticketId="test-123" />)

        const progressBars = screen.getAllByTestId('progress-bar')
        expect(progressBars[0]).toHaveAttribute('data-value', '85')
        expect(progressBars[1]).toHaveAttribute('data-value', '78')
        expect(screen.getByText('2 measurements')).toBeInTheDocument()
        expect(screen.getByText('1 measurements')).toBeInTheDocument()
    })
}) 