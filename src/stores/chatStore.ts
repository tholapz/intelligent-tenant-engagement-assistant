import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChatMessage, Conversation } from '../types/chat'

interface ChatState {
  sessionId: string | null
  messages: Array<ChatMessage>
  isStreaming: boolean
  leadCaptured: boolean
  // Persisted so returning users resume session (US-006)
  setSession: (session: Conversation) => void
  addMessage: (message: ChatMessage) => void
  updateLastMessage: (content: string) => void
  setStreaming: (streaming: boolean) => void
  setLeadCaptured: (captured: boolean) => void
  clearSession: () => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      sessionId: null,
      messages: [],
      isStreaming: false,
      leadCaptured: false,

      setSession: (session) =>
        set({
          sessionId: session.sessionId,
          messages: session.messages,
        }),

      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),

      updateLastMessage: (content) =>
        set((state) => {
          const messages = [...state.messages]
          const last = messages[messages.length - 1]
          if (last && last.role === 'assistant') {
            messages[messages.length - 1] = { ...last, content }
          }
          return { messages }
        }),

      setStreaming: (streaming) => set({ isStreaming: streaming }),

      setLeadCaptured: (captured) => set({ leadCaptured: captured }),

      clearSession: () =>
        set({ sessionId: null, messages: [], leadCaptured: false }),
    }),
    {
      name: 'cpn-chat-session',
      // Only persist sessionId to restore session on reload (US-006 X)
      partialize: (state) => ({ sessionId: state.sessionId }),
    },
  ),
)
