import { useRef } from 'react'
import { Card, Button, Progress } from '#/components/ui'
import { useImportExport } from '#/hooks/useImportExport'
import { useToast } from '#/providers'
import { Download, Upload } from 'lucide-react'

export function ImportExportPanel() {
  const {
    exportData,
    importData,
    exportProgress,
    importProgress,
    isExporting,
    isImporting,
  } = useImportExport()
  const { showSuccess, showError } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = async () => {
    try {
      await exportData()
      showSuccess('Export complete! Your backup file has been downloaded.')
    } catch {
      showError('Export failed. Please try again.')
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      await importData(file)
      showSuccess('Import complete! Please reload the page to see changes.')
    } catch (err) {
      showError(
        `Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      )
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const exportPercent =
    exportProgress.total > 0
      ? Math.round((exportProgress.current / exportProgress.total) * 100)
      : 0
  const importPercent =
    importProgress.total > 0
      ? Math.round((importProgress.current / importProgress.total) * 100)
      : 0

  const isExportingOrDone = isExporting || exportProgress.stage === 'done'
  const isImportingOrDone = isImporting || importProgress.stage === 'done'

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2
          className="text-base font-medium text-(--q-text)"
          style={{ fontFamily: 'var(--q-font-serif)' }}
        >
          Backup & Restore
        </h2>
        <p className="text-sm font-light text-(--q-text-muted) mt-1">
          Export your notes, drawings, and settings to a single file, or restore
          from a previous backup.
        </p>
      </div>

      {/* Export Section */}
      <Card variant="flat">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-(--q-green-pale) border border-(--q-border) flex items-center justify-center shrink-0">
                <Download className="w-5 h-5 text-(--q-green-deep)" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-(--q-text)">
                  Export Data
                </h3>
                <p className="text-xs font-light text-(--q-text-muted)">
                  Download all your notes, PDFs, and settings as a .quartz
                  backup file.
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExport}
              disabled={isExportingOrDone}
              loading={isExporting}
            >
              Export
            </Button>
          </div>

          {isExporting && (
            <Progress
              value={exportPercent}
              label={exportProgress.label}
              showValue
            />
          )}

          {exportProgress.stage === 'done' && (
            <p className="text-xs text-(--q-text-muted) font-light">
              Export complete.
            </p>
          )}
        </div>
      </Card>

      {/* Import Section */}
      <Card variant="flat">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-(--q-green-pale) border border-(--q-border) flex items-center justify-center shrink-0">
                <Upload className="w-5 h-5 text-(--q-green-deep)" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-(--q-text)">
                  Import Data
                </h3>
                <p className="text-xs font-light text-(--q-text-muted)">
                  Restore from a .quartz backup file. This will replace all
                  existing data.
                </p>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleImportClick}
              disabled={isImportingOrDone}
              loading={isImporting}
            >
              Import
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".quartz"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {isImporting && (
            <Progress
              value={importPercent}
              label={importProgress.label}
              showValue
            />
          )}

          {importProgress.stage === 'done' && (
            <p className="text-xs text-(--q-text-muted) font-light">
              Import complete.
            </p>
          )}
        </div>
      </Card>

      {/* Warning */}
      <p className="text-xs text-(--q-text-muted) font-light pt-2 border-t border-(--q-border)">
        Warning: Importing will replace all existing notes, PDFs, and settings.
        Make sure to export your current data first.
      </p>
    </div>
  )
}
