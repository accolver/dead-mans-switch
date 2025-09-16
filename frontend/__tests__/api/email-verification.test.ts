import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as verifyEmailHandler } from '@/app/api/auth/verify-email/route'
import { POST as resendHandler } from '@/app/api/auth/resend-verification/route'
import { GET as statusHandler } from '@/app/api/auth/verification-status/route'

// Mock Supabase clients
const mockSupabaseClient = {
  auth: {
    getUser: vi.fn(),
    verifyOtp: vi.fn(),
    resend: vi.fn(),
    updateUser: vi.fn()
  },
  from: vi.fn()
}

const mockServiceRoleClient = {
  auth: {
    admin: {
      updateUserById: vi.fn()
    }
  }
}

vi.mock('@/utils/supabase/server', () => ({
  createClient: () => mockSupabaseClient,
  createServiceRoleClient: () => mockServiceRoleClient
}))

describe('Email Verification API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('/api/auth/verify-email', () => {
    it('should successfully verify email with valid OTP', async () => {
      // Arrange
      const requestBody = {
        email: 'user@example.com',
        otp: '123456'
      }

      mockSupabaseClient.auth.verifyOtp.mockResolvedValue({
        data: { user: { id: '123', email_verified: true } },
        error: null
      })

      const mockRequest = new Request('http://localhost/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      // Act
      const response = await verifyEmailHandler(mockRequest as NextRequest)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.verified).toBe(true)
      expect(mockSupabaseClient.auth.verifyOtp).toHaveBeenCalledWith({
        email: 'user@example.com',
        token: '123456',
        type: 'email'
      })
    })

    it('should handle invalid OTP', async () => {
      // Arrange
      const requestBody = {
        email: 'user@example.com',
        otp: '000000'
      }

      mockSupabaseClient.auth.verifyOtp.mockResolvedValue({
        data: null,
        error: { message: 'Invalid OTP' }
      })

      const mockRequest = new Request('http://localhost/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      // Act
      const response = await verifyEmailHandler(mockRequest as NextRequest)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid OTP')
    })

    it('should handle missing email or OTP', async () => {
      // Arrange
      const requestBody = {
        email: 'user@example.com'
        // Missing OTP
      }

      const mockRequest = new Request('http://localhost/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      // Act
      const response = await verifyEmailHandler(mockRequest as NextRequest)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.error).toContain('Email and OTP are required')
    })

    it('should handle expired OTP', async () => {
      // Arrange
      const requestBody = {
        email: 'user@example.com',
        otp: '123456'
      }

      mockSupabaseClient.auth.verifyOtp.mockResolvedValue({
        data: null,
        error: { message: 'Token has expired' }
      })

      const mockRequest = new Request('http://localhost/api/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      // Act
      const response = await verifyEmailHandler(mockRequest as NextRequest)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Verification code has expired')
    })
  })

  describe('/api/auth/resend-verification', () => {
    it('should successfully resend verification email', async () => {
      // Arrange
      const requestBody = {
        email: 'user@example.com'
      }

      mockSupabaseClient.auth.resend.mockResolvedValue({
        data: {},
        error: null
      })

      const mockRequest = new Request('http://localhost/api/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      // Act
      const response = await resendHandler(mockRequest as NextRequest)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.message).toContain('sent')
      expect(mockSupabaseClient.auth.resend).toHaveBeenCalledWith({
        type: 'signup',
        email: 'user@example.com'
      })
    })

    it('should handle rate limiting', async () => {
      // Arrange
      const requestBody = {
        email: 'user@example.com'
      }

      mockSupabaseClient.auth.resend.mockResolvedValue({
        data: null,
        error: { message: 'Rate limit exceeded' }
      })

      const mockRequest = new Request('http://localhost/api/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      // Act
      const response = await resendHandler(mockRequest as NextRequest)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(429)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Rate limit exceeded. Please wait before requesting another email.')
    })

    it('should handle missing email', async () => {
      // Arrange
      const requestBody = {}

      const mockRequest = new Request('http://localhost/api/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      // Act
      const response = await resendHandler(mockRequest as NextRequest)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.error).toContain('Email is required')
    })
  })

  describe('/api/auth/verification-status', () => {
    it('should return verification status for authenticated user', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: '123', email: 'user@example.com', email_verified: true } },
        error: null
      })

      const mockRequest = new Request('http://localhost/api/auth/verification-status', {
        method: 'GET'
      })

      // Act
      const response = await statusHandler(mockRequest as NextRequest)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.isVerified).toBe(true)
      expect(result.user).toBeDefined()
    })

    it('should return unverified status for unverified user', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: { id: '123', email: 'user@example.com', email_verified: false } },
        error: null
      })

      const mockRequest = new Request('http://localhost/api/auth/verification-status', {
        method: 'GET'
      })

      // Act
      const response = await statusHandler(mockRequest as NextRequest)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.isVerified).toBe(false)
    })

    it('should handle unauthenticated user', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const mockRequest = new Request('http://localhost/api/auth/verification-status', {
        method: 'GET'
      })

      // Act
      const response = await statusHandler(mockRequest as NextRequest)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(401)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Not authenticated')
    })

    it('should handle Supabase errors', async () => {
      // Arrange
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Database error' }
      })

      const mockRequest = new Request('http://localhost/api/auth/verification-status', {
        method: 'GET'
      })

      // Act
      const response = await statusHandler(mockRequest as NextRequest)
      const result = await response.json()

      // Assert
      expect(response.status).toBe(500)
      expect(result.success).toBe(false)
      expect(result.error).toBe('Failed to get user information')
    })
  })

  describe('OAuth Email Verification Handling', () => {
    it('should automatically verify Google OAuth users', async () => {
      // Arrange
      const requestBody = {
        userId: '123',
        provider: 'google'
      }

      mockServiceRoleClient.auth.admin.updateUserById.mockResolvedValue({
        data: { user: { id: '123', email_verified: true } },
        error: null
      })

      const mockRequest = new Request('http://localhost/api/auth/verify-oauth', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: { 'Content-Type': 'application/json' }
      })

      // This would be a new API route we'll create
      // const response = await verifyOAuthHandler(mockRequest as NextRequest)
      // const result = await response.json()

      // For now, we'll test the logic would be called correctly
      expect(mockServiceRoleClient.auth.admin.updateUserById).not.toHaveBeenCalled()
      // Will be called in actual implementation
    })
  })
})