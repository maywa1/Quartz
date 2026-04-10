import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { FileStorage } from '#/lib/FileStorage'
import { APP_VERSION, SCHEMA_VERSION } from '#/utils/config'
import { useDatabase } from '#/providers'
import { useNotes, deleteTldrawDocument } from './useNotes'
import { usePdfs } from './usePdfs'
import { useTags, useAllNoteTags, useAllPdfTags } from './useTags'
import { useSettings } from './useSettings'
import type { PDF, Note, Tag } from '#/types/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ExportProgress {
  stage:
    | 'idle'
    | 'database'
    | 'drawings'
    | 'pdfs'
    | 'packing'
    | 'done'
    | 'error'
  current: number
  total: number
  label: string
}

export interface ImportProgress {
  stage:
    | 'idle'
    | 'reading'
    | 'validating'
    | 'database'
    | 'drawings'
    | 'pdfs'
    | 'done'
    | 'error'
  current: number
  total: number
  label: string
}

interface QuartzManifest {
  appVersion: number
  schemaVersion: number
  exportedAt: string
  totalPdfs: number
  totalNotes: number
}

interface DatabaseDump {
  pdfs: PDF[]
  notes: Note[]
  tags: Tag[]
  tagNotes: { tag_id: string; note_id: string }[]
  tagPdfs: { tag_id: string; pdf_id: string }[]
  settings: { key: string; value: string }[]
}

interface QuartzBundle {
  manifest: QuartzManifest
  database: {
    pdfs: PDF[]
    notes: Note[]
    tags: Tag[]
    tag_notes: { tag_id: string; note_id: string }[]
    tag_pdfs: { tag_id: string; pdf_id: string }[]
    settings: { key: string; value: string }[]
  }
  drawings: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// IndexedDB helpers for tldraw
// ---------------------------------------------------------------------------

const TLDRAW_DB_PREFIX = 'TLDRAW_DOCUMENT_V2'

interface TldrawDump {
  name: string
  stores: Record<string, unknown[]>
}

async function exportTldrawIDB(noteId: string): Promise<TldrawDump | null> {
  const dbName = `${TLDRAW_DB_PREFIX}${noteId}`
  return new Promise((resolve) => {
    const req = indexedDB.open(dbName)
    req.onerror = () => resolve(null)
    req.onsuccess = async () => {
      const db = req.result
      const stores: Record<string, unknown[]> = {}
      for (const storeName of db.objectStoreNames) {
        const tx = db.transaction(storeName, 'readonly')
        const store = tx.objectStore(storeName)
        const data = await new Promise<unknown[]>((res) => {
          const r = store.getAll()
          r.onsuccess = () => res(r.result)
          r.onerror = () => res([])
        })
        stores[storeName] = data
      }
      db.close()
      resolve({ name: dbName, stores })
    }
    req.onupgradeneeded = () => {
      req.result.close()
      resolve(null)
    }
  })
}

async function importTldrawIDB(dump: TldrawDump): Promise<void> {
  const dbName = dump.name
  const noteId = dbName.replace(TLDRAW_DB_PREFIX, '')
  await deleteTldrawDocument(noteId)
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(dbName)
    req.onerror = () => reject(req.error)
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      for (const storeName of Object.keys(dump.stores)) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' })
        }
      }
    }
    req.onsuccess = () => {
      const db = req.result
      const storeNames = Object.keys(dump.stores)
      let completed = 0
      for (const storeName of storeNames) {
        const tx = db.transaction(storeName, 'readwrite')
        const store = tx.objectStore(storeName)
        for (const record of dump.stores[storeName]) {
          store.put(record)
        }
        tx.oncomplete = () => {
          completed++
          if (completed === storeNames.length) {
            db.close()
            resolve()
          }
        }
        tx.onerror = () => {
          db.close()
          reject(tx.error)
        }
      }
    }
  })
}

// ---------------------------------------------------------------------------
// ZIP helpers
// ---------------------------------------------------------------------------

const crcTable = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[i] = c
  }
  return t
})()

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (const byte of data) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff]
  }
  return (crc ^ 0xffffffff) >>> 0
}

function u16(n: number): Uint8Array {
  return new Uint8Array([n & 0xff, (n >> 8) & 0xff])
}

