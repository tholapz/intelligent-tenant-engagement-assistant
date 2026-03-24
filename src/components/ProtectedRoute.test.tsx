import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProtectedRoute } from './ProtectedRoute'
import type { Timestamp } from 'firebase/firestore'
import type { UserProfile } from '@/types'
import type { User } from 'firebase/auth'

const mockNavigate = vi.fn()

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

async function getUseAuth() {
  const { useAuth } = await import('@/contexts/AuthContext')
  return vi.mocked(useAuth)
}

const fakeUser = { uid: 'uid-001', email: 'agent@centralpattana.co.th' } as User
const fakeProfile: UserProfile = {
  uid: 'uid-001',
  email: 'agent@centralpattana.co.th',
  displayName: 'Agent One',
  role: 'agent',
  createdAt: null as unknown as Timestamp,
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // US-007 AC-C: authenticated user sees protected content
  it('renders children when user is authenticated', async () => {
    const useAuth = await getUseAuth()
    useAuth.mockReturnValue({
      user: fakeUser,
      userProfile: fakeProfile,
      role: 'agent',
      loading: false,
      signInWithGoogle: vi.fn(),
      logout: vi.fn(),
      authError: null,
    })

    render(
      <ProtectedRoute>
        <div>Agent Dashboard</div>
      </ProtectedRoute>,
    )

    expect(screen.getByText('Agent Dashboard')).toBeDefined()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  // US-007: unauthenticated user is redirected to /login
  it('redirects to /login when user is not authenticated', async () => {
    const useAuth = await getUseAuth()
    useAuth.mockReturnValue({
      user: null,
      userProfile: null,
      role: null,
      loading: false,
      signInWithGoogle: vi.fn(),
      logout: vi.fn(),
      authError: null,
    })

    render(
      <ProtectedRoute>
        <div>Secret</div>
      </ProtectedRoute>,
    )

    expect(screen.queryByText('Secret')).toBeNull()
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' })
  })

  // Shows loading spinner while auth state resolves
  it('shows loading spinner while auth is loading', async () => {
    const useAuth = await getUseAuth()
    useAuth.mockReturnValue({
      user: null,
      userProfile: null,
      role: null,
      loading: true,
      signInWithGoogle: vi.fn(),
      logout: vi.fn(),
      authError: null,
    })

    const { container } = render(
      <ProtectedRoute>
        <div>Content</div>
      </ProtectedRoute>,
    )

    expect(screen.queryByText('Content')).toBeNull()
    expect(container.querySelector('.animate-spin')).toBeTruthy()
  })

  // US-012 AC-A: role-based access — redirects to /agent when role doesn't match
  it('redirects to /agent when role is insufficient', async () => {
    const useAuth = await getUseAuth()
    useAuth.mockReturnValue({
      user: fakeUser,
      userProfile: fakeProfile,
      role: 'agent',
      loading: false,
      signInWithGoogle: vi.fn(),
      logout: vi.fn(),
      authError: null,
    })

    render(
      <ProtectedRoute requiredRole={['admin']}>
        <div>Admin Only</div>
      </ProtectedRoute>,
    )

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/agent' })
  })

  // Admin can access admin-only route
  it('allows access when user role matches requiredRole', async () => {
    const useAuth = await getUseAuth()
    useAuth.mockReturnValue({
      user: fakeUser,
      userProfile: { ...fakeProfile, role: 'admin' },
      role: 'admin',
      loading: false,
      signInWithGoogle: vi.fn(),
      logout: vi.fn(),
      authError: null,
    })

    render(
      <ProtectedRoute requiredRole={['admin']}>
        <div>Admin Panel</div>
      </ProtectedRoute>,
    )

    expect(screen.getByText('Admin Panel')).toBeDefined()
    expect(mockNavigate).not.toHaveBeenCalledWith({ to: '/agent' })
  })
})
