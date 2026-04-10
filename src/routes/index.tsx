import { useState, useMemo, useRef, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { NoteItem } from './-components/NoteItem'
import { AddNoteItem } from './-components/AddNoteItem'
import type { AddNoteItemHandle } from './-components/AddNoteItem'
import { SearchBar } from './-components/SearchBar'
import type { SearchBarHandle } from './-components/SearchBar'
import { Tabs, Text } from '#/components/ui'
import Header from '#/components/Header'
import { useNotes, usePdfs, useAllNoteTags, useAllPdfTags } from '#/hooks'
import type { Note, Tag, PDF } from '#/types/types'

export const Route = createFileRoute('/')({
  component: Explorer,
})

type TabId = 'all' | 'individual' | 'pdfs'

interface NoteWithTags extends Note {
  tags: Tag[]
}
interface PdfWithTags extends PDF {
  tags: Tag[]
}

function Explorer() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<TabId>('all')
  const searchBarRef = useRef<SearchBarHandle>(null)
  const addNoteItemRef = useRef<AddNoteItemHandle>(null)

  const { data: notes = [], isLoading: notesLoading } = useNotes()
  const { data: pdfs = [], isLoading: pdfsLoading } = usePdfs()
  const { data: noteTagsMap = new Map<string, Tag[]>() } = useAllNoteTags()
  const { data: pdfTagsMap = new Map<string, Tag[]>() } = useAllPdfTags()

  const isLoading = notesLoading || pdfsLoading

  useEffect(() => {
    function handleKeyDown(e: globalThis.KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
      const modKey = isMac ? e.metaKey : e.ctrlKey

      if (modKey && e.key === 'k') {
        e.preventDefault()
        searchBarRef.current?.focus()
        return
      }

      if (e.key === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT'
        ) {
          return
        }
        e.preventDefault()
        addNoteItemRef.current?.expand()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const processedNotes = useMemo((): NoteWithTags[] => {
    const query = searchQuery.trim().toLowerCase()
    return notes
      .filter((n) => !n.pdf_id)
      .map((note) => ({ ...note, tags: noteTagsMap.get(note.id) ?? [] }))
      .filter(
        (note) =>
          !query ||
          note.name.toLowerCase().includes(query) ||
          note.tags.some((t) => t.name.toLowerCase().includes(query)),
      )
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
  }, [notes, noteTagsMap, searchQuery])

  const processedPdfs = useMemo((): PdfWithTags[] => {
    const query = searchQuery.trim().toLowerCase()
    return pdfs
      .map((pdf) => ({ ...pdf, tags: pdfTagsMap.get(pdf.id) ?? [] }))
      .filter(
        (pdf) =>
          !query ||
          pdf.name.toLowerCase().includes(query) ||
          pdf.tags.some((t) => t.name.toLowerCase().includes(query)),
      )
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
  }, [pdfs, pdfTagsMap, searchQuery])

  const tabCounts = useMemo(
    () => ({
      all: notes.filter((n) => !n.pdf_id).length + pdfs.length,
      individual: notes.filter((n) => !n.pdf_id).length,
      pdfs: pdfs.length,
    }),
    [notes, pdfs],
  )

  const TAB_DEFS: { id: TabId; label: string }[] = [
    { id: 'all', label: `All (${tabCounts.all})` },
    { id: 'individual', label: `Notes (${tabCounts.individual})` },
    { id: 'pdfs', label: `PDFs (${tabCounts.pdfs})` },
  ]

  const activeIndex = TAB_DEFS.findIndex((t) => t.id === activeTab)

  function makeTabContent(tabId: TabId) {
    const showNotes = tabId !== 'pdfs'
    const showPdfs = tabId !== 'individual'
    const isEmpty =
      showNotes &&
      processedNotes.length === 0 &&
      showPdfs &&
      processedPdfs.length === 0

    if (isLoading) {
      return <ExplorerSkeleton />
    }

    if (isEmpty) {
      return <ExplorerEmpty hasSearch={!!searchQuery} tabId={tabId} />
    }

    return (
      <div className="flex flex-col gap-0.5 py-2">
        {showNotes &&
          processedNotes.map((note) => (
            <NoteItem
              key={note.id}
              id={note.id}
              name={note.name}
              tags={note.tags}
              createdAt={note.created_at}
            />
          ))}
        {showPdfs &&
          processedPdfs.map((pdf) => (
            <NoteItem
              key={pdf.id}
              id={pdf.id}
              name={pdf.name}
              tags={pdf.tags}
              createdAt={pdf.created_at}
              pdfName={pdf.file_name}
            />
          ))}
      </div>
    )
  }

  return (
    <>
      <Header />

      <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-5">
        {/* Search */}
        <SearchBar
          ref={searchBarRef}
          value={searchQuery}
          onChange={setSearchQuery}
        />

        {/* New note trigger */}
        <AddNoteItem ref={addNoteItemRef} />

        {/* Tabs + list */}
        <Tabs
          tabs={TAB_DEFS.map((tab) => ({
            label: tab.label,
            content: makeTabContent(tab.id),
          }))}
          activeIndex={activeIndex}
          onChange={(i) => setActiveTab(TAB_DEFS[i].id)}
        />
      </div>
    </>
  )
}

// Sub-components

function ExplorerSkeleton() {
  return (
    <div className="flex flex-col gap-1 py-2 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-12 rounded-xl bg-(--q-green-pale)"
          style={{ opacity: 1 - i * 0.15 }}
        />
      ))}
    </div>
  )
}

interface ExplorerEmptyProps {
  hasSearch: boolean
  tabId: TabId
}

function ExplorerEmpty({ hasSearch, tabId }: ExplorerEmptyProps) {
  const message = hasSearch
    ? 'No results match your search'
    : tabId === 'pdfs'
      ? 'No PDFs yet'
      : tabId === 'individual'
        ? 'No notes yet'
        : 'Nothing here yet'

  const hint = hasSearch
    ? 'Try a different keyword or clear the search'
    : 'Create your first one above'

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
      <Text variant="caption" className="text-(--q-text-muted)">
        {message}
      </Text>
      <Text variant="caption" style={{ opacity: 0.55, fontSize: '0.75rem' }}>
        {hint}
      </Text>
    </div>
  )
}