function u32(n: number): Uint8Array {
  return new Uint8Array([
    n & 0xff,
    (n >> 8) & 0xff,
    (n >> 16) & 0xff,
    (n >> 24) & 0xff,
  ])
}

function concat(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((s, a) => s + a.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const a of arrays) {
    out.set(a, offset)
    offset += a.length
  }
  return out
}

interface ZipEntry {
  name: string
  data: Uint8Array
  offset: number
}

class ZipBuilder {
  private entries: ZipEntry[] = []
  private offset = 0
  private localParts: Uint8Array[] = []

  addFile(name: Uint8Array, data: Uint8Array): void {
    const crc = crc32(data)
    const local = concat(
      new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
      u16(20),
      u16(0),
      u16(0),
      u16(0),
      u16(0),
      u32(crc),
      u32(data.length),
      u32(data.length),
      u16(name.length),
      u16(0),
      name,
      data,
    )
    this.entries.push({
      name: name as unknown as string,
      data,
      offset: this.offset,
    })
    this.localParts.push(local)
    this.offset += local.length
  }

  addFileStr(name: string, data: Uint8Array): void {
    this.addFile(new TextEncoder().encode(name), data)
  }

  build(): Uint8Array {
    const enc = new TextEncoder()
    const centralParts: Uint8Array[] = []
    for (const entry of this.entries) {
      const nameBytes =
        typeof entry.name === 'string'
          ? enc.encode(entry.name)
          : (entry.name as unknown as Uint8Array)
      const crc = crc32(entry.data)
      const central = concat(
        new Uint8Array([0x50, 0x4b, 0x01, 0x02]),
        u16(20),
        u16(20),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(crc),
        u32(entry.data.length),
        u32(entry.data.length),
        u16(nameBytes.length),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(0),
        u32(entry.offset),
        nameBytes,
      )
      centralParts.push(central)
    }
    const centralDir = concat(...centralParts)
    const eocd = concat(
      new Uint8Array([0x50, 0x4b, 0x05, 0x06]),
      u16(0),
      u16(0),
      u16(this.entries.length),
      u16(this.entries.length),
      u32(centralDir.length),
      u32(this.offset),
      u16(0),
    )
    return concat(...this.localParts, centralDir, eocd)
  }
}

interface ZipFile {
  name: string
  data: Uint8Array
}

function parseZip(buffer: ArrayBuffer): ZipFile[] {
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)
  const files: ZipFile[] = []
  let i = 0
  while (i < bytes.length - 4) {
    const sig = view.getUint32(i, true)
    if (sig === 0x04034b50) {
      const nameLen = view.getUint16(i + 26, true)
      const extraLen = view.getUint16(i + 28, true)
      const compSize = view.getUint32(i + 18, true)
      const name = new TextDecoder().decode(
        bytes.slice(i + 30, i + 30 + nameLen),
      )
      const dataStart = i + 30 + nameLen + extraLen
      const data = bytes.slice(dataStart, dataStart + compSize)
      files.push({ name, data })
      i = dataStart + compSize
    } else {
      i++
    }
  }
  return files
}

// ---------------------------------------------------------------------------
// The hook
// ---------------------------------------------------------------------------

