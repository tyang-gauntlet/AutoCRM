import { render, fireEvent } from '@testing-library/react'
import AuthError from '../error'

describe('AuthError', () => {
    it('should display custom error messages', () => {
        const error = new Error('Custom error message')
        const { getByText } = render(<AuthError error={error} reset={() => { }} />)
        expect(getByText('Custom error message')).toBeInTheDocument()
    })

    it('should handle reset action', () => {
        const mockReset = vi.fn()
        const { getByRole } = render(<AuthError error={new Error()} reset={mockReset} />)
        fireEvent.click(getByRole('button'))
        expect(mockReset).toHaveBeenCalled()
    })
}) 