import { useEffect, useRef, useState } from 'react'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { auth } from '../lib/firebase'
import {
  appendMessages,
  createConversation,
  loadConversation,
  upsertLead,
} from '../lib/firestore'
import { streamChatMessage } from '../lib/api'
import { useChatStore } from '../stores/chatStore'
import ChatMessage from './ChatMessage'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Textarea } from './ui/textarea'
import type { ChatMessage as ChatMessageType } from '../types/chat'

type LeadFormState = {
  visible: boolean
  name: string
  phone: string
  email: string
}

export default function ChatWindow() {
  const {
    sessionId,
    messages,
    isStreaming,
    leadCaptured,
    setSession,
    addMessage,
    updateLastMessage,
    setStreaming,
    setLeadCaptured,
  } = useChatStore()

  const [input, setInput] = useState('')
  const [idToken, setIdToken] = useState<string | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [leadForm, setLeadForm] = useState<LeadFormState>({
    visible: false,
    name: '',
    phone: '',
    email: '',
  })

  const bottomRef = useRef<HTMLDivElement>(null)

  // US-001 A: Anonymous Firebase Auth on mount
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const token = await user.getIdToken()
        setIdToken(token)
        setAuthReady(true)
      } else {
        await signInAnonymously(auth)
      }
    })
    return unsub
  }, [])

  // US-001 B / US-006 X: Create or resume session once auth is ready
  useEffect(() => {
    if (!authReady) return

    async function initSession() {
      // Try to resume persisted session (US-006)
      if (sessionId) {
        const existing = await loadConversation(sessionId)
        if (existing) {
          setSession(existing)
          return
        }
      }

      // Create new session
      const uid = auth.currentUser?.uid
      if (!uid) return
      await createConversation(uid)
      setSession({
        sessionId: uid,
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [],
      })
    }

    initSession()
  }, [authReady])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    const text = input.trim()
    if (!text || isStreaming || !sessionId || !idToken) return

    setInput('')

    const userMsg: ChatMessageType = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    }
    addMessage(userMsg)

    // Placeholder assistant message for streaming
    const assistantMsg: ChatMessageType = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    }
    addMessage(assistantMsg)
    setStreaming(true)

    let fullContent = ''
    try {
      for await (const chunk of streamChatMessage(sessionId, text, idToken)) {
        if (chunk.type === 'delta' && chunk.content) {
          fullContent += chunk.content
          updateLastMessage(fullContent)
        } else if (chunk.type === 'done' || chunk.type === 'error') {
          break
        }
      }
    } finally {
      setStreaming(false)
      // Persist both turns to Firestore
      await appendMessages(sessionId, [
        userMsg,
        { ...assistantMsg, content: fullContent },
      ])
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  async function handleLeadSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!sessionId || !leadForm.name || !leadForm.phone) return

    const transcriptSummary = messages
      .map((m) => `${m.role}: ${m.content}`)
      .slice(-10)
      .join('\n')

    await upsertLead({
      sessionId,
      name: leadForm.name,
      phone: leadForm.phone,
      email: leadForm.email || undefined,
      interestedUnits: [],
      leadScore: 0,
      transcriptSummary,
    })

    // US-005 U: Confirmation message
    const confirmMsg: ChatMessageType = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `Thank you ${leadForm.name}, a leasing specialist will contact you within 1 business day.`,
      timestamp: Date.now(),
    }
    addMessage(confirmMsg)
    setLeadCaptured(true)
    setLeadForm({ visible: false, name: '', phone: '', email: '' })

    await appendMessages(sessionId, [confirmMsg])
  }

  if (!authReady) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Starting session...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm mt-8">
            <p className="font-medium text-base mb-1">
              Hi! How can I help you today?
            </p>
            <p>
              Ask me about available spaces, leasing terms, or unit
              recommendations.
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isStreaming && messages[messages.length - 1]?.content === '' && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Lead capture form (US-005) */}
      {leadForm.visible && (
        <div className="border-t px-4 py-3 bg-muted/30">
          <p className="text-sm font-medium mb-2">
            Share your contact details and we'll have a leasing specialist reach
            out to you.
          </p>
          <form onSubmit={handleLeadSubmit} className="space-y-2">
            <Input
              placeholder="Full name *"
              value={leadForm.name}
              onChange={(e) =>
                setLeadForm((s) => ({ ...s, name: e.target.value }))
              }
              required
            />
            <Input
              placeholder="Phone number *"
              value={leadForm.phone}
              onChange={(e) =>
                setLeadForm((s) => ({ ...s, phone: e.target.value }))
              }
              required
            />
            <Input
              placeholder="Email (optional)"
              type="email"
              value={leadForm.email}
              onChange={(e) =>
                setLeadForm((s) => ({ ...s, email: e.target.value }))
              }
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm">
                Submit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setLeadForm((s) => ({ ...s, visible: false }))}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Input area */}
      <div className="border-t px-4 py-3 flex gap-2 items-end">
        <Textarea
          className="resize-none min-h-[40px] max-h-[120px]"
          placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isStreaming}
          rows={1}
        />
        <div className="flex flex-col gap-1">
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming}
            size="sm"
          >
            Send
          </Button>
          {!leadCaptured && messages.length >= 2 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setLeadForm((s) => ({ ...s, visible: !s.visible }))
              }
            >
              Contact me
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