export function useImportExport() {
  const db = useDatabase()
  const queryClient = useQueryClient()

  // Use existing hooks for data fetching
  const { data: notes = [] } = useNotes()
  const { data: pdfs = [] } = usePdfs()
  const { data: tags = [] } = useTags()
  const { data: settingsMap = {} } = useSettings()
  const { data: allNoteTags = new Map() } = useAllNoteTags()
  const { data: allPdfTags = new Map() } = useAllPdfTags()

  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    stage: 'idle',
    current: 0,
    total: 0,
    label: '',
  })
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    stage: 'idle',
    current: 0,
    total: 0,
    label: '',
  })

  const exportData = useCallback(async () => {
    const zip = new ZipBuilder()
    const enc = new TextEncoder()

    try {
      setExportProgress({
        stage: 'database',
        current: 0,
        total: 6,
        label: 'Exporting database…',
      })

      // Build the database dump from hook data
      const tagNotes: { tag_id: string; note_id: string }[] = []
      for (const [noteId, noteItemTags] of allNoteTags) {
        for (const tag of noteItemTags) {
          tagNotes.push({ tag_id: tag.id, note_id: noteId })
        }
      }
      const tagPdfs: { tag_id: string; pdf_id: string }[] = []
      for (const [pdfId, pdfItemTags] of allPdfTags) {
        for (const tag of pdfItemTags) {
          tagPdfs.push({ tag_id: tag.id, pdf_id: pdfId })
        }
      }
      const databaseDump: DatabaseDump = {
        pdfs,
        notes,
        tags,
        tagNotes,
        tagPdfs,
        settings: Object.entries(settingsMap).map(([key, value]) => ({
          key,
          value,
        })),
      }

      setExportProgress({
        stage: 'database',
        current: 6,
        total: 6,
        label: 'Database exported',
      })

      const manifest: QuartzManifest = {
        appVersion: APP_VERSION,
        schemaVersion: SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        totalPdfs: pdfs.length,
        totalNotes: notes.length,
      }

      zip.addFileStr(
        'manifest.json',
        enc.encode(JSON.stringify(manifest, null, 2)),
      )
      zip.addFileStr(
        'database.json',
        enc.encode(
          JSON.stringify(
            {
              pdfs: databaseDump.pdfs,
              notes: databaseDump.notes,
              tags: databaseDump.tags,
              tag_notes: databaseDump.tagNotes,
              tag_pdfs: databaseDump.tagPdfs,
              settings: databaseDump.settings,
            },
            null,
            2,
          ),
        ),
      )

      setExportProgress({
        stage: 'drawings',
        current: 0,
        total: notes.length,
        label: 'Exporting drawings…',
      })

      for (let i = 0; i < notes.length; i++) {
        const note = notes[i]
        const dump = await exportTldrawIDB(note.id)
        if (dump && Object.keys(dump.stores).length > 0) {
          zip.addFileStr(
            `tldraw/${note.id}.json`,
            enc.encode(JSON.stringify(dump)),
          )
        }
        setExportProgress({
          stage: 'drawings',
          current: i + 1,
          total: notes.length,
          label: `Exporting drawing ${i + 1} of ${notes.length}…`,
        })
      }

      setExportProgress({
        stage: 'pdfs',
        current: 0,
        total: pdfs.length,
        label: 'Exporting PDFs…',
      })

      for (let i = 0; i < pdfs.length; i++) {
        const pdf = pdfs[i]
        const path = FileStorage.buildPdfPath(pdf.id)
        try {
          const buf = await FileStorage.read(path)
          zip.addFileStr(`pdfs/${pdf.id}/document.pdf`, new Uint8Array(buf))
        } catch {
          console.warn(`Could not read PDF for id=${pdf.id}, skipping`)
        }
        setExportProgress({
          stage: 'pdfs',
          current: i + 1,
          total: pdfs.length,
          label: `Exporting PDF ${i + 1} of ${pdfs.length}…`,
        })
      }

      setExportProgress({
        stage: 'packing',
        current: 0,
        total: 1,
        label: 'Packing bundle…',
      })
      const zipBytes = zip.build()
      const blob = new Blob([zipBytes.buffer as ArrayBuffer], {
        type: 'application/octet-stream',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      a.href = url
      a.download = `quartz-backup-${ts}.quartz`
      a.click()
      URL.revokeObjectURL(url)

      setExportProgress({
        stage: 'done',
        current: 1,
        total: 1,
        label: 'Export complete!',
      })
    } catch (err) {
      console.error('Export failed:', err)
      setExportProgress({
        stage: 'error',
        current: 0,
        total: 0,
        label: `Export failed: ${String(err)}`,
      })
      throw err
    }
  }, [pdfs, notes, tags, settingsMap, allNoteTags, allPdfTags])

  const importData = useCallback(
    async (file: File) => {
      try {
        setImportProgress({
          stage: 'reading',
          current: 0,
          total: 1,
          label: 'Reading file…',
        })
        const buffer = await file.arrayBuffer()
        const zipFiles = parseZip(buffer)

        const get = (name: string) => zipFiles.find((f) => f.name === name)
        const dec = new TextDecoder()

        setImportProgress({
          stage: 'validating',
          current: 0,
          total: 1,
          label: 'Validating backup…',
        })
        const manifestFile = get('manifest.json')
        if (!manifestFile)
          throw new Error('Invalid .quartz file: missing manifest.json')

        const manifest = JSON.parse(
          dec.decode(manifestFile.data),
        ) as QuartzManifest
        if (manifest.schemaVersion > SCHEMA_VERSION) {
          throw new Error(
            `This backup requires schema version ${manifest.schemaVersion}, but the app is at ${SCHEMA_VERSION}. Please update Quartz first.`,
          )
        }

        const dbFile = get('database.json')
        if (!dbFile)
          throw new Error('Invalid .quartz file: missing database.json')

        const bundle = JSON.parse(
          dec.decode(dbFile.data),
        ) as QuartzBundle['database']
        const tables = [
          'pdfs',
          'notes',
          'tags',
          'tagNotes',
          'tagPdfs',
          'settings',
        ] as const

        setImportProgress({
          stage: 'database',
          current: 0,
          total: tables.length,
          label: 'Restoring database…',
        })

        const databaseDump: DatabaseDump = {
          pdfs: bundle.pdfs,
          notes: bundle.notes,
          tags: bundle.tags,
          tagNotes: bundle.tag_notes,
          tagPdfs: bundle.tag_pdfs,
          settings: bundle.settings,
        }

        // Use worker for import
        await db.importData(databaseDump)
        await queryClient.invalidateQueries()

        setImportProgress({
          stage: 'database',
          current: tables.length,
          total: tables.length,
          label: 'Database restored',
        })

        const drawingFiles = zipFiles.filter(
          (f) => f.name.startsWith('tldraw/') && f.name.endsWith('.json'),
        )
        setImportProgress({
          stage: 'drawings',
          current: 0,
          total: drawingFiles.length,
          label: 'Restoring drawings…',
        })

        for (let i = 0; i < drawingFiles.length; i++) {
          const df = drawingFiles[i]
          const noteId = df.name.replace('tldraw/', '').replace('.json', '')
          const dump = JSON.parse(dec.decode(df.data)) as TldrawDump
          dump.name = `${TLDRAW_DB_PREFIX}${noteId}`
          await importTldrawIDB(dump)
          setImportProgress({
            stage: 'drawings',
            current: i + 1,
            total: drawingFiles.length,
            label: `Restored drawing ${i + 1} of ${drawingFiles.length}…`,
          })
        }

        const pdfFiles = zipFiles.filter(
          (f) => f.name.startsWith('pdfs/') && f.name.endsWith('.pdf'),
        )
        setImportProgress({
          stage: 'pdfs',
          current: 0,
          total: pdfFiles.length,
          label: 'Restoring PDFs…',
        })

        for (let i = 0; i < pdfFiles.length; i++) {
          const pf = pdfFiles[i]
          const storagePath = pf.name.replace(/^pdfs\//, '')
          await FileStorage.write(storagePath, pf.data.buffer as ArrayBuffer)
          setImportProgress({
            stage: 'pdfs',
            current: i + 1,
            total: pdfFiles.length,
            label: `Restored PDF ${i + 1} of ${pdfFiles.length}…`,
          })
        }

        setImportProgress({
          stage: 'done',
          current: 1,
          total: 1,
          label: 'Import complete! Please reload.',
        })
      } catch (err) {
        console.error('Import failed:', err)
        setImportProgress({
          stage: 'error',
          current: 0,
          total: 0,
          label: `Import failed: ${String(err)}`,
        })
        throw err
      }
    },
    [db],
  )

  const resetExport = useCallback(() => {
    setExportProgress({ stage: 'idle', current: 0, total: 0, label: '' })
  }, [])

  const resetImport = useCallback(() => {
    setImportProgress({ stage: 'idle', current: 0, total: 0, label: '' })
  }, [])

  return {
    exportData,
    importData,
    exportProgress,
    importProgress,
    resetExport,
    resetImport,
    isExporting:
      exportProgress.stage !== 'idle' &&
      exportProgress.stage !== 'done' &&
      exportProgress.stage !== 'error',
    isImporting:
      importProgress.stage !== 'idle' &&
      importProgress.stage !== 'done' &&
      importProgress.stage !== 'error',
  }
}
