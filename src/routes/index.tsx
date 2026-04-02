import { useState, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { NoteItem } from './-components/NoteItem'
import { AddNoteItem } from './-components/AddNoteItem'
import { SearchBar } from './-components/SearchBar'
import { Tabs, Text, Divider } from '#/components/ui'
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

  const { data: notes = [], isLoading: notesLoading } = useNotes()
  const { data: pdfs = [], isLoading: pdfsLoading } = usePdfs()
  const { data: noteTagsMap = new Map() } = useAllNoteTags()
  const { data: pdfTagsMap = new Map() } = useAllPdfTags()

  const processedNotes = useMemo((): NoteWithTags[] => {
    return notes
      .filter((n) => !n.pdf_id)
      .map((note) => ({
        ...note,
        tags: noteTagsMap.get(note.id) || [],
      }))
      .filter((note) => {
        if (!searchQuery.trim()) return true
        const query = searchQuery.toLowerCase()
        return (
          note.name.toLowerCase().includes(query) ||
          note.tags.some((t: Tag) => t.name.toLowerCase().includes(query))
        )
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
  }, [notes, noteTagsMap, searchQuery])

  const processedPdfs = useMemo((): PdfWithTags[] => {
    return pdfs
      .map((pdf) => ({
        ...pdf,
        tags: pdfTagsMap.get(pdf.id) || [],
      }))
      .filter((pdf) => {
        if (!searchQuery.trim()) return true
        const query = searchQuery.toLowerCase()
        return (
          pdf.name.toLowerCase().includes(query) ||
          pdf.tags.some((t: Tag) => t.name.toLowerCase().includes(query))
        )
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
  }, [pdfs, pdfTagsMap, searchQuery])

  const isLoading = notesLoading || pdfsLoading
  const showNoResults = (tabId: string) => {
    if (tabId === 'all') {
      return processedNotes.length === 0 && processedPdfs.length === 0
    }
    if (tabId === 'individual') {
      return processedNotes.length === 0
    }
    return processedPdfs.length === 0
  }

  const tabCounts = useMemo(() => {
    return {
      all: notes.filter((n) => !n.pdf_id).length + pdfs.length,
      individual: notes.filter((n) => !n.pdf_id).length,
      pdfs: pdfs.length,
    }
  }, [notes, pdfs])

  const tabs = [
    { id: 'all' as TabId, label: `All (${tabCounts.all})` },
    {
      id: 'individual' as TabId,
      label: `Notes (${tabCounts.individual})`,
    },
    { id: 'pdfs' as TabId, label: `PDFs (${tabCounts.pdfs})` },
  ]

  return (
    <>
      <Header />
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search notes and PDFs..."
        />

        <AddNoteItem />

        <Divider />

        <Tabs
          tabs={tabs.map((tab) => ({
            label: tab.label,
            content: (
              <div className="py-4 space-y-1">
                {isLoading ? (
                  <div className="py-8 text-center">
                    <Text variant="caption" className="q-text--muted">
                      Loading...
                    </Text>
                  </div>
                ) : showNoResults(tab.id) ? (
                  <div className="py-8 text-center">
                    <Text variant="caption" className="q-text--muted">
                      {searchQuery
                        ? 'No results match your search'
                        : tab.id === 'all'
                          ? 'No notes or PDFs yet. Create your first one above!'
                          : tab.id === 'individual'
                            ? 'No notes yet'
                            : 'No PDFs yet'}
                    </Text>
                  </div>
                ) : (
                  <>
                    {tab.id !== 'pdfs' &&
                      processedNotes.map((note) => (
                        <NoteItem
                          key={note.id}
                          name={note.name}
                          tags={note.tags}
                          createdAt={note.created_at}
                          onClick={() =>
                            console.log('Navigate to note:', note.id)
                          }
                        />
                      ))}
                    {tab.id !== 'individual' &&
                      processedPdfs.map((pdf) => (
                        <NoteItem
                          key={pdf.id}
                          name={pdf.name}
                          tags={pdf.tags}
                          createdAt={pdf.created_at}
                          pdfName={pdf.file_name}
                          onClick={() =>
                            console.log('Navigate to PDF:', pdf.id)
                          }
                        />
                      ))}
                  </>
                )}
              </div>
            ),
          }))}
          activeIndex={tabs.findIndex((t) => t.id === activeTab)}
          onChange={(index) => setActiveTab(tabs[index].id)}
        />
      </div>
    </>
  )
}
