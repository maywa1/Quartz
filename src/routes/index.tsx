import { useState, useRef, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { NoteItem } from './-components/NoteItem'
import { AddNoteItem } from './-components/AddNoteItem'
import type { AddNoteItemHandle } from './-components/AddNoteItem'
import { SearchBar } from './-components/SearchBar'
import type { SearchBarHandle } from './-components/SearchBar'
import { TagFilter } from './-components/TagFilter'
import { ViewLaterToggle } from './-components/ViewLaterToggle'
import { ViewFilter } from './-components/ViewFilter'
import { Text } from '#/components/ui'
import Header from '#/components/Header'
import {
  useNotes,
  usePdfs,
  useAllNoteTags,
  useAllPdfTags,
  useTags,
} from '#/hooks'
import { useExplorerFilters } from './-components/useExplorer/useExplorerFilters'
import type { Tag } from '#/types/types'
import type {
  NoteWithTags,
  PdfWithTags,
} from './-components/useExplorer/useExplorer'

export const Route = createFileRoute('/')({
  component: Explorer,
})

type ViewId = 'all' | 'notes' | 'pdfs'

function Explorer() {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeView, setActiveView] = useState<ViewId>('all')
  const [tagFilter, setTagFilter] = useState<string[]>([])
  const [viewLaterFilter, setViewLaterFilter] = useState(false)
  const searchBarRef = useRef<SearchBarHandle>(null!)
  const addNoteItemRef = useRef<AddNoteItemHandle>(null!)

  const { data: notes = [], isLoading: notesLoading } = useNotes()
  const { data: pdfs = [], isLoading: pdfsLoading } = usePdfs()
  const { data: noteTagsMap = new Map<string, Tag[]>() } = useAllNoteTags()
  const { data: pdfTagsMap = new Map<string, Tag[]>() } = useAllPdfTags()
  const { data: allTags = [] } = useTags()

  const { processedNotes, processedPdfs } = useExplorerFilters(
    notes,
    pdfs,
    noteTagsMap,
    pdfTagsMap,
    searchQuery,
    tagFilter,
    viewLaterFilter,
  )

  const isLoading = notesLoading || pdfsLoading

  const noteCount = notes.filter((n) => !n.pdf_id).length
  const pdfCount = pdfs.length
  const hasFilters = !!(searchQuery || tagFilter.length > 0 || viewLaterFilter)

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

  function showNotes(tabId: ViewId): boolean {
    return tabId !== 'pdfs'
  }

  function showPdfs(tabId: ViewId): boolean {
    return tabId !== 'notes'
  }

  function isEmpty(tabId: ViewId): boolean {
    const notesEmpty = !showNotes(tabId) || processedNotes.length === 0
    const pdfsEmpty = !showPdfs(tabId) || processedPdfs.length === 0
    return notesEmpty && pdfsEmpty
  }

  return (
    <>
      <Header />

      <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-5">
        <SearchSection
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          tagFilter={tagFilter}
          onTagFilterChange={setTagFilter}
          viewLaterFilter={viewLaterFilter}
          onViewLaterFilterChange={setViewLaterFilter}
          activeView={activeView}
          onViewChange={setActiveView}
          allTags={allTags}
          searchBarRef={searchBarRef}
          noteCount={noteCount}
          pdfCount={pdfCount}
        />

        <AddNoteItem ref={addNoteItemRef} />

        <hr className='text-(--q-border)'/>

        {isLoading ? (
          <ExplorerSkeleton />
        ) : isEmpty(activeView) ? (
          <ExplorerEmpty
            hasSearch={!!searchQuery}
            hasFilters={hasFilters}
            view={activeView}
          />
        ) : (
          <ExplorerList
            view={activeView}
            notes={processedNotes}
            pdfs={processedPdfs}
            viewLaterFilter={viewLaterFilter}
          />
        )}
      </div>
    </>
  )
}

interface SearchSectionProps {
  searchQuery: string
  onSearchChange: (q: string) => void
  tagFilter: string[]
  onTagFilterChange: (tags: string[]) => void
  viewLaterFilter: boolean
  onViewLaterFilterChange: (v: boolean) => void
  activeView: ViewId
  onViewChange: (v: ViewId) => void
  allTags: Tag[]
  searchBarRef: React.RefObject<SearchBarHandle>
  noteCount: number
  pdfCount: number
}

function SearchSection({
  searchQuery,
  onSearchChange,
  tagFilter,
  onTagFilterChange,
  viewLaterFilter,
  onViewLaterFilterChange,
  activeView,
  onViewChange,
  allTags,
  searchBarRef,
  noteCount,
  pdfCount,
}: SearchSectionProps) {
  function handleToggleTag(tagId: string) {
    onTagFilterChange(
      tagFilter.includes(tagId)
        ? tagFilter.filter((t) => t !== tagId)
        : [...tagFilter, tagId],
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <SearchBar
        ref={searchBarRef}
        value={searchQuery}
        onChange={onSearchChange}
      />
      <div className="flex items-center gap-3">
        <TagFilter
          allTags={allTags}
          selectedTagIds={tagFilter}
          onToggleTag={handleToggleTag}
        />
        <ViewLaterToggle
          active={viewLaterFilter}
          onToggle={onViewLaterFilterChange}
        />
        <ViewFilter
          value={activeView}
          onChange={onViewChange}
          noteCount={noteCount}
          pdfCount={pdfCount}
        />
      </div>
    </div>
  )
}

interface ExplorerListProps {
  view: ViewId
  notes: NoteWithTags[]
  pdfs: PdfWithTags[]
  viewLaterFilter: boolean
}

function ExplorerList({
  view,
  notes,
  pdfs,
  viewLaterFilter,
}: ExplorerListProps) {
  return (
    <div className="flex flex-col gap-0.5">
      {view !== 'pdfs' &&
        notes.map((note) => (
          <NoteItem
            key={note.id}
            id={note.id}
            name={note.name}
            tags={note.tags}
            createdAt={note.created_at}
          />
        ))}
      {view !== 'notes' &&
        pdfs.map((pdf) => (
          <NoteItem
            key={pdf.id}
            id={pdf.id}
            name={pdf.name}
            tags={pdf.tags}
            createdAt={pdf.created_at}
            pdfName={pdf.file_name}
            filterViewLater={viewLaterFilter}
          />
        ))}
    </div>
  )
}

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
  hasFilters: boolean
  view: ViewId
}

function ExplorerEmpty({ hasSearch, hasFilters, view }: ExplorerEmptyProps) {
  const message =
    hasSearch || hasFilters
      ? 'No results match your search'
      : view === 'pdfs'
        ? 'No PDFs yet'
        : view === 'notes'
          ? 'No notes yet'
          : 'Nothing here yet'

  const hint =
    hasSearch || hasFilters
      ? 'Try a different keyword or clear filters'
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
