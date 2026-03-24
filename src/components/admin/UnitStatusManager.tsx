import { useRef } from 'react'
import { Button } from '@/components/ui/button'

export type UnitStatus = 'available' | 'leased' | 'renovation' | 'reserved'

export interface AuditEntry {
  changedByUid: string
  timestamp: string
  fromStatus: UnitStatus
  toStatus: UnitStatus
}

export interface Unit {
  unitId: string
  name: string
  status: UnitStatus
  auditLog: AuditEntry[]
}

interface UnitStatusManagerProps {
  units: Unit[]
  onStatusChange: (unitId: string, newStatus: UnitStatus) => void
  onBulkUpload: (file: File) => void
}

export function UnitStatusManager({
  units,
  onStatusChange,
  onBulkUpload,
}: UnitStatusManagerProps) {
  const csvInputRef = useRef<HTMLInputElement>(null)

  function handleCsvChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) onBulkUpload(file)
  }

  return (
    <div>
      <div data-testid="bulk-upload-section">
        <input
          ref={csvInputRef}
          type="file"
          accept=".csv"
          data-testid="csv-input"
          className="hidden"
          onChange={handleCsvChange}
        />
        <Button variant="outline" onClick={() => csvInputRef.current?.click()}>
          Bulk Upload CSV
        </Button>
      </div>

      <table data-testid="units-table">
        <thead>
          <tr>
            <th>Unit</th>
            <th>Status</th>
            <th>Audit Log</th>
          </tr>
        </thead>
        <tbody>
          {units.map((unit) => (
            <tr key={unit.unitId} data-testid={`unit-row-${unit.unitId}`}>
              <td>{unit.name}</td>
              <td>
                <select
                  aria-label={`Status for ${unit.name}`}
                  value={unit.status}
                  onChange={(e) =>
                    onStatusChange(unit.unitId, e.target.value as UnitStatus)
                  }
                >
                  <option value="available">Available</option>
                  <option value="leased">Leased</option>
                  <option value="renovation">Renovation</option>
                  <option value="reserved">Reserved</option>
                </select>
              </td>
              <td>
                <ul data-testid={`audit-log-${unit.unitId}`}>
                  {unit.auditLog.map((entry, i) => (
                    <li key={i}>
                      {entry.fromStatus} → {entry.toStatus} by {entry.changedByUid} at{' '}
                      {entry.timestamp}
                    </li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
