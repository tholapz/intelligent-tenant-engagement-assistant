import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/types'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: UserRole[]
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return
    if (!user) {
      void navigate({ to: '/login' })
      return
    }
    if (requiredRole && role && !requiredRole.includes(role)) {
      void navigate({ to: '/agent' })
    }
  }, [user, role, loading, navigate, requiredRole])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!user) return null

  return <>{children}</>
}
