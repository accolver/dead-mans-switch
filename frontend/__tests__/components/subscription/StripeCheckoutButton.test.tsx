import { StripeCheckoutButton } from "@/components/subscription/StripeCheckoutButton"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock fetch
global.fetch = vi.fn()
const mockFetch = global.fetch as any

// Mock window.location
delete (window as any).location
window.location = { href: "" } as any

describe("StripeCheckoutButton", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.location.href = ""
  })

  it("should render button with children text", () => {
    render(
      <StripeCheckoutButton lookupKey="pro_monthly">
        Subscribe to Pro
      </StripeCheckoutButton>,
    )

    expect(screen.getByRole("button")).toHaveTextContent("Subscribe to Pro")
  })

  it("should be disabled when disabled prop is true", () => {
    render(
      <StripeCheckoutButton lookupKey="pro_monthly" disabled>
        Subscribe to Pro
      </StripeCheckoutButton>,
    )

    expect(screen.getByRole("button")).toBeDisabled()
  })

  it("should call checkout API on button click", async () => {
    mockFetch.mockResolvedValueOnce({
      redirected: true,
      url: "https://checkout.stripe.com/session/cs_123",
    })

    render(
      <StripeCheckoutButton lookupKey="pro_monthly">
        Subscribe to Pro
      </StripeCheckoutButton>,
    )

    const button = screen.getByRole("button")
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lookup_key: "pro_monthly" }),
      })
    })
  })

  it("should show loading state during API call", async () => {
    // Create a promise that we can resolve manually
    let resolvePromise: (value: any) => void
    const promise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    mockFetch.mockReturnValueOnce(promise)

    render(
      <StripeCheckoutButton lookupKey="pro_monthly">
        Subscribe to Pro
      </StripeCheckoutButton>,
    )

    const button = screen.getByRole("button")
    fireEvent.click(button)

    // Button should show loading state
    await waitFor(() => {
      expect(button).toHaveTextContent("Loading...")
      expect(button).toBeDisabled()
    })

    // Resolve the promise to finish the API call
    resolvePromise!({
      redirected: true,
      url: "https://checkout.stripe.com/session/cs_123",
    })

    // Button should return to normal state
    await waitFor(() => {
      expect(button).toHaveTextContent("Subscribe to Pro")
      expect(button).not.toBeDisabled()
    })
  })

  it("should redirect to checkout URL on successful response", async () => {
    mockFetch.mockResolvedValueOnce({
      redirected: true,
      url: "https://checkout.stripe.com/session/cs_123",
    })

    render(
      <StripeCheckoutButton lookupKey="pro_monthly">
        Subscribe to Pro
      </StripeCheckoutButton>,
    )

    const button = screen.getByRole("button")
    fireEvent.click(button)

    await waitFor(() => {
      expect(window.location.href).toBe(
        "https://checkout.stripe.com/session/cs_123",
      )
    })
  })

  it("should handle non-redirected response gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    mockFetch.mockResolvedValueOnce({
      redirected: false,
      status: 400,
    })

    render(
      <StripeCheckoutButton lookupKey="pro_monthly">
        Subscribe to Pro
      </StripeCheckoutButton>,
    )

    const button = screen.getByRole("button")
    fireEvent.click(button)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Checkout failed")
    })

    consoleSpy.mockRestore()
  })

  it("should handle API errors gracefully", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const error = new Error("Network error")

    mockFetch.mockRejectedValueOnce(error)

    render(
      <StripeCheckoutButton lookupKey="pro_monthly">
        Subscribe to Pro
      </StripeCheckoutButton>,
    )

    const button = screen.getByRole("button")
    fireEvent.click(button)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Error:", error)
    })

    // Button should return to normal state after error
    await waitFor(() => {
      expect(button).toHaveTextContent("Subscribe to Pro")
      expect(button).not.toBeDisabled()
    })

    consoleSpy.mockRestore()
  })

  it("should handle different lookup keys", async () => {
    mockFetch.mockResolvedValueOnce({
      redirected: true,
      url: "https://checkout.stripe.com/session/cs_456",
    })

    render(
      <StripeCheckoutButton lookupKey="pro_yearly">
        Subscribe Yearly
      </StripeCheckoutButton>,
    )

    const button = screen.getByRole("button")
    fireEvent.click(button)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lookup_key: "pro_yearly" }),
      })
    })
  })

  it("should have correct CSS classes applied", () => {
    render(
      <StripeCheckoutButton lookupKey="pro_monthly">
        Subscribe to Pro
      </StripeCheckoutButton>,
    )

    const button = screen.getByRole("button")
    expect(button).toHaveClass("w-full")
  })

  it("should be accessible", () => {
    render(
      <StripeCheckoutButton lookupKey="pro_monthly">
        Subscribe to Pro
      </StripeCheckoutButton>,
    )

    const button = screen.getByRole("button")
    expect(button).toBeInTheDocument()
    expect(button).toHaveAccessibleName("Subscribe to Pro")
  })
})
