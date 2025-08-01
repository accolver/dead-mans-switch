import { useContactMethods } from "@/hooks/useContactMethods"
import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock Supabase client using vi.hoisted to ensure proper initialization order
const { mockAuth, mockFrom, mockSupabaseClient } = vi.hoisted(() => {
  const mockAuth = {
    getUser: vi.fn(),
  }

  const mockFrom = vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
  }))

  const mockSupabaseClient = {
    auth: mockAuth,
    from: mockFrom,
  }

  return { mockAuth, mockFrom, mockSupabaseClient }
})

vi.mock("@/utils/supabase/client", () => ({
  createClient: () => mockSupabaseClient,
}))

describe("useContactMethods", () => {
  const mockUser = {
    id: "user-123",
    email: "test@example.com",
  }

  const mockContactMethodsData = [
    {
      user_id: "user-123",
      email: "test@example.com",
      phone: "+1234567890",
      preferred_method: "email" as const,
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      id: "contact-123",
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("should load contact methods for authenticated user", async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    const mockSelect = vi.fn().mockReturnThis()
    const mockEq = vi.fn().mockResolvedValue({
      data: mockContactMethodsData,
      error: null,
    })

    mockFrom.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      upsert: vi.fn(),
    })

    const { result } = renderHook(() => useContactMethods())

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockAuth.getUser).toHaveBeenCalled()
    expect(mockFrom).toHaveBeenCalledWith("user_contact_methods")
    expect(mockSelect).toHaveBeenCalledWith("*")
    expect(mockEq).toHaveBeenCalledWith("user_id", "user-123")

    expect(result.current.contactMethods).toEqual(mockContactMethodsData)
    expect(result.current.error).toBeNull()
  })

  it("should handle user not found", async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    })

    const { result } = renderHook(() => useContactMethods())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.contactMethods).toEqual([])
    expect(result.current.error).toBe("User not authenticated")
  })

  it("should handle no existing contact methods", async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    const mockSelect = vi.fn().mockReturnThis()
    const mockEq = vi.fn().mockResolvedValue({
      data: null,
      error: null,
    })

    mockFrom.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      upsert: vi.fn(),
    })

    const { result } = renderHook(() => useContactMethods())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.contactMethods).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it("should handle database errors", async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    const mockSelect = vi.fn().mockReturnThis()
    const mockEq = vi.fn().mockResolvedValue({
      data: null,
      error: new Error("Database error"),
    })

    mockFrom.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      upsert: vi.fn().mockReturnThis(),
    })

    const { result } = renderHook(() => useContactMethods())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe("Database error")
  })

  it("should save contact methods successfully", async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    // Mock initial load (no existing methods)
    const mockSelect = vi.fn().mockReturnThis()
    const mockEq = vi
      .fn()
      .mockResolvedValueOnce({
        data: [],
        error: null,
      })
      .mockResolvedValueOnce({
        data: mockContactMethodsData,
        error: null,
      })

    const mockUpsert = vi.fn().mockReturnThis()
    // Mock the upsert chain: .upsert().eq()
    mockUpsert.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    })

    mockFrom.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      upsert: mockUpsert,
    })

    const { result } = renderHook(() => useContactMethods())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Test saving
    await result.current.saveContactMethods({
      email: "test@example.com",
      phone: "+1234567890",
      preferred_method: "email",
    })

    expect(mockUpsert).toHaveBeenCalledWith({
      user_id: "user-123",
      email: "test@example.com",
      phone: "+1234567890",
      preferred_method: "email",
    })
  })

  it("should handle save errors", async () => {
    mockAuth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })

    // Mock initial load
    const mockSelect = vi.fn().mockReturnThis()
    const mockEq = vi.fn().mockResolvedValue({
      data: [],
      error: null,
    })

    const mockUpsert = vi.fn().mockReturnThis()
    // Mock the upsert chain with error: .upsert().eq()
    mockUpsert.mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: new Error("Save failed") }),
    })

    mockFrom.mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      upsert: mockUpsert,
    })

    const { result } = renderHook(() => useContactMethods())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Test saving with error
    await expect(
      result.current.saveContactMethods({
        email: "test@example.com",
        phone: "+1234567890",
        preferred_method: "email",
      }),
    ).rejects.toThrow("Save failed")
  })
})
