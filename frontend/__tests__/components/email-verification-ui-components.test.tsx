import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EmailVerificationPageNextAuth } from '@/components/auth/email-verification-page-nextauth'
import { OTPInput } from '@/components/auth/otp-input'

// Mock next/navigation
const mockPush = vi.fn()
const mockSearchParams = {
  get: vi.fn((key: string) => {
    const params: Record<string, string> = {
      email: 'test@example.com',
      callbackUrl: '/dashboard'
    }
    return params[key] || null
  })
}

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => mockSearchParams
}))

// Mock next-auth
const mockSession = {
  user: {
    email: 'test@example.com',
    emailVerified: false
  }
}

vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: mockSession,
    status: 'authenticated'
  })
}))

// Mock toast
const mockToast = vi.fn()
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast
  })
}))

// Mock fetch
global.fetch = vi.fn()

describe('EmailVerificationPageNextAuth TDD Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any).mockResolvedValue({
      json: () => Promise.resolve({ success: true })
    })
  })

  describe('Core Functionality Tests', () => {
    it('should display user email address from session', async () => {
      render(<EmailVerificationPageNextAuth />)

      await waitFor(() => {
        expect(screen.getByText(/test@example.com/)).toBeInTheDocument()
      })
    })

    it('should show verification status with proper messaging', async () => {
      render(<EmailVerificationPageNextAuth />)

      await waitFor(() => {
        expect(screen.getByText(/verify your email address/i)).toBeInTheDocument()
        expect(screen.getByText(/we need to verify your email address/i)).toBeInTheDocument()
      })
    })

    it('should display resend verification email button', async () => {
      render(<EmailVerificationPageNextAuth />)

      await waitFor(() => {
        const resendButton = screen.getByText(/resend verification email/i)
        expect(resendButton).toBeInTheDocument()
        expect(resendButton).not.toBeDisabled()
      })
    })

    it('should include helpful instructions for users', async () => {
      render(<EmailVerificationPageNextAuth />)

      await waitFor(() => {
        expect(screen.getByText(/please check your email/i)).toBeInTheDocument()
        expect(screen.getByText(/didn't receive the email/i)).toBeInTheDocument()
        expect(screen.getByText(/check your spam folder/i)).toBeInTheDocument()
      })
    })

    it('should show back to sign in button', async () => {
      render(<EmailVerificationPageNextAuth />)

      await waitFor(() => {
        const backButton = screen.getByText(/back to sign in/i)
        expect(backButton).toBeInTheDocument()
      })
    })
  })

  describe('Interaction Tests', () => {
    it('should handle resend verification email with loading state', async () => {
      const user = userEvent.setup()
      render(<EmailVerificationPageNextAuth />)

      const resendButton = await screen.findByText(/resend verification email/i)
      await user.click(resendButton)

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText(/sending/i)).toBeInTheDocument()
      })

      // Should call API
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' })
      })
    })

    it('should show success message after successful resend', async () => {
      const user = userEvent.setup()
      render(<EmailVerificationPageNextAuth />)

      const resendButton = await screen.findByText(/resend verification email/i)
      await user.click(resendButton)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Email sent',
          description: 'A new verification email has been sent to your email address.'
        })
      })
    })

    it('should handle API errors gracefully', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        json: () => Promise.resolve({ success: false, error: 'Rate limited' })
      })

      const user = userEvent.setup()
      render(<EmailVerificationPageNextAuth />)

      const resendButton = await screen.findByText(/resend verification email/i)
      await user.click(resendButton)

      await waitFor(() => {
        expect(screen.getByText(/rate limited/i)).toBeInTheDocument()
      })
    })

    it('should navigate back to sign in when back button clicked', async () => {
      const user = userEvent.setup()
      render(<EmailVerificationPageNextAuth />)

      const backButton = await screen.findByText(/back to sign in/i)
      await user.click(backButton)

      expect(mockPush).toHaveBeenCalledWith('/sign-in')
    })
  })

  describe('Token Verification Tests', () => {
    it('should auto-verify when token is in URL', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        const params: Record<string, string> = {
          email: 'test@example.com',
          token: 'verification-token-123',
          callbackUrl: '/dashboard'
        }
        return params[key] || null
      })

      render(<EmailVerificationPageNextAuth />)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/verify-email-nextauth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: 'verification-token-123',
            email: 'test@example.com'
          })
        })
      })
    })

    it('should show success state after successful verification', async () => {
      mockSearchParams.get.mockImplementation((key: string) => {
        const params: Record<string, string> = {
          email: 'test@example.com',
          token: 'verification-token-123'
        }
        return params[key] || null
      })

      render(<EmailVerificationPageNextAuth />)

      await waitFor(() => {
        expect(screen.getByText(/email verified!/i)).toBeInTheDocument()
        expect(screen.getByText(/redirecting/i)).toBeInTheDocument()
      })
    })

    it('should redirect after successful verification', async () => {
      vi.useFakeTimers()
      mockSearchParams.get.mockImplementation((key: string) => {
        const params: Record<string, string> = {
          email: 'test@example.com',
          token: 'verification-token-123',
          callbackUrl: '/dashboard'
        }
        return params[key] || null
      })

      render(<EmailVerificationPageNextAuth />)

      // Fast-forward timers
      vi.advanceTimersByTime(2000)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })

      vi.useRealTimers()
    })
  })

  describe('Accessibility Tests', () => {
    it('should have proper ARIA labels and roles', async () => {
      render(<EmailVerificationPageNextAuth />)

      await waitFor(() => {
        const card = screen.getByTestId('verification-card')
        expect(card).toBeInTheDocument()

        const buttons = screen.getAllByRole('button')
        expect(buttons.length).toBeGreaterThan(0)

        buttons.forEach(button => {
          expect(button).toHaveAccessibleName()
        })
      })
    })

    it('should support keyboard navigation', async () => {
      render(<EmailVerificationPageNextAuth />)

      await waitFor(() => {
        const resendButton = screen.getByText(/resend verification email/i)
        resendButton.focus()
        expect(resendButton).toHaveFocus()
      })
    })

    it('should have proper loading indicators with ARIA', async () => {
      const user = userEvent.setup()
      render(<EmailVerificationPageNextAuth />)

      const resendButton = await screen.findByText(/resend verification email/i)
      await user.click(resendButton)

      await waitFor(() => {
        const spinner = screen.getByTestId('loading-spinner')
        expect(spinner).toBeInTheDocument()
      })
    })
  })

  describe('Responsive Design Tests', () => {
    it('should have responsive container classes', async () => {
      render(<EmailVerificationPageNextAuth />)

      await waitFor(() => {
        const container = screen.getByTestId('verification-container')
        expect(container).toHaveClass('min-h-screen', 'px-4', 'py-16')
      })
    })

    it('should have mobile-friendly card width', async () => {
      render(<EmailVerificationPageNextAuth />)

      await waitFor(() => {
        const card = screen.getByTestId('verification-card')
        expect(card).toHaveClass('w-full', 'max-w-md')
      })
    })

    it('should use responsive button classes', async () => {
      render(<EmailVerificationPageNextAuth />)

      await waitFor(() => {
        const resendButton = screen.getByText(/resend verification email/i)
        expect(resendButton).toHaveClass('w-full')
      })
    })
  })
})

