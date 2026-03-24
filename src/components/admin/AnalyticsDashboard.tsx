import { Button } from '@/components/ui/button'

export interface ConversationMetrics {
  daily: number
  weekly: number
  monthly: number
}

export interface AnalyticsData {
  conversations: ConversationMetrics
  leadsCaptures: number
  leadConversionRate: number
  averageLeadScore: number
  topBusinessTypes: Array<{ name: string; count: number }>
  topMalls: Array<{ name: string; count: number }>
}

export interface KnowledgeGapEntry {
  query: string
  conversationId: string
  timestamp: string
}

interface AnalyticsDashboardProps {
  analytics: AnalyticsData
  knowledgeGaps: KnowledgeGapEntry[]
  onExportCsv: () => void
}

export function AnalyticsDashboard({
  analytics,
  knowledgeGaps,
  onExportCsv,
}: AnalyticsDashboardProps) {
  return (
    <div>
      <section data-testid="metrics-section">
        <h2>Conversations</h2>
        <p data-testid="metric-conversations-daily">
          Daily: {analytics.conversations.daily}
        </p>
        <p data-testid="metric-conversations-weekly">
          Weekly: {analytics.conversations.weekly}
        </p>
        <p data-testid="metric-conversations-monthly">
          Monthly: {analytics.conversations.monthly}
        </p>
        <p data-testid="metric-leads">Leads Captured: {analytics.leadsCaptures}</p>
        <p data-testid="metric-conversion-rate">
          Lead Conversion Rate: {(analytics.leadConversionRate * 100).toFixed(1)}%
        </p>
        <p data-testid="metric-avg-lead-score">
          Avg Lead Score: {analytics.averageLeadScore}
        </p>

        <h3>Top Business Types</h3>
        <ol data-testid="top-business-types">
          {analytics.topBusinessTypes.slice(0, 5).map((item) => (
            <li key={item.name}>
              {item.name}: {item.count}
            </li>
          ))}
        </ol>

        <h3>Top Malls</h3>
        <ol data-testid="top-malls">
          {analytics.topMalls.slice(0, 5).map((item) => (
            <li key={item.name}>
              {item.name}: {item.count}
            </li>
          ))}
        </ol>
      </section>

      <section data-testid="knowledge-gap-section">
        <h2>Knowledge Gap Report</h2>
        {knowledgeGaps.length === 0 ? (
          <p data-testid="no-gaps">No knowledge gaps detected.</p>
        ) : (
          <ul data-testid="knowledge-gap-list">
            {knowledgeGaps.map((gap) => (
              <li key={gap.conversationId} data-testid={`gap-${gap.conversationId}`}>
                {gap.query}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Button data-testid="export-csv-btn" onClick={onExportCsv}>
        Export CSV
      </Button>
    </div>
  )
}
