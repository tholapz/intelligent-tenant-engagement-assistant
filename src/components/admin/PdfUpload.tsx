import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'

export type IngestionStatus = 'idle' | 'queued' | 'processing' | 'indexed' | 'error'

export interface IngestionState {
  status: IngestionStatus
  chunkCount?: number
  errorMessage?: string
}

interface PdfUploadProps {
  onUpload: (file: File) => Promise<void>
  ingestionState: IngestionState
}

const MAX_FILE_SIZE_MB = 20
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

export function PdfUpload({ onUpload, ingestionState }: PdfUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValidationError(null)
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setValidationError('Only PDF files are accepted.')
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setValidationError(`File exceeds the ${MAX_FILE_SIZE_MB} MB size limit.`)
      return
    }

    onUpload(file)
  }

  const { status, chunkCount, errorMessage } = ingestionState

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        data-testid="pdf-input"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        onClick={() => inputRef.current?.click()}
        disabled={status === 'queued' || status === 'processing'}
      >
        Upload PDF
      </Button>

      {validationError && (
        <p role="alert" data-testid="validation-error">
          {validationError}
        </p>
      )}

      {status !== 'idle' && (
        <div data-testid="ingestion-status">
          {status === 'queued' && <p>Status: queued</p>}
          {status === 'processing' && <p>Status: processing</p>}
          {status === 'indexed' && (
            <p>
              Status: indexed{chunkCount !== undefined ? ` — ${chunkCount} chunks` : ''}
            </p>
          )}
          {status === 'error' && (
            <p role="alert" data-testid="ingestion-error">
              {errorMessage ?? 'An error occurred during ingestion.'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