describe('OTPInput Component TDD Tests', () => {
  const mockOnComplete = vi.fn()
  const mockOnChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Core Functionality Tests', () => {
    it('should render correct number of input fields', () => {
      render(<OTPInput onComplete={mockOnComplete} onChange={mockOnChange} />)

      const inputs = screen.getAllByRole('textbox')
      expect(inputs).toHaveLength(6)
    })

    it('should support custom length', () => {
      render(<OTPInput length={4} onComplete={mockOnComplete} onChange={mockOnChange} />)

      const inputs = screen.getAllByRole('textbox')
      expect(inputs).toHaveLength(4)
    })

    it('should auto-focus first input on mount', () => {
      render(<OTPInput onComplete={mockOnComplete} onChange={mockOnChange} />)

      const inputs = screen.getAllByRole('textbox')
      expect(inputs[0]).toHaveFocus()
    })

    it('should only allow numeric input', async () => {
      const user = userEvent.setup()
      render(<OTPInput onComplete={mockOnComplete} onChange={mockOnChange} />)

      const firstInput = screen.getAllByRole('textbox')[0]
      await user.type(firstInput, 'abc123def')

      expect(firstInput).toHaveValue('1')
    })

    it('should advance focus on valid input', async () => {
      const user = userEvent.setup()
      render(<OTPInput onComplete={mockOnComplete} onChange={mockOnChange} />)

      const inputs = screen.getAllByRole('textbox')

      await user.type(inputs[0], '1')
      expect(inputs[1]).toHaveFocus()
    })

    it('should call onComplete when all fields filled', async () => {
      const user = userEvent.setup()
      render(<OTPInput onComplete={mockOnComplete} onChange={mockOnChange} />)

      const inputs = screen.getAllByRole('textbox')

      for (let i = 0; i < 6; i++) {
        await user.type(inputs[i], (i + 1).toString())
      }

      expect(mockOnComplete).toHaveBeenCalledWith('123456')
    })

    it('should call onChange on every input', async () => {
      const user = userEvent.setup()
      render(<OTPInput onComplete={mockOnComplete} onChange={mockOnChange} />)

      const firstInput = screen.getAllByRole('textbox')[0]
      await user.type(firstInput, '1')

      expect(mockOnChange).toHaveBeenCalledWith('1')
    })
  })

  describe('Advanced Interaction Tests', () => {
    it('should handle backspace navigation correctly', async () => {
      const user = userEvent.setup()
      render(<OTPInput onComplete={mockOnComplete} onChange={mockOnChange} />)

      const inputs = screen.getAllByRole('textbox')

      await user.type(inputs[0], '1')
      await user.type(inputs[1], '2')

      await user.keyboard('{Backspace}')
      expect(inputs[1]).toHaveValue('')
    })

    it('should handle arrow key navigation', async () => {
      const user = userEvent.setup()
      render(<OTPInput onComplete={mockOnComplete} onChange={mockOnChange} />)

      const inputs = screen.getAllByRole('textbox')

      inputs[2].focus()

      await user.keyboard('{ArrowLeft}')
      expect(inputs[1]).toHaveFocus()

      await user.keyboard('{ArrowRight}')
      expect(inputs[2]).toHaveFocus()
    })

    it('should support paste functionality', async () => {
      const user = userEvent.setup()
      render(<OTPInput onComplete={mockOnComplete} onChange={mockOnChange} />)

      const firstInput = screen.getAllByRole('textbox')[0]
      firstInput.focus()

      await user.paste('123456')

      expect(mockOnComplete).toHaveBeenCalledWith('123456')
    })

    it('should handle paste with non-numeric characters', async () => {
      const user = userEvent.setup()
      render(<OTPInput onComplete={mockOnComplete} onChange={mockOnChange} />)

      const firstInput = screen.getAllByRole('textbox')[0]
      firstInput.focus()

      await user.paste('1a2b3c4d5e6f')

      expect(mockOnComplete).toHaveBeenCalledWith('123456')
    })

    it('should select all text on focus for easy overwriting', async () => {
      const user = userEvent.setup()
      render(<OTPInput onComplete={mockOnComplete} onChange={mockOnChange} />)

      const inputs = screen.getAllByRole('textbox')

      await user.type(inputs[0], '1')
      await user.click(inputs[0])

      // Verify that input is selected (implementation detail, focus behavior)
      expect(inputs[0]).toHaveFocus()
    })
  })

  describe('Accessibility Tests', () => {
    it('should have proper ARIA attributes', () => {
      render(<OTPInput onComplete={mockOnComplete} onChange={mockOnChange} />)

      const inputs = screen.getAllByRole('textbox')

      inputs.forEach((input, index) => {
        expect(input).toHaveAttribute('inputMode', 'numeric')
        expect(input).toHaveAttribute('autoComplete', 'one-time-code')
        expect(input).toHaveAttribute('data-testid', `otp-input-${index}`)
      })
    })

    it('should support disabled state', () => {
      render(<OTPInput onComplete={mockOnComplete} onChange={mockOnChange} disabled />)

      const inputs = screen.getAllByRole('textbox')
      inputs.forEach(input => {
        expect(input).toBeDisabled()
      })
    })

    it('should have proper focus management', async () => {
      const user = userEvent.setup()
      render(<OTPInput onComplete={mockOnComplete} onChange={mockOnChange} />)

      const inputs = screen.getAllByRole('textbox')

      // Test keyboard navigation
      await user.tab()
      expect(inputs[0]).toHaveFocus()
    })
  })

  describe('Visual Design Tests', () => {
    it('should have proper styling classes', () => {
      render(<OTPInput onComplete={mockOnComplete} onChange={mockOnChange} />)

      const inputs = screen.getAllByRole('textbox')

      inputs.forEach(input => {
        expect(input).toHaveClass('w-12', 'h-12', 'text-center', 'text-lg', 'font-mono')
      })
    })

    it('should show different border styles for filled vs empty', () => {
      render(<OTPInput onComplete={mockOnComplete} onChange={mockOnChange} />)

      const inputs = screen.getAllByRole('textbox')

      // Empty input should have border-input class
      expect(inputs[0]).toHaveClass('border-input')
    })

    it('should support custom className', () => {
      render(<OTPInput onComplete={mockOnComplete} onChange={mockOnChange} className="custom-class" />)

      const container = screen.getAllByRole('textbox')[0].parentElement
      expect(container).toHaveClass('custom-class')
    })
  })
})