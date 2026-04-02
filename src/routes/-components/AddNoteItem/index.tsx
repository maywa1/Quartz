import {
  useState,
  useRef,
  useEffect,
  useMemo,
  type KeyboardEvent,
  type ChangeEvent,
} from 'react'
import { Tag as TagIcon, Plus, FileText } from 'lucide-react'
import { Button, Badge } from '#/components/ui'
import { cn } from '#/components/ui/cn'
import {
  useCreateNote,
  useCreatePdf,
  useTags,
  useCreateTag,
  useAddTagToNote,
  useAddTagToPdf,
} from '#/hooks'
import { useToast } from '#/providers'
import './AddNoteItem.css'

interface AddNoteItemProps {
  className?: string
}

export function AddNoteItem({ className }: AddNoteItemProps) {
  const [title, setTitle] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [selectedPdf, setSelectedPdf] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  const toast = useToast()

  const { data: allTags = [] } = useTags()
  const createNote = useCreateNote()
  const createPdf = useCreatePdf()
  const createTag = useCreateTag()
  const addTagToNote = useAddTagToNote()
  const addTagToPdf = useAddTagToPdf()

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  const suggestions = useMemo(() => {
    if (!tagInput.trim()) return []
    const input = tagInput.toLowerCase()
    return allTags
      .filter(
        (t) => t.name.toLowerCase().includes(input) && !tags.includes(t.name),
      )
      .slice(0, 5)
  }, [allTags, tagInput, tags])

  function handleCancel() {
    setTitle('')
    setTagInput('')
    setTags([])
    setSelectedPdf(null)
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedPdf(file)
      if (!title) {
        setTitle(file.name.replace(/\.pdf$/i, ''))
      }
    }
  }

  function handleAddPdf() {
    fileInputRef.current?.click()
  }

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault()
      const next = tagInput.trim().replace(/,$/, '')
      if (next && !tags.includes(next)) {
        setTags((prev) => [...prev, next])
      }
      setTagInput('')
    }

    if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1))
    }
  }

  async function handleAddNote() {
    if (!title.trim()) return

    try {
      const finalTags =
        tagInput.trim() && !tags.includes(tagInput.trim())
          ? [...tags, tagInput.trim()]
          : tags

      const noteId = await createNote.mutateAsync({
        name: title.trim(),
        pdfId: null,
      })

      for (const tagName of finalTags) {
        let tag = allTags.find(
          (t) => t.name.toLowerCase() === tagName.toLowerCase(),
        )
        if (!tag) {
          const id = await createTag.mutateAsync(tagName)
          tag = { id, name: tagName, created_at: new Date().toISOString() }
        }
        await addTagToNote.mutateAsync({ tagId: tag.id, noteId })
      }

      toast.showSuccess(`Note "${title.trim()}" created successfully`)
      handleCancel()
    } catch (error) {
      toast.showError('Failed to create note')
    }
  }

  async function handleCreatePdf() {
    if (!selectedPdf || !title.trim()) return

    try {
      console.log('Creating PDF with name:', title.trim())
      const pdfId = await createPdf.mutateAsync({
        name: title.trim(),
        file: selectedPdf,
      })
      console.log('PDF created with id:', pdfId)

      const finalTags =
        tagInput.trim() && !tags.includes(tagInput.trim())
          ? [...tags, tagInput.trim()]
          : tags

      for (const tagName of finalTags) {
        let tag = allTags.find(
          (t) => t.name.toLowerCase() === tagName.toLowerCase(),
        )
        if (!tag) {
          const id = await createTag.mutateAsync(tagName)
          tag = { id, name: tagName, created_at: new Date().toISOString() }
        }
        await addTagToPdf.mutateAsync({ tagId: tag.id, pdfId })
      }

      toast.showSuccess(`PDF "${title.trim()}" created successfully`)
      handleCancel()
    } catch (error) {
      console.error('Failed to create PDF:', error)
      toast.showError('Failed to create PDF')
    }
  }

  function handleTitleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddNote()
    }
    if (e.key === 'Escape') handleCancel()
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  const isPending = createNote.isPending || createPdf.isPending

  return (
    <div className={cn('q-add-note-item q-add-note-item--expanded', className)}>
      <div className="q-add-note-item__form">
        <input
          ref={titleRef}
          className="q-add-note-item__input"
          placeholder="Note title…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleTitleKeyDown}
        />

        <div className="q-add-note-item__tags-row">
          <TagIcon
            size={12}
            strokeWidth={1.75}
            style={{ color: 'var(--q-text-muted)', flexShrink: 0 }}
          />

          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="green"
              className="q-note-item__tag"
              style={{ cursor: 'pointer' }}
              onClick={() => removeTag(tag)}
            >
              {tag}
            </Badge>
          ))}

          {tagInput && suggestions.length > 0 && (
            <div className="q-add-note-item__suggestions">
              {suggestions.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  className="q-add-note-item__suggestion"
                  onClick={() => {
                    setTags((prev) => [...prev, tag.name])
                    setTagInput('')
                  }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}

          <input
            className="q-add-note-item__tag-input"
            placeholder={tags.length === 0 ? 'Add tags…' : ''}
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
          />

          {tags.length === 0 && !tagInput && (
            <span className="q-add-note-item__tag-hint">
              Enter or , to confirm
            </span>
          )}
        </div>

        <div className="q-add-note-item__actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddPdf}
            disabled={isPending}
            type="button"
          >
            <FileText size={14} style={{ marginRight: '0.35rem' }} />
            {selectedPdf ? selectedPdf.name : 'Add PDF'}
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <Button
            variant="primary"
            size="sm"
            onClick={selectedPdf ? handleCreatePdf : handleAddNote}
            disabled={!title.trim() || isPending}
            type="button"
          >
            <Plus size={14} style={{ marginRight: '0.35rem' }} />
            {selectedPdf ? 'Save PDF' : 'Add note'}
          </Button>
        </div>
      </div>
    </div>
  )
}
