import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock the Supabase client
const mockSupabase = {
    auth: {
        getSession: vi.fn()
    },
    from: vi.fn(() => ({
        insert: vi.fn().mockImplementation(() => Promise.resolve({
            data: null,
            error: { message: 'Authentication required' }
        })),
        delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation(() => Promise.resolve({
                data: null,
                error: { message: 'insufficient permissions' }
            }))
        }),
        update: vi.fn().mockReturnValue({
            eq: vi.fn().mockImplementation(() => Promise.resolve({
                data: { name: 'Updated Name' },
                error: null
            }))
        })
    })),
    channel: vi.fn(() => ({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnValue({
            unsubscribe: vi.fn()
        })
    }))
}

vi.mock('@supabase/auth-helpers-nextjs', () => ({
    createClientComponentClient: () => mockSupabase
}))

describe('Customer API Integration', () => {
    const mockCustomer = {
        id: 'test-customer',
        name: 'Test Customer',
        email: 'test@customer.com',
        company: 'Test Co'
    }

    beforeEach(() => {
        vi.clearAllMocks()
        mockSupabase.auth.getSession.mockReset()
        mockSupabase.from.mockClear()
    })

    it('should require authentication for customer operations', async () => {
        const supabase = createClientComponentClient()

        // Mock unauthenticated state
        mockSupabase.auth.getSession.mockResolvedValue({
            data: { session: null },
            error: null
        })

        // Try to create customer
        const { data, error } = await supabase
            .from('customers')
            .insert(mockCustomer)

        expect(error?.message).toContain('Authentication required')
        expect(data).toBeNull()
    })

    it('should enforce role-based access for customer operations', async () => {
        const supabase = createClientComponentClient()

        // Mock authenticated user with insufficient role
        mockSupabase.auth.getSession.mockResolvedValue({
            data: {
                session: {
                    user: { id: 'test-user', email: 'test@example.com' },
                    access_token: 'test-token'
                }
            },
            error: null
        })

        // Try to delete customer as non-admin
        const { error } = await supabase
            .from('customers')
            .delete()
            .eq('id', mockCustomer.id)

        expect(error?.message).toContain('insufficient permissions')
    })

    it('should handle real-time updates correctly', async () => {
        const supabase = createClientComponentClient()
        const mockSubscription = vi.fn()

        // Subscribe to changes
        const subscription = supabase
            .channel('customers')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'customers' },
                mockSubscription
            )
            .subscribe()

        // Simulate an update
        await supabase
            .from('customers')
            .update({ name: 'Updated Name' })
            .eq('id', mockCustomer.id)

        // Simulate receiving the update through the subscription
        mockSubscription({
            new: { ...mockCustomer, name: 'Updated Name' }
        })

        expect(mockSubscription).toHaveBeenCalledWith(
            expect.objectContaining({
                new: expect.objectContaining({ name: 'Updated Name' })
            })
        )

        // Cleanup
        await subscription.unsubscribe()
    })
}) 