import { useState } from 'react'
import { createRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import dayjs from 'dayjs'
import type { RecommendationResponse, UnitRecommendation } from '@/types'
import type { RootRoute } from '@tanstack/react-router'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { API_BASE_URL, auth } from '@/lib/firebase'
import { cn } from '@/lib/utils'

const BUSINESS_TYPES = [
  'Food & Beverage',
  'Fashion & Apparel',
  'Electronics',
  'Health & Beauty',
  'Sports & Fitness',
  'Home & Lifestyle',
  'Entertainment',
  'Services',
  'Education',
  'Other',
]

const MALLS = [
  'Central World',
  'Central Ladprao',
  'Central Pinklao',
  'Central Bangna',
  'Central Chidlom',
  'Central Rama 9',
  'Central Eastville',
]

const schema = z.object({
  businessType: z.string().min(1, 'Business type is required'),
  preferredMall: z.string().optional(),
  sizeMin: z.number().min(1).max(10000),
  sizeMax: z.number().min(1).max(10000),
  monthlyBudget: z.number().min(1000),
})

type FormValues = z.infer<typeof schema>

function RecommendationPage() {
  const navigate = useNavigate()
  const [results, setResults] = useState<RecommendationResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pinnedUnits, setPinnedUnits] = useState<Set<string>>(new Set())

  const form = useForm({
    defaultValues: {
      businessType: '',
      preferredMall: '',
      sizeMin: 30,
      sizeMax: 200,
      monthlyBudget: 50000,
    } as FormValues,
    onSubmit: async ({ value }) => {
      setError(null)
      setLoading(true)
      setResults(null)
      try {
        const token = await auth.currentUser?.getIdToken()
        const res = await fetch(`${API_BASE_URL}/api/v1/recommend`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            business_type: value.businessType,
            preferred_mall: value.preferredMall || undefined,
            size_range_sqm: { min: value.sizeMin, max: value.sizeMax },
            monthly_budget_thb: value.monthlyBudget,
          }),
        })
        if (!res.ok) throw new Error(`Server error: ${res.status}`)
        const data = (await res.json()) as RecommendationResponse
        setResults(data)
      } catch (err: unknown) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to fetch recommendations',
        )
      } finally {
        setLoading(false)
      }
    },
  })

  const togglePin = (unitCode: string) => {
    setPinnedUnits((prev) => {
      const next = new Set(prev)
      if (next.has(unitCode)) {
        next.delete(unitCode)
      } else {
        next.add(unitCode)
      }
      return next
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-3 flex items-center gap-4">
        <button
          onClick={() => void navigate({ to: '/agent' })}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Pipeline
        </button>
        <span className="text-gray-300">|</span>
        <span className="font-semibold text-gray-900">
          Unit Recommendations
        </span>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Merchant Profile</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void form.handleSubmit()
            }}
            className="space-y-4"
          >
            <form.Field name="businessType">
              {(field) => (
                <div>
                  <Label>Business Type *</Label>
                  <Select
                    value={field.state.value}
                    onValueChange={(v) => field.handleChange(v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-xs text-red-500 mt-1">
                      {String(field.state.meta.errors[0])}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field name="preferredMall">
              {(field) => (
                <div>
                  <Label>Preferred Mall (optional)</Label>
                  <Select
                    value={field.state.value ?? ''}
                    onValueChange={(v) => field.handleChange(v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Any mall" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any Mall</SelectItem>
                      {MALLS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </form.Field>

            <div className="grid grid-cols-2 gap-3">
              <form.Field name="sizeMin">
                {(field) => (
                  <div>
                    <Label>Min Size (sqm) *</Label>
                    <Input
                      type="number"
                      min={1}
                      className="mt-1"
                      value={field.state.value}
                      onChange={(e) =>
                        field.handleChange(Number(e.target.value))
                      }
                    />
                  </div>
                )}
              </form.Field>
              <form.Field name="sizeMax">
                {(field) => (
                  <div>
                    <Label>Max Size (sqm) *</Label>
                    <Input
                      type="number"
                      min={1}
                      className="mt-1"
                      value={field.state.value}
                      onChange={(e) =>
                        field.handleChange(Number(e.target.value))
                      }
                    />
                  </div>
                )}
              </form.Field>
            </div>

            <form.Field name="monthlyBudget">
              {(field) => (
                <div>
                  <Label>Monthly Budget (THB) *</Label>
                  <Input
                    type="number"
                    min={1000}
                    step={1000}
                    className="mt-1"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(Number(e.target.value))}
                  />
                </div>
              )}
            </form.Field>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Finding recommendations…
                </span>
              ) : (
                'Get Recommendations'
              )}
            </Button>
          </form>
        </div>

        {/* Results */}
        <div>
          {results ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">
                  Top {results.recommendations.length} Units
                </h2>
                <span className="text-xs text-gray-400">
                  {dayjs(results.generatedAt).format('HH:mm')}
                </span>
              </div>
              {results.recommendations.map((rec) => (
                <RecommendationCard
                  key={rec.unit.unitCode}
                  rec={rec}
                  pinned={pinnedUnits.has(rec.unit.unitCode)}
                  onPin={() => togglePin(rec.unit.unitCode)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-dashed p-10 text-center text-gray-400">
              <p className="text-lg mb-1">🏢</p>
              <p className="text-sm">Fill in the merchant profile and click</p>
              <p className="text-sm font-medium text-gray-500">
                Get Recommendations
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function RecommendationCard({
  rec,
  pinned,
  onPin,
}: {
  rec: UnitRecommendation
  pinned: boolean
  onPin: () => void
}) {
  const { unit } = rec
  const totalMonthly = unit.baseRentThb + unit.serviceChargeThb

  return (
    <div
      className={cn(
        'bg-white rounded-xl border p-4',
        pinned && 'border-blue-400',
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-gray-900">
              {unit.unitCode}
            </span>
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-600">
              {unit.status}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {unit.mall} · Floor {unit.floor} · Zone {unit.zone}
          </p>
        </div>
        <button
          onClick={onPin}
          className={cn(
            'text-xs px-2 py-1 rounded-lg border transition-colors',
            pinned
              ? 'bg-blue-600 text-white border-blue-600'
              : 'text-gray-500 hover:text-blue-600 hover:border-blue-400',
          )}
        >
          {pinned ? '📌 Pinned' : '📌 Pin'}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
        <div>
          <p className="text-gray-400 text-xs">Size</p>
          <p className="font-medium">{unit.sizeSqm} sqm</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Base Rent</p>
          <p className="font-medium">฿{unit.baseRentThb.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-400 text-xs">Total/mo</p>
          <p className="font-medium">฿{totalMonthly.toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
        <span>Available: {unit.earliestAvailableDate}</span>
        <span className="text-blue-600 font-medium">
          Match {Math.round(rec.score * 100)}%
        </span>
      </div>

      {rec.reason && (
        <p className="mt-2 text-xs text-gray-500 italic">{rec.reason}</p>
      )}
    </div>
  )
}

function RecommendationRoutePage() {
  return (
    <ProtectedRoute>
      <RecommendationPage />
    </ProtectedRoute>
  )
}

export default (parentRoute: RootRoute) =>
  createRoute({
    getParentRoute: () => parentRoute,
    path: '/agent/recommend',
    component: RecommendationRoutePage,
  })
