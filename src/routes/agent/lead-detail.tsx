import { useState } from 'react'
import { useNavigate, useParams, createRoute } from '@tanstack/react-router'
import ReactMarkdown from 'react-markdown'
import dayjs from 'dayjs'
import { useLead, useConversation, useActivityLog, updateLeadStatus, addLeadNote } from '@/hooks/useLead'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { LeadStatus } from '@/types'

const STATUS_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  new: ['contacted'],
  contacted: ['site_visit_scheduled', 'closed_lost'],
  site_visit_scheduled: ['proposal_sent', 'closed_lost'],
  proposal_sent: ['closed_won', 'closed_lost'],
  closed_won: [],
  closed_lost: [],
}

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  site_visit_scheduled: 'Site Visit Scheduled',
  proposal_sent: 'Proposal Sent',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
}

function LeadDetailView() {
  const { leadId } = useParams({ strict: false }) as { leadId: string }
  const navigate = useNavigate()
  const { user, userProfile, role } = useAuth()

  const { lead, loading: leadLoading } = useLead(leadId)
  const { turns, loading: convoLoading } = useConversation(lead?.sessionId ?? '')
  const { logs } = useActivityLog(leadId)

  const [note, setNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [statusNote, setStatusNote] = useState('')
  const [changingStatus, setChangingStatus] = useState(false)
  const [activeTab, setActiveTab] = useState<'transcript' | 'activity'>('transcript')

  if (leadLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Lead not found.
      </div>
    )
  }

  const canChangeStatus =
    lead.status !== 'closed_won' &&
    lead.status !== 'closed_lost' &&
    (lead.assignedTo === user?.uid || role === 'admin')

  const availableTransitions = STATUS_TRANSITIONS[lead.status] ?? []

  const handleStatusChange = async (newStatus: string) => {
    if (!user || !userProfile) return
    setChangingStatus(true)
    try {
      await updateLeadStatus(
        leadId,
        lead.status,
        newStatus as LeadStatus,
        user.uid,
        userProfile.displayName,
        statusNote || undefined,
      )
      setStatusNote('')
    } finally {
      setChangingStatus(false)
    }
  }

  const handleSaveNote = async () => {
    setSavingNote(true)
    try {
      await addLeadNote(leadId, note)
    } finally {
      setSavingNote(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-3 flex items-center gap-4">
        <button
          onClick={() => void navigate({ to: '/agent' })}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Pipeline
        </button>
        <span className="text-gray-300">|</span>
        <span className="font-semibold text-gray-900">{lead.prospectName}</span>
        {lead.leadScore >= 75 && (
          <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
            ⭐ High Priority · Score {lead.leadScore}
          </span>
        )}
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: transcript / activity */}
        <div className="lg:col-span-2 space-y-4">
          {/* AI Summary */}
          {lead.aiSummary && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">
                AI Summary
              </p>
              <div className="text-sm text-blue-900 prose prose-sm max-w-none">
                <ReactMarkdown>{lead.aiSummary}</ReactMarkdown>
              </div>
            </div>
          )}

          {/* Interested units */}
          {lead.interestedUnits && lead.interestedUnits.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-500">Interested units:</span>
              {lead.interestedUnits.map((unit) => (
                <span
                  key={unit}
                  className="text-xs bg-gray-100 border rounded px-2 py-1 font-mono cursor-pointer hover:bg-gray-200"
                >
                  {unit}
                </span>
              ))}
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-xl border overflow-hidden">
            <div className="flex border-b">
              {(['transcript', 'activity'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'flex-1 py-3 text-sm font-medium capitalize',
                    activeTab === tab
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700',
                  )}
                >
                  {tab === 'transcript' ? 'Chat Transcript' : 'Activity Log'}
                </button>
              ))}
            </div>

            <div className="p-4 max-h-[500px] overflow-y-auto">
              {activeTab === 'transcript' ? (
                convoLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                  </div>
                ) : turns.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">No transcript available.</p>
                ) : (
                  <div className="space-y-4">
                    {turns.map((turn) => (
                      <div
                        key={turn.id}
                        className={cn(
                          'flex',
                          turn.role === 'user' ? 'justify-end' : 'justify-start',
                        )}
                      >
                        <div
                          className={cn(
                            'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
                            turn.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-800',
                          )}
                        >
                          <ReactMarkdown>{turn.content}</ReactMarkdown>
                          {turn.timestamp?.toDate && (
                            <p
                              className={cn(
                                'text-xs mt-1',
                                turn.role === 'user' ? 'text-blue-200' : 'text-gray-400',
                              )}
                            >
                              {dayjs(turn.timestamp.toDate()).format('HH:mm')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="space-y-3">
                  {logs.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">No activity yet.</p>
                  ) : (
                    logs.map((log) => (
                      <div key={log.id} className="flex gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                        <div>
                          <p className="text-gray-700">
                            <span className="font-medium">{log.agentName}</span> changed status from{' '}
                            <span className="font-medium">{STATUS_LABELS[log.fromStatus]}</span> to{' '}
                            <span className="font-medium">{STATUS_LABELS[log.toStatus]}</span>
                          </p>
                          {log.note && (
                            <p className="text-gray-500 mt-0.5 italic">"{log.note}"</p>
                          )}
                          {log.timestamp?.toDate && (
                            <p className="text-gray-400 text-xs mt-0.5">
                              {dayjs(log.timestamp.toDate()).format('MMM D, YYYY HH:mm')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Private note */}
          <div className="bg-white rounded-xl border p-4">
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Private Note <span className="text-gray-400 font-normal">(not visible to prospect)</span>
            </label>
            <Textarea
              value={note || lead.notes || ''}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a private note..."
              rows={3}
              className="text-sm"
            />
            <div className="flex justify-end mt-2">
              <Button size="sm" onClick={() => void handleSaveNote()} disabled={savingNote}>
                {savingNote ? 'Saving…' : 'Save Note'}
              </Button>
            </div>
          </div>
        </div>

        {/* Right: lead info + status */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Contact Info</h3>
            <dl className="space-y-2 text-sm">
              <InfoRow label="Name" value={lead.prospectName} />
              <InfoRow label="Contact" value={lead.contact} />
              <InfoRow label="Business Type" value={lead.businessType} />
              <InfoRow
                label="Mall Preference"
                value={lead.mallPreference.join(', ') || '—'}
              />
              <InfoRow label="Lead Score" value={String(lead.leadScore)} />
              {lead.createdAt?.toDate && (
                <InfoRow
                  label="Created"
                  value={dayjs(lead.createdAt.toDate()).format('MMM D, YYYY HH:mm')}
                />
              )}
            </dl>
          </div>

          {/* Status management */}
          <div className="bg-white rounded-xl border p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Lead Status</h3>
            <div className="text-sm mb-3">
              Current:{' '}
              <span className="font-medium">{STATUS_LABELS[lead.status]}</span>
            </div>

            {canChangeStatus && availableTransitions.length > 0 ? (
              <div className="space-y-3">
                <Select onValueChange={(v) => void handleStatusChange(v)} disabled={changingStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Change status…" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTransitions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Optional note for this status change…"
                  rows={2}
                  className="text-sm"
                />
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                {lead.status === 'closed_won' || lead.status === 'closed_lost'
                  ? 'Closed leads cannot be re-opened without admin override.'
                  : 'You do not have permission to change this lead\'s status.'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function LeadDetailPage() {
  return (
    <ProtectedRoute>
      <LeadDetailView />
    </ProtectedRoute>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="text-gray-500 w-28 shrink-0">{label}</dt>
      <dd className="text-gray-900 font-medium">{value}</dd>
    </div>
  )
}

import type { RootRoute } from '@tanstack/react-router'

export default (parentRoute: RootRoute) =>
  createRoute({
    getParentRoute: () => parentRoute,
    path: '/agent/leads/$leadId',
    component: LeadDetailPage,
  })
