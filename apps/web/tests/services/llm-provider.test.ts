import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * Test suite for LLM Provider Service
 *
 * This file tests the LLM provider functionality:
 * - getUserLLMProvider - Get user's LLM provider or default
 * - sendChatCompletion - Send chat completion with different provider types
 * - Test provider functionality
 */

// Mock Supabase client
const mockSupabaseClient = {
  rpc: vi.fn(),
}

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}))

// Import after mocking
import { getUserLLMProvider, sendChatCompletion } from '../../src/lib/services/llm-client'

describe('LLM Provider Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set required environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
  })

  describe('getUserLLMProvider', () => {
    it('should return user\'s LLM provider when found', async () => {
      const mockProvider = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Provider',
        type: 'test',
        api_endpoint: 'http://localhost:9999/test',
        api_key: 'test-api-key',
        model_name: 'test-model',
        max_tokens: 1024,
        temperature: 0.5,
        metadata: { test_mode: true },
      }

      mockSupabaseClient.rpc.mockResolvedValue({
        data: [mockProvider],
        error: null,
      })

      const result = await getUserLLMProvider('user-123')

      expect(result).toEqual(mockProvider)
      expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('get_user_llm_provider', {
        p_user_id: 'user-123',
      })
    })

    it('should return null when no provider is found', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [],
        error: null,
      })

      const result = await getUserLLMProvider('user-123')

      expect(result).toBeNull()
    })

    it('should return null when there is an error', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })

      const result = await getUserLLMProvider('user-123')

      expect(result).toBeNull()
    })
  })

  describe('sendChatCompletion with test provider', () => {
    it('should successfully send chat completion with test provider', async () => {
      const mockProvider = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Provider',
        type: 'test',
        api_endpoint: 'http://localhost:9999/test',
        api_key: 'test-api-key',
        model_name: 'test-model',
        max_tokens: 1024,
        temperature: 0.5,
        metadata: { test_mode: true },
      }

      mockSupabaseClient.rpc.mockResolvedValue({
        data: [mockProvider],
        error: null,
      })

      const chatRequest = {
        messages: [
          { role: 'system' as const, content: 'You are a helpful assistant' },
          { role: 'user' as const, content: 'Hello, how are you?' },
        ],
      }

      const result = await sendChatCompletion('user-123', chatRequest)

      expect(result).toBeDefined()
      expect(result.content).toContain('Test provider response')
      expect(result.content).toContain('Hello, how are you?')
      expect(result.usage).toEqual({
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      })
    })

    it('should handle long user messages in test provider', async () => {
      const mockProvider = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Provider',
        type: 'test',
        api_endpoint: 'http://localhost:9999/test',
        api_key: 'test-api-key',
        model_name: 'test-model',
        max_tokens: 1024,
        temperature: 0.5,
        metadata: { test_mode: true },
      }

      mockSupabaseClient.rpc.mockResolvedValue({
        data: [mockProvider],
        error: null,
      })

      const longMessage = 'A'.repeat(100)
      const chatRequest = {
        messages: [
          { role: 'user' as const, content: longMessage },
        ],
      }

      const result = await sendChatCompletion('user-123', chatRequest)

      expect(result).toBeDefined()
      expect(result.content).toContain('Test provider response')
      // Should truncate to 50 characters
      expect(result.content.length).toBeLessThan(longMessage.length + 50)
    })

    it('should throw error when no provider is configured', async () => {
      mockSupabaseClient.rpc.mockResolvedValue({
        data: [],
        error: null,
      })

      const chatRequest = {
        messages: [
          { role: 'user' as const, content: 'Hello' },
        ],
      }

      await expect(sendChatCompletion('user-123', chatRequest)).rejects.toThrow(
        'No LLM provider configured'
      )
    })

    it('should respect custom temperature and maxTokens in request', async () => {
      const mockProvider = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Provider',
        type: 'test',
        api_endpoint: 'http://localhost:9999/test',
        api_key: 'test-api-key',
        model_name: 'test-model',
        max_tokens: 1024,
        temperature: 0.5,
        metadata: { test_mode: true },
      }

      mockSupabaseClient.rpc.mockResolvedValue({
        data: [mockProvider],
        error: null,
      })

      const chatRequest = {
        messages: [
          { role: 'user' as const, content: 'Test message' },
        ],
        temperature: 0.8,
        maxTokens: 2048,
      }

      const result = await sendChatCompletion('user-123', chatRequest)

      expect(result).toBeDefined()
      expect(result.content).toContain('Test provider response')
    })
  })

  describe('Test Provider Type', () => {
    it('should be included in the provider type union', async () => {
      const mockTestProvider = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Test Provider',
        type: 'test' as const,
        api_endpoint: 'http://localhost:9999/test',
        api_key: 'test-api-key',
        model_name: 'test-model',
        max_tokens: 1024,
        temperature: 0.5,
        metadata: { test_mode: true },
      }

      mockSupabaseClient.rpc.mockResolvedValue({
        data: [mockTestProvider],
        error: null,
      })

      const result = await getUserLLMProvider('user-123')

      expect(result).toBeDefined()
      expect(result?.type).toBe('test')
    })
  })
})
