import { render } from '@testing-library/react'
import { Header } from '../header'
import { vi } from 'vitest'
import { useAuth } from '@/hooks/use-auth'
import { useRole } from '@/hooks/use-role'

// Mock the hooks
vi.mock('@/hooks/use-auth', () => ({
    useAuth: () => ({
        user: { id: 'test-user', email: 'test@example.com' },
        loading: false,
        error: null,
        signOut: vi.fn()
    })
}))

vi.mock('@/hooks/use-role', () => ({
    useRole: () => ({
        role: 'admin',
        isAdmin: true,
        loading: false
    })
}))

describe('Header', () => {
    it('should show correct role badge', () => {
        const { getByText } = render(<Header />)
        expect(getByText('Admin')).toBeInTheDocument()
    })

    it('should handle sign out errors gracefully', async () => {
        // Mock sign out error
        // Verify error handling UI
    })

    it('should disable buttons during loading states', () => {
        // Verify button states during loading
    })
}) 