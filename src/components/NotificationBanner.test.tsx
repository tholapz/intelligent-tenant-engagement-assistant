import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NotificationBanner } from './NotificationBanner'
import type { FCMNotification } from '@/hooks/useFCM'

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

const notification: FCMNotification = {
  title: 'High Priority Lead',
  body: 'Somchai Jaidee · Food & Beverage · Central World · Score 88',
  leadId: 'lead-001',
}

describe('NotificationBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // US-011 AC-U: notification body includes prospect info
  it('renders notification title and body', () => {
    render(
      <NotificationBanner notification={notification} onDismiss={vi.fn()} />,
    )
    expect(screen.getByText('High Priority Lead')).toBeDefined()
    expect(
      screen.getByText(
        'Somchai Jaidee · Food & Beverage · Central World · Score 88',
      ),
    ).toBeDefined()
  })

  // US-011 AC-V: clicking deep-links to lead detail
  it('navigates to lead detail and calls onDismiss when "View Lead" is clicked', () => {
    const onDismiss = vi.fn()
    render(
      <NotificationBanner notification={notification} onDismiss={onDismiss} />,
    )

    fireEvent.click(screen.getByText('View Lead →'))
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/agent/leads/$leadId',
      params: { leadId: 'lead-001' },
    })
    expect(onDismiss).toHaveBeenCalled()
  })

  // Dismiss button calls onDismiss
  it('calls onDismiss when dismiss (×) button is clicked', () => {
    const onDismiss = vi.fn()
    render(
      <NotificationBanner notification={notification} onDismiss={onDismiss} />,
    )
    fireEvent.click(screen.getByLabelText('Dismiss'))
    expect(onDismiss).toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  // No "View Lead" button if no leadId
  it('does not render "View Lead" link when leadId is absent', () => {
    render(
      <NotificationBanner
        notification={{ title: 'Alert', body: 'Something happened' }}
        onDismiss={vi.fn()}
      />,
    )
    expect(screen.queryByText('View Lead →')).toBeNull()
  })

  // Visual: fixed top-right with amber border (US-011 styling)
  it('has amber border class indicating high-priority', () => {
    const { container } = render(
      <NotificationBanner notification={notification} onDismiss={vi.fn()} />,
    )
    const banner = container.firstChild as HTMLElement
    expect(banner.className).toContain('border-amber-400')
  })
})
