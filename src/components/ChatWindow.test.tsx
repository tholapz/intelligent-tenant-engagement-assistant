import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { useChatStore } from '../stores/chatStore'
import ChatWindow from './ChatWindow'

// jsdom doesn't implement scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn()

// Mock Firebase — no real credentials needed in tests
vi.mock('../lib/firebase', () => ({
  auth: { currentUser: { uid: 'test-uid' } },
  db: {},
  default: {},
}))

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((_auth, cb) => {
    // Immediately call callback with a fake user → sets authReady=true
    cb({ uid: 'test-uid', getIdToken: () => Promise.resolve('fake-token') })
    return () => {}
  }),
  signInAnonymously: vi.fn(),
}))

vi.mock('../lib/firestore', () => ({
  createConversation: vi.fn().mockResolvedValue(undefined),
  loadConversation: vi.fn().mockResolvedValue(null),
  appendMessages: vi.fn().mockResolvedValue(undefined),
  upsertLead: vi.fn().mockResolvedValue('lead-id-123'),
}))

vi.mock('../lib/api', () => ({
  streamChatMessage: vi.fn(),
}))

const msg = (
  role: 'user' | 'assistant',
  content: string,
  id = crypto.randomUUID(),
) => ({
  id,
  role,
  content,
  timestamp: Date.now(),
})

beforeEach(() => {
  useChatStore.getState().clearSession()
  vi.clearAllMocks()
})

// Helper: render ChatWindow, wait for auth+session effects to settle, then inject messages
async function renderWithMessages(messages: Array<ReturnType<typeof msg>>) {
  await act(async () => {
    render(<ChatWindow />)
  })
  // initSession effect runs after authReady; inject messages after it settles
  await act(async () => {
    useChatStore.getState().setSession({
      sessionId: useChatStore.getState().sessionId ?? 'test-uid',
      status: 'active',
      createdAt: 0,
      updatedAt: 0,
      messages,
    })
  })
}

describe('ChatWindow — US-001', () => {
  test('AC-D: renders textarea without requiring personal info', async () => {
    await act(async () => {
      render(<ChatWindow />)
    })
    expect(screen.getByPlaceholderText(/type a message/i)).toBeDefined()
    // No email / phone / name inputs on initial render
    expect(screen.queryByPlaceholderText(/full name/i)).toBeNull()
    expect(screen.queryByPlaceholderText(/phone/i)).toBeNull()
  })

  test('AC-D: Send button present and input accepts text without login', async () => {
    await act(async () => {
      render(<ChatWindow />)
    })
    expect(screen.getByRole('button', { name: /send/i })).toBeDefined()
  })

  test('Send button disabled when input is empty', async () => {
    await act(async () => {
      render(<ChatWindow />)
    })
    const btn = screen.getByRole('button', { name: /send/i }) as HTMLButtonElement
    expect(btn.disabled).toBe(true)
  })

  test('Send button enabled when input has text', async () => {
    await act(async () => {
      render(<ChatWindow />)
    })
    const textarea = screen.getByPlaceholderText(/type a message/i)
    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'Hello' } })
    })
    const btn = screen.getByRole('button', { name: /send/i }) as HTMLButtonElement
    expect(btn.disabled).toBe(false)
  })

  test('shows empty-state welcome prompt when no messages', async () => {
    await act(async () => {
      render(<ChatWindow />)
    })
    expect(screen.getByText(/hi! how can i help you today/i)).toBeDefined()
  })
})

describe('ChatWindow — US-005 lead capture', () => {
  test('"Contact me" button NOT shown with fewer than 2 messages', async () => {
    await renderWithMessages([msg('user', 'hi')])
    expect(screen.queryByRole('button', { name: /contact me/i })).toBeNull()
  })

  test('"Contact me" button shown when messages >= 2 and lead not captured', async () => {
    await renderWithMessages([msg('user', 'hi'), msg('assistant', 'hello')])
    expect(screen.getByRole('button', { name: /contact me/i })).toBeDefined()
  })

  test('"Contact me" button hidden after leadCaptured=true', async () => {
    await renderWithMessages([msg('user', 'hi'), msg('assistant', 'hello')])
    await act(async () => {
      useChatStore.getState().setLeadCaptured(true)
    })
    expect(screen.queryByRole('button', { name: /contact me/i })).toBeNull()
  })

  test('Lead form opens on "Contact me" click', async () => {
    await renderWithMessages([msg('user', 'hi'), msg('assistant', 'hello')])
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /contact me/i }))
    })
    expect(screen.getByPlaceholderText(/full name/i)).toBeDefined()
    expect(screen.getByPlaceholderText(/phone number/i)).toBeDefined()
    expect(screen.getByPlaceholderText(/email/i)).toBeDefined()
  })

  test('Lead form: name and phone are required, email is optional', async () => {
    await renderWithMessages([msg('user', 'hi'), msg('assistant', 'hello')])
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /contact me/i }))
    })
    expect((screen.getByPlaceholderText(/full name/i) as HTMLInputElement).required).toBe(true)
    expect((screen.getByPlaceholderText(/phone number/i) as HTMLInputElement).required).toBe(true)
    expect((screen.getByPlaceholderText(/email/i) as HTMLInputElement).required).toBe(false)
  })

  test('Cancel button closes lead form', async () => {
    await renderWithMessages([msg('user', 'hi'), msg('assistant', 'hello')])
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /contact me/i }))
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    })
    expect(screen.queryByPlaceholderText(/full name/i)).toBeNull()
  })

  // AC US-005-U: confirmation message text
  test('AC-U: confirmation message shown after lead form submit', async () => {
    await renderWithMessages([msg('user', 'hi'), msg('assistant', 'hello')])
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /contact me/i }))
    })
    await act(async () => {
      fireEvent.change(screen.getByPlaceholderText(/full name/i), {
        target: { value: 'Somchai Jaidee' },
      })
      fireEvent.change(screen.getByPlaceholderText(/phone number/i), {
        target: { value: '0812345678' },
      })
    })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    })
    expect(
      screen.getByText(
        /thank you somchai jaidee, a leasing specialist will contact you within 1 business day/i,
      ),
    ).toBeDefined()
  })
})

describe('ChatWindow — streaming indicator', () => {
  test('3-dot bounce shown when isStreaming=true and last message is empty', async () => {
    await renderWithMessages([
      msg('user', 'hi'),
      msg('assistant', '', '00000000-0000-0000-0000-000000000001'),
    ])
    await act(async () => {
      useChatStore.getState().setStreaming(true)
    })
    // The bounce dots use animate-bounce class
    const dots = document.querySelectorAll('.animate-bounce')
    expect(dots.length).toBe(3)
  })

  test('Send button disabled during streaming', async () => {
    await act(async () => {
      render(<ChatWindow />)
    })
    await act(async () => {
      useChatStore.getState().setStreaming(true)
    })
    const textarea = screen.getByPlaceholderText(/type a message/i) as HTMLTextAreaElement
    expect(textarea.disabled).toBe(true)
  })
})
