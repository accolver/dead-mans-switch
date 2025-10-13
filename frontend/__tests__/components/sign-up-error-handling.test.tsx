import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import userEvent from "@testing-library/user-event"
import { signIn } from "next-auth/react"

// Mock NextAuth
vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}))

// Mock Next.js navigation
const mockSearchParams = new URLSearchParams()
vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(() => mockSearchParams),
}))

// Mock AuthForm component
vi.mock("@/components/auth-form", () => ({
  AuthForm: ({ children, title, description }: any) => (
    <div>
      <h1>{title}</h1>
      <div>{description}</div>
      {children}
    </div>
  ),
}))

// Mock fetch for registration API
global.fetch = vi.fn()

// Import the component after mocking
import SignUpPage from "@/app/sign-up/page"

describe("Sign-Up Error Handling", () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams.delete("next")

    // Mock window.location for redirects
    Object.defineProperty(window, "location", {
      value: {
        href: "http://localhost:3000/sign-up",
      },
      writable: true,
    })
  })

  describe("Client-Side Validation Errors", () => {
    it("should show error when passwords do not match", async () => {
      await act(async () => {
        await act(async () => {
          render(<SignUpPage />)
        })
      })

      const emailInput = screen.getByLabelText("Email address")
      const passwordInput = screen.getByLabelText("Password")
      const confirmPasswordInput = screen.getByLabelText("Confirm Password")
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      })

      await user.type(emailInput, "test@example.com")
      await user.type(passwordInput, "password123")
      await user.type(confirmPasswordInput, "differentpassword")
      await act(async () => {
        await user.click(submitButton)
      })

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument()
        expect(screen.getByText("Passwords do not match")).toBeInTheDocument()
      })
    })

    it("should show error when password is too short", async () => {
      await act(async () => {
        await act(async () => {
          render(<SignUpPage />)
        })
      })

      const emailInput = screen.getByLabelText("Email address")
      const passwordInput = screen.getByLabelText("Password")
      const confirmPasswordInput = screen.getByLabelText("Confirm Password")
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      })

      await user.type(emailInput, "test@example.com")
      await user.type(passwordInput, "short")
      await user.type(confirmPasswordInput, "short")
      await act(async () => {
        await user.click(submitButton)
      })

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument()
        expect(
          screen.getByText("Password must be at least 8 characters long"),
        ).toBeInTheDocument()
      })
    })

    it("should show error for invalid email format", async () => {
      await act(async () => {
        render(<SignUpPage />)
      })

      const emailInput = screen.getByLabelText("Email address")
      const passwordInput = screen.getByLabelText("Password")
      const confirmPasswordInput = screen.getByLabelText("Confirm Password")
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      })

      // Use an email that passes HTML5 validation but fails our custom validation
      await user.type(emailInput, "test@example")
      await user.type(passwordInput, "password123")
      await user.type(confirmPasswordInput, "password123")
      await act(async () => {
        await user.click(submitButton)
      })

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument()
        expect(
          screen.getByText("Please enter a valid email address"),
        ).toBeInTheDocument()
      })
    })
  })

  describe("Server-Side Registration Errors", () => {
    it("should display error when user already exists (400 status)", async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({
          error: "User with this email already exists",
        }),
      })

      await act(async () => {
        render(<SignUpPage />)
      })

      const emailInput = screen.getByLabelText("Email address")
      const passwordInput = screen.getByLabelText("Password")
      const confirmPasswordInput = screen.getByLabelText("Confirm Password")
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      })

      await user.type(emailInput, "existing@example.com")
      await user.type(passwordInput, "password123")
      await user.type(confirmPasswordInput, "password123")
      await act(async () => {
        await user.click(submitButton)
      })

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument()
        expect(
          screen.getByText(
            "An account with this email already exists. Please sign in instead.",
          ),
        ).toBeInTheDocument()
      })
    })

    it("should display error for conflict status (409)", async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({
          error: "Conflict error",
        }),
      })

      await act(async () => {
        render(<SignUpPage />)
      })

      const emailInput = screen.getByLabelText("Email address")
      const passwordInput = screen.getByLabelText("Password")
      const confirmPasswordInput = screen.getByLabelText("Confirm Password")
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      })

      await user.type(emailInput, "test@example.com")
      await user.type(passwordInput, "password123")
      await user.type(confirmPasswordInput, "password123")
      await act(async () => {
        await user.click(submitButton)
      })

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument()
        expect(
          screen.getByText(
            "An account with this email already exists. Please sign in instead.",
          ),
        ).toBeInTheDocument()
      })
    })

    it("should display error for validation errors (422)", async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 422,
        json: async () => ({
          error: "Password does not meet requirements",
        }),
      })

      await act(async () => {
        render(<SignUpPage />)
      })

      const emailInput = screen.getByLabelText("Email address")
      const passwordInput = screen.getByLabelText("Password")
      const confirmPasswordInput = screen.getByLabelText("Confirm Password")
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      })

      await user.type(emailInput, "test@example.com")
      await user.type(passwordInput, "password123")
      await user.type(confirmPasswordInput, "password123")
      await act(async () => {
        await user.click(submitButton)
      })

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument()
        expect(
          screen.getByText("Password does not meet requirements"),
        ).toBeInTheDocument()
      })
    })

    it("should display generic error for server errors (500)", async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({
          error: "Internal server error",
        }),
      })

      await act(async () => {
        render(<SignUpPage />)
      })

      const emailInput = screen.getByLabelText("Email address")
      const passwordInput = screen.getByLabelText("Password")
      const confirmPasswordInput = screen.getByLabelText("Confirm Password")
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      })

      await user.type(emailInput, "test@example.com")
      await user.type(passwordInput, "password123")
      await user.type(confirmPasswordInput, "password123")
      await act(async () => {
        await user.click(submitButton)
      })

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument()
        expect(
          screen.getByText("Server error occurred. Please try again later."),
        ).toBeInTheDocument()
      })
    })
  })

  describe("Network and Fetch Errors", () => {
    it("should handle network errors appropriately", async () => {
      global.fetch.mockRejectedValue(new TypeError("fetch failed"))

      await act(async () => {
        render(<SignUpPage />)
      })

      const emailInput = screen.getByLabelText("Email address")
      const passwordInput = screen.getByLabelText("Password")
      const confirmPasswordInput = screen.getByLabelText("Confirm Password")
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      })

      await user.type(emailInput, "test@example.com")
      await user.type(passwordInput, "password123")
      await user.type(confirmPasswordInput, "password123")
      await act(async () => {
        await user.click(submitButton)
      })

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument()
        expect(
          screen.getByText(
            "Network error. Please check your connection and try again.",
          ),
        ).toBeInTheDocument()
      })
    })

    it("should handle general errors with descriptive message", async () => {
      global.fetch.mockRejectedValue(new Error("Something went wrong"))

      await act(async () => {
        render(<SignUpPage />)
      })

      const emailInput = screen.getByLabelText("Email address")
      const passwordInput = screen.getByLabelText("Password")
      const confirmPasswordInput = screen.getByLabelText("Confirm Password")
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      })

      await user.type(emailInput, "test@example.com")
      await user.type(passwordInput, "password123")
      await user.type(confirmPasswordInput, "password123")
      await act(async () => {
        await user.click(submitButton)
      })

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument()
        expect(
          screen.getByText("Registration failed: Something went wrong"),
        ).toBeInTheDocument()
      })
    })
  })

  describe("Successful Registration with Auto Sign-In Errors", () => {
    it("should show error when registration succeeds but auto sign-in fails", async () => {
      // FAILING TEST: This might expose a gap in error handling after successful registration
      global.fetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          user: { id: "user-123", email: "test@example.com", name: null },
          isExistingUser: false,
        }),
      })

      vi.mocked(signIn).mockResolvedValue({
        error: "CredentialsSignin",
        ok: false,
      })

      await act(async () => {
        render(<SignUpPage />)
      })

      const emailInput = screen.getByLabelText("Email address")
      const passwordInput = screen.getByLabelText("Password")
      const confirmPasswordInput = screen.getByLabelText("Confirm Password")
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      })

      await user.type(emailInput, "test@example.com")
      await user.type(passwordInput, "password123")
      await user.type(confirmPasswordInput, "password123")
      await act(async () => {
        await user.click(submitButton)
      })

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument()
        expect(
          screen.getByText(
            "Account created successfully, but automatic sign-in failed. Please sign in manually.",
          ),
        ).toBeInTheDocument()
      })
    })

    it("should handle undefined signIn result after successful registration", async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          user: { id: "user-123", email: "test@example.com", name: null },
          isExistingUser: false,
        }),
      })

      vi.mocked(signIn).mockResolvedValue(undefined)

      await act(async () => {
        render(<SignUpPage />)
      })

      const emailInput = screen.getByLabelText("Email address")
      const passwordInput = screen.getByLabelText("Password")
      const confirmPasswordInput = screen.getByLabelText("Confirm Password")
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      })

      await user.type(emailInput, "test@example.com")
      await user.type(passwordInput, "password123")
      await user.type(confirmPasswordInput, "password123")
      await act(async () => {
        await user.click(submitButton)
      })

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument()
        expect(
          screen.getByText(
            "Account created successfully, but sign-in failed. Please try signing in manually.",
          ),
        ).toBeInTheDocument()
      })
    })
  })

  describe("Loading State Management", () => {
    it("should show loading state during registration", async () => {
      global.fetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  status: 201,
                  json: async () => ({
                    success: true,
                    user: { id: "user-123" },
                  }),
                }),
              100,
            ),
          ),
      )

      await act(async () => {
        render(<SignUpPage />)
      })

      const emailInput = screen.getByLabelText("Email address")
      const passwordInput = screen.getByLabelText("Password")
      const confirmPasswordInput = screen.getByLabelText("Confirm Password")
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      })

      await user.type(emailInput, "test@example.com")
      await user.type(passwordInput, "password123")
      await user.type(confirmPasswordInput, "password123")

      expect(submitButton).not.toBeDisabled()
      expect(submitButton).toHaveTextContent("Create account")

      await act(async () => {
        await user.click(submitButton)
      })

      // Should show loading state
      expect(submitButton).toBeDisabled()
      expect(submitButton).toHaveTextContent("Creating account...")

      await waitFor(
        () => {
          expect(submitButton).not.toBeDisabled()
        },
        { timeout: 200 },
      )
    })

    it("should clear loading state when error occurs", async () => {
      global.fetch.mockRejectedValue(new Error("Network error"))

      await act(async () => {
        render(<SignUpPage />)
      })

      const emailInput = screen.getByLabelText("Email address")
      const passwordInput = screen.getByLabelText("Password")
      const confirmPasswordInput = screen.getByLabelText("Confirm Password")
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      })

      await user.type(emailInput, "test@example.com")
      await user.type(passwordInput, "password123")
      await user.type(confirmPasswordInput, "password123")
      await act(async () => {
        await user.click(submitButton)
      })

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument()
        expect(submitButton).not.toBeDisabled()
        expect(submitButton).toHaveTextContent("Create account")
      })
    })
  })

  describe("Error Clearing Behavior", () => {
    it("should clear error when starting new registration attempt", async () => {
      // First, show an error
      await act(async () => {
        render(<SignUpPage />)
      })

      const emailInput = screen.getByLabelText("Email address")
      const passwordInput = screen.getByLabelText("Password")
      const confirmPasswordInput = screen.getByLabelText("Confirm Password")
      const submitButton = screen.getByRole("button", {
        name: /create account/i,
      })

      await user.type(emailInput, "test@example")
      await user.type(passwordInput, "password123")
      await user.type(confirmPasswordInput, "password123")
      await act(async () => {
        await user.click(submitButton)
      })

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument()
      })

      // Clear the form and try again with valid data
      await user.clear(emailInput)
      await user.clear(passwordInput)
      await user.clear(confirmPasswordInput)

      // Mock successful registration for second attempt
      global.fetch.mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({
          success: true,
          user: { id: "user-123", email: "test@example.com", name: null },
          isExistingUser: false,
        }),
      })
      vi.mocked(signIn).mockResolvedValue({ ok: true })

      await user.type(emailInput, "test@example.com")
      await user.type(passwordInput, "password123")
      await user.type(confirmPasswordInput, "password123")
      await act(async () => {
        await user.click(submitButton)
      })

      // Error should be cleared when starting new attempt
      await waitFor(() => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument()
      })
    })
  })
})
