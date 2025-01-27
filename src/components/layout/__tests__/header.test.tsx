import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from '../header'
import { vi } from 'vitest'
import { act } from '@testing-library/react'
import { useAuthContext } from '@/contexts/auth-context'

// Mock auth context
vi.mock('@/contexts/auth-context', () => ({
    useAuthContext: vi.fn(() => ({
        user: { email: 'test@example.com' },
        session: { user: { email: 'test@example.com' } },
        loading: false,
        initialized: true,
    }))
}))

// Mock useRole hook
vi.mock('@/hooks/use-role', () => ({
    useRole: () => ({
        role: 'user',
        loading: false,
        isAdmin: false,
        isUser: true
    })
}))

// Mock useAuth hook
const mockSignOut = vi.fn()
vi.mock('@/hooks/use-auth', () => ({
    useAuth: () => ({
        signOut: mockSignOut,
        loading: false
    })
}))

describe('Header', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should show correct user info', () => {
        render(<Header />)
        expect(screen.getByText('test@example.com')).toBeInTheDocument()
        expect(screen.getByText('User')).toBeInTheDocument()
    })

    it('should handle sign out', async () => {
        render(<Header />)
        const signOutButton = screen.getByLabelText('Sign out')
        await act(async () => {
            await fireEvent.click(signOutButton)
        })
        expect(mockSignOut).toHaveBeenCalled()
    })

    it('should show loading spinner during loading states', () => {
        vi.mocked(useAuthContext).mockReturnValueOnce({
            user: null,
            session: null,
            loading: true,
            initialized: false
        })
        render(<Header />)
        expect(screen.getByRole('status')).toBeInTheDocument()
    })
}) 