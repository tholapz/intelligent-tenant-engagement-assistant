import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { NotificationPermissionPrompt } from './NotificationPermissionPrompt'

const mockRequestPermission = vi.fn()

// US-011 AC-X: notification permission requested on first login
vi.mock('@/hooks/useFCM', () => ({
  useFCM: vi.fn(() => ({
    permission: 'default' as NotificationPermission,
    requestPermission: mockRequestPermission,
    notification: null,
    clearNotification: vi.fn(),
  })),
}))

describe('NotificationPermissionPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the prompt when permission is "default"', () => {
    render(<NotificationPermissionPrompt uid="user-123" />)
    expect(screen.getByText('Enable push notifications')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Allow Notifications' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Not now' })).toBeDefined()
  })

  it('calls requestPermission with uid when "Allow Notifications" is clicked', async () => {
    mockRequestPermission.mockResolvedValueOnce('granted')
    render(<NotificationPermissionPrompt uid="user-123" />)
    fireEvent.click(screen.getByRole('button', { name: 'Allow Notifications' }))
    expect(mockRequestPermission).toHaveBeenCalledWith('user-123')
  })

  // US-011 AC-X: gracefully degraded if denied — prompt disappears
  it('dismisses prompt when "Not now" is clicked', () => {
    render(<NotificationPermissionPrompt uid="user-123" />)
    fireEvent.click(screen.getByRole('button', { name: 'Not now' }))
    expect(screen.queryByText('Enable push notifications')).toBeNull()
  })

  it('does NOT render when permission is already "granted"', async () => {
    const { useFCM } = await import('@/hooks/useFCM')
    vi.mocked(useFCM).mockReturnValueOnce({
      permission: 'granted',
      requestPermission: mockRequestPermission,
      notification: null,
      clearNotification: vi.fn(),
    })
    render(<NotificationPermissionPrompt uid="user-123" />)
    expect(screen.queryByText('Enable push notifications')).toBeNull()
  })

  it('does NOT render when permission is "denied"', async () => {
    const { useFCM } = await import('@/hooks/useFCM')
    vi.mocked(useFCM).mockReturnValueOnce({
      permission: 'denied',
      requestPermission: mockRequestPermission,
      notification: null,
      clearNotification: vi.fn(),
    })
    render(<NotificationPermissionPrompt uid="user-123" />)
    expect(screen.queryByText('Enable push notifications')).toBeNull()
  })
})
