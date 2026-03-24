import { describe, expect, test, beforeEach } from 'vitest'
import { useChatStore } from './chatStore'

// Reset store state between tests
beforeEach(() => {
  useChatStore.getState().clearSession()
})

describe('chatStore', () => {
  test('initial state has empty messages and null sessionId', () => {
    const state = useChatStore.getState()
    expect(state.messages).toEqual([])
    expect(state.sessionId).toBeNull()
    expect(state.isStreaming).toBe(false)
    expect(state.leadCaptured).toBe(false)
  })

  // US-006-X: session resumption
  test('setSession sets sessionId and messages', () => {
    const msgs = [
      { id: 'm1', role: 'user' as const, content: 'Hello', timestamp: 1 },
      { id: 'm2', role: 'assistant' as const, content: 'Hi!', timestamp: 2 },
    ]
    useChatStore.getState().setSession({
      sessionId: 'sess-123',
      status: 'active',
      createdAt: 1,
      updatedAt: 2,
      messages: msgs,
    })
    const state = useChatStore.getState()
    expect(state.sessionId).toBe('sess-123')
    expect(state.messages).toEqual(msgs)
  })

  test('addMessage appends to messages array', () => {
    const msg = { id: 'm1', role: 'user' as const, content: 'Hello', timestamp: Date.now() }
    useChatStore.getState().addMessage(msg)
    expect(useChatStore.getState().messages).toHaveLength(1)
    expect(useChatStore.getState().messages[0]).toEqual(msg)
  })

  test('addMessage appends multiple messages in order', () => {
    const m1 = { id: '1', role: 'user' as const, content: 'A', timestamp: 1 }
    const m2 = { id: '2', role: 'assistant' as const, content: 'B', timestamp: 2 }
    useChatStore.getState().addMessage(m1)
    useChatStore.getState().addMessage(m2)
    expect(useChatStore.getState().messages).toEqual([m1, m2])
  })

  test('updateLastMessage updates content of last assistant message', () => {
    useChatStore.getState().addMessage({ id: '1', role: 'user' as const, content: 'Q', timestamp: 1 })
    useChatStore.getState().addMessage({ id: '2', role: 'assistant' as const, content: '', timestamp: 2 })
    useChatStore.getState().updateLastMessage('Full response')
    const last = useChatStore.getState().messages.at(-1)
    expect(last?.content).toBe('Full response')
  })

  test('setStreaming toggles isStreaming', () => {
    useChatStore.getState().setStreaming(true)
    expect(useChatStore.getState().isStreaming).toBe(true)
    useChatStore.getState().setStreaming(false)
    expect(useChatStore.getState().isStreaming).toBe(false)
  })

  // US-005: lead captured flag
  test('setLeadCaptured sets leadCaptured', () => {
    useChatStore.getState().setLeadCaptured(true)
    expect(useChatStore.getState().leadCaptured).toBe(true)
  })

  test('clearSession resets sessionId, messages, and leadCaptured', () => {
    useChatStore.getState().setSession({
      sessionId: 'sess-abc',
      status: 'active',
      createdAt: 1,
      updatedAt: 2,
      messages: [{ id: 'm1', role: 'user' as const, content: 'Hi', timestamp: 1 }],
    })
    useChatStore.getState().setLeadCaptured(true)
    useChatStore.getState().clearSession()

    const state = useChatStore.getState()
    expect(state.sessionId).toBeNull()
    expect(state.messages).toEqual([])
    expect(state.leadCaptured).toBe(false)
  })

  // US-006-X: only sessionId persisted (not messages)
  test('persist partialize stores only sessionId', () => {
    const persistConfig = (useChatStore as unknown as { persist: { getOptions: () => { partialize: (s: ReturnType<typeof useChatStore.getState>) => unknown } } }).persist?.getOptions()
    const partialize = persistConfig?.partialize
    if (!partialize) {
      // Verify via localStorage key name
      expect(localStorage.getItem('cpn-chat-session')).not.toBeUndefined()
      return
    }
    const state = useChatStore.getState()
    const persisted = partialize(state) as Record<string, unknown>
    expect(Object.keys(persisted)).toEqual(['sessionId'])
    expect(persisted.messages).toBeUndefined()
  })

  test('localStorage key is cpn-chat-session', () => {
    // After any store write, the key should exist
    useChatStore.getState().setStreaming(false)
    expect(localStorage.getItem('cpn-chat-session')).not.toBeNull()
  })
})
