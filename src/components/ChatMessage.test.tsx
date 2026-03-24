import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import ChatMessage from './ChatMessage'
import type { ChatMessage as ChatMessageType } from '../types/chat'

const baseMsg = (overrides: Partial<ChatMessageType> = {}): ChatMessageType => ({
  id: '1',
  role: 'user',
  content: 'Hello',
  timestamp: new Date('2025-01-01T10:30:00').getTime(),
  ...overrides,
})

describe('ChatMessage', () => {
  // US-001-D / bubble layout
  test('user message is right-aligned', () => {
    const { container } = render(<ChatMessage message={baseMsg({ role: 'user', content: 'Hi there' })} />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('justify-end')
  })

  test('assistant message is left-aligned', () => {
    const { container } = render(<ChatMessage message={baseMsg({ role: 'assistant', content: 'Hello!' })} />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.className).toContain('justify-start')
  })

  test('user message bubble has primary background', () => {
    const { container } = render(<ChatMessage message={baseMsg({ role: 'user' })} />)
    // wrapper > bubble: use firstElementChild of the outer wrapper
    const bubble = (container.firstElementChild as HTMLElement)?.firstElementChild as HTMLElement
    expect(bubble.className).toContain('bg-primary')
  })

  test('assistant message bubble has muted background', () => {
    const { container } = render(<ChatMessage message={baseMsg({ role: 'assistant' })} />)
    const bubble = (container.firstElementChild as HTMLElement)?.firstElementChild as HTMLElement
    expect(bubble.className).toContain('bg-muted')
  })

  test('user message renders plain text (not markdown)', () => {
    render(<ChatMessage message={baseMsg({ role: 'user', content: '**bold** text' })} />)
    // Should appear as literal text, not rendered bold
    expect(screen.getByText('**bold** text')).toBeDefined()
  })

  // Markdown rendering (ChatMessage uses ReactMarkdown for assistant)
  test('assistant message renders bold markdown', () => {
    render(<ChatMessage message={baseMsg({ role: 'assistant', content: '**Available Units**' })} />)
    const bold = screen.getByText('Available Units')
    expect(bold.tagName).toBe('STRONG')
  })

  test('assistant message renders bullet list', () => {
    render(<ChatMessage message={baseMsg({ role: 'assistant', content: '- Item one\n- Item two' })} />)
    expect(screen.getByText('Item one')).toBeDefined()
    expect(screen.getByText('Item two')).toBeDefined()
    const list = document.querySelector('ul')
    expect(list).not.toBeNull()
  })

  // Timestamp display
  test('displays formatted timestamp', () => {
    const ts = new Date('2025-01-01T14:05:00').getTime()
    render(<ChatMessage message={baseMsg({ timestamp: ts })} />)
    // Locale time format varies; check a time-like string exists
    const timeEl = document.querySelector('p.text-\\[10px\\]')
    expect(timeEl?.textContent).toMatch(/\d{1,2}:\d{2}/)
  })
})
