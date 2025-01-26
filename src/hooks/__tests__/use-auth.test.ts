import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAuth } from '../use-auth'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { AuthChangeEvent } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

// Mock Supabase client
const mockAuthStateChange = vi.fn()
const mockAuth = {
    getSession: vi.fn(),
    signOut: vi.fn(),
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    onAuthStateChange: vi.fn((callback) => {
        mockAuthStateChange.mockImplementation(
            (event: AuthChangeEvent) => callback(event, null)
        )
        return { data: { subscription: { unsubscribe: vi.fn() } } }
    })
}

vi.mock('@supabase/auth-helpers-nextjs', () => ({
    createClientComponentClient: () => ({
        auth: mockAuth
    })
}))

// Mock window.location
const mockReplace = vi.fn()

const mockRouter = {
    refresh: vi.fn(),
    push: vi.fn()
}

vi.mock('next/navigation', () => ({
    useRouter: () => mockRouter
}))

describe('useAuth', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        localStorage.clear()
        mockReplace.mockClear()

        // Set mock location
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: {
                ...window.location,
                pathname: '/dashboard',
                replace: mockReplace
            }
        })

        // Setup default mock responses
        mockAuth.getSession.mockResolvedValue({
            data: {
                session: {
                    user: { id: 'test-user-id', email: 'test@example.com' }
                }
            },
            error: null
        })
        mockAuth.signOut.mockResolvedValue({ error: null })
        mockAuth.signUp.mockResolvedValue({
            data: { user: { id: 'new-user-id', email: 'new@example.com' } },
            error: null
        })
        mockAuth.signInWithPassword.mockResolvedValue({
            data: { user: { id: 'test-user-id' } },
            error: null
        })
    })

    afterEach(() => {
        // Reset mock location
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: window.location
        })
    })

    it('should initialize with loading state', () => {
        const { result } = renderHook(() => useAuth())
        expect(result.current.loading).toBe(true)
    })

    it('should load user session on mount', async () => {
        const { result } = renderHook(() => useAuth())

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 50))
        })

        expect(result.current.loading).toBe(false)
        expect(result.current.user).toEqual({
            id: 'test-user-id',
            email: 'test@example.com'
        })
        // No router refresh on initial load
        expect(mockRouter.refresh).not.toHaveBeenCalled()
    })

    it('should handle sign in state change', async () => {
        const { result } = renderHook(() => useAuth())

        await act(async () => {
            mockAuthStateChange('SIGNED_IN')
        })

        expect(result.current.loading).toBe(false)
        expect(mockRouter.refresh).toHaveBeenCalledTimes(1)
    })

    it('should handle sign out', async () => {
        const { result } = renderHook(() => useAuth())

        await act(async () => {
            await result.current.signOut()
            mockAuthStateChange('SIGNED_OUT')
        })

        expect(result.current.user).toBeNull()
        expect(localStorage.length).toBe(0)
        expect(mockRouter.refresh).toHaveBeenCalledTimes(1)
    })

    it('should handle sign up', async () => {
        const mockSignUpData = {
            user: { id: 'new-user-id', email: 'new@example.com' },
            session: null
        }
        mockAuth.signUp.mockResolvedValue({
            data: mockSignUpData,
            error: null
        })

        const { result } = renderHook(() => useAuth())

        let signUpResult
        await act(async () => {
            signUpResult = await result.current.signUp('new@example.com', 'password123')
        })

        expect(mockAuth.signUp).toHaveBeenCalledWith({
            email: 'new@example.com',
            password: 'password123',
            options: {
                emailRedirectTo: expect.any(String)
            }
        })
        expect(signUpResult).toEqual(mockSignUpData)
    })

    it('should handle session errors', async () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => { })
        mockAuth.getSession.mockRejectedValue(new Error('Session error'))

        const { result } = renderHook(() => useAuth())

        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 50))
        })

        expect(result.current.loading).toBe(false)
        expect(result.current.user).toBeNull()
        expect(consoleError).toHaveBeenCalled()

        consoleError.mockRestore()
    })

    it('should handle sign out errors', async () => {
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => { })
        mockAuth.signOut.mockRejectedValue(new Error('Sign out error'))

        const { result } = renderHook(() => useAuth())

        await act(async () => {
            try {
                await result.current.signOut()
            } catch (error) {
                // Error is expected
            }
        })

        expect(consoleError).toHaveBeenCalledWith(
            '[useAuth] Error signing out:',
            expect.any(Error)
        )
        expect(result.current.error).toBe('Failed to sign out')

        consoleError.mockRestore()
    })

    it('should clean up subscription on unmount', async () => {
        const unsubscribe = vi.fn()
        mockAuth.onAuthStateChange.mockReturnValue({
            data: { subscription: { unsubscribe } }
        })

        const { unmount } = renderHook(() => useAuth())
        unmount()

        expect(unsubscribe).toHaveBeenCalled()
    })

    it('should handle sign in errors correctly', async () => {
        mockAuth.signInWithPassword.mockRejectedValue(new Error('Invalid credentials'))
        const { result } = renderHook(() => useAuth())

        await act(async () => {
            try {
                await result.current.signIn('test@example.com', 'wrong-password')
            } catch (error) {
                // Error expected
            }
        })

        expect(result.current.error).toBe('Invalid credentials')
    })

    it('should handle email verification state', async () => {
        // Override the default mock specifically for this test
        mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null })
        mockAuth.signUp.mockResolvedValue({
            data: {
                user: { id: 'new-user', email: 'new@example.com', email_confirmed_at: null },
                session: null
            },
            error: null
        })

        const { result } = renderHook(() => useAuth())
        await act(async () => {
            await result.current.signUp('new@example.com', 'password123')
        })

        expect(result.current.user).toBeNull()
    })
}) 