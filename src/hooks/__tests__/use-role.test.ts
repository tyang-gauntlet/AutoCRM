import { renderHook, act } from '@testing-library/react'
import { useRole } from '../useRole'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useAuth } from '../useAuth'

vi.mock('@supabase/auth-helpers-nextjs')
vi.mock('../useAuth')

describe('useRole', () => {
    const mockUser = { id: 'test-user-id', email: 'test@example.com' }

    // Setup mock chain functions
    const mockFrom = vi.fn()
    const mockSelect = vi.fn()
    const mockEq = vi.fn()
    const mockSingle = vi.fn()

    beforeEach(() => {
        vi.clearAllMocks()

        // Reset chain mocks
        mockSelect.mockReturnValue({ eq: mockEq })
        mockEq.mockReturnValue({ single: mockSingle })
        mockFrom.mockReturnValue({ select: mockSelect })

            // Setup Supabase client mock
            ; (createClientComponentClient as jest.Mock).mockReturnValue({
                from: mockFrom
            })
            ; (useAuth as jest.Mock).mockReturnValue({ user: mockUser })
    })

    it('should initialize with loading state and default role', () => {
        const { result } = renderHook(() => useRole())
        expect(result.current.loading).toBe(true)
        expect(result.current.role).toBe('user')
    })

    it('should fetch and set user role', async () => {
        // Setup mock response
        mockSingle.mockResolvedValue({
            data: { role: 'admin' },
            error: null
        })

        const { result } = renderHook(() => useRole())

        // Wait for the effect to run and state to update
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100))
        })

        // Verify the final state
        expect(result.current.loading).toBe(false)
        expect(result.current.role).toBe('admin')
        expect(result.current.isAdmin).toBe(true)
    })

    it('should handle role fetch error', async () => {
        mockSingle.mockRejectedValue(new Error('Failed to fetch role'))

        const { result } = renderHook(() => useRole())

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 100))
        })

        expect(result.current.loading).toBe(false)
        expect(result.current.error).toBe('Failed to load user role')
        expect(result.current.role).toBe('user')
    })
}) 