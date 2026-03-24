import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useNavigate } from '@tanstack/react-router'
import type { Lead } from '@/types'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

dayjs.extend(relativeTime)

const STATUS_LABELS: Record<Lead['status'], string> = {
  new: 'New',
  contacted: 'Contacted',
  site_visit_scheduled: 'Site Visit',
  proposal_sent: 'Proposal Sent',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
}

const STATUS_COLORS: Record<Lead['status'], string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  site_visit_scheduled: 'bg-purple-100 text-purple-800',
  proposal_sent: 'bg-orange-100 text-orange-800',
  closed_won: 'bg-green-100 text-green-800',
  closed_lost: 'bg-gray-100 text-gray-600',
}

interface LeadCardProps {
  lead: Lead
}

export function LeadCard({ lead }: LeadCardProps) {
  const navigate = useNavigate()
  const isHighPriority = lead.leadScore >= 75
  const createdAt = lead.createdAt?.toDate
    ? dayjs(lead.createdAt.toDate()).fromNow()
    : ''

  return (
    <button
      className={cn(
        'w-full text-left bg-white rounded-xl border p-4 hover:shadow-md transition-shadow cursor-pointer',
        isHighPriority && 'border-amber-400',
      )}
      onClick={() =>
        void navigate({
          to: '/agent/leads/$leadId',
          params: { leadId: lead.id },
        })
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-gray-900 truncate">
              {lead.prospectName}
            </span>
            {isHighPriority && (
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                ⭐ High Priority
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5 truncate">
            {lead.contact}
          </p>
          <p className="text-sm text-gray-600 mt-1">{lead.businessType}</p>
          {lead.mallPreference.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {lead.mallPreference.map((mall) => (
                <span
                  key={mall}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                >
                  {mall}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <ScoreRing score={lead.leadScore} />
            <span className="text-sm font-semibold text-gray-700">
              {lead.leadScore}
            </span>
          </div>
          <span
            className={cn(
              'text-xs px-2 py-1 rounded-full font-medium',
              STATUS_COLORS[lead.status],
            )}
          >
            {STATUS_LABELS[lead.status]}
          </span>
        </div>
      </div>
      {createdAt && <p className="text-xs text-gray-400 mt-3">{createdAt}</p>}
    </button>
  )
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 75 ? '#f59e0b' : score >= 50 ? '#3b82f6' : '#9ca3af'
  const radius = 10
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (score / 100) * circumference

  return (
    <svg width="28" height="28" viewBox="0 0 28 28" className="-rotate-90">
      <circle
        cx="14"
        cy="14"
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="3"
      />
      <circle
        cx="14"
        cy="14"
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
      />
    </svg>
  )
}

// Re-export Badge for convenience
export { Badge }
