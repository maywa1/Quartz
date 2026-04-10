import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useImperativeHandle,
  forwardRef,
} from 'react'
import type { KeyboardEvent, ChangeEvent } from 'react'
import { Tag as TagIcon, Plus, FileText, X } from 'lucide-react'
import { Button } from '#/components/ui'
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

export interface AddNoteItemHandle {
  expand: () => void
  collapse: () => void
}

interface AddNoteItemProps {
  className?: string
}

export const AddNoteItem = forwardRef<AddNoteItemHandle, AddNoteItemProps>(
  function AddNoteItemInner({ className }, ref) {
    const [expanded, setExpanded] = useState(false)
    const [title, setTitle] = useState('')
    const [tagInput, setTagInput] = useState('')
    const [tags, setTags] = useState<string[]>([])
    const [selectedPdf, setSelectedPdf] = useState<File | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const titleRef = useRef<HTMLInputElement>(null)

    useImperativeHandle(ref, () => ({
      expand: () => setExpanded(true),
      collapse: () => handleCancel(),
    }))

    const toast = useToast()
    const { data: allTags = [] } = useTags()
    const createNote = useCreateNote()
    const createPdf = useCreatePdf()
    const createTag = useCreateTag()
    const addTagToNote = useAddTagToNote()
    const addTagToPdf = useAddTagToPdf()

    // Focus title when expanding
    useEffect(() => {
      if (expanded) {
        setTimeout(() => titleRef.current?.focus(), 50)
      }
    }, [expanded])

    // Close on Escape
    useEffect(() => {
      function onKey(e: globalThis.KeyboardEvent) {
        if (e.key === 'Escape' && expanded) handleCancel()
      }
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }, [expanded])

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
      setExpanded(false)
      setTitle('')
      setTagInput('')
      setTags([])
      setSelectedPdf(null)
    }

    function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0]
      if (file) {
        setSelectedPdf(file)
        if (!title) setTitle(file.name.replace(/\.pdf$/i, ''))
      }
    }

    function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
      if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
        e.preventDefault()
        const next = tagInput.trim().replace(/,$/, '')
        if (next && !tags.includes(next)) setTags((prev) => [...prev, next])
        setTagInput('')
      }
      if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
        setTags((prev) => prev.slice(0, -1))
      }
    }

    async function handleSubmit() {
      if (!title.trim()) return
      const finalTags =
        tagInput.trim() && !tags.includes(tagInput.trim())
          ? [...tags, tagInput.trim()]
          : tags

      try {
        if (selectedPdf) {
          const pdfId = await createPdf.mutateAsync({
            name: title.trim(),
            file: selectedPdf,
          })
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
          toast.showSuccess(`PDF "${title.trim()}" created`)
        } else {
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
          toast.showSuccess(`Note "${title.trim()}" created`)
        }
        handleCancel()
      } catch {
        toast.showError(
          selectedPdf ? 'Failed to create PDF' : 'Failed to create note',
        )
      }
    }

    function handleTitleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSubmit()
      }
    }

    function removeTag(tag: string) {
      setTags((prev) => prev.filter((t) => t !== tag))
    }

    const isPending = createNote.isPending || createPdf.isPending

    // ── Collapsed trigger ──────────────────────────────────────
    if (!expanded) {
      return (
        <button
          className={cn('q-add-trigger', className)}
          onClick={() => setExpanded(true)}
          aria-label="Create new note"
        >
          <span className="q-add-trigger__icon">
            <Plus size={14} strokeWidth={2} />
          </span>
          <span className="q-add-trigger__label">New note</span>
          <kbd className="q-add-trigger__kbd">N</kbd>
        </button>
      )
    }

    // ── Expanded form ──────────────────────────────────────────
    return (
      <div
        className={cn('q-add-form', className)}
        role="dialog"
        aria-label="Create note"
      >
        {/* Title row */}
        <div className="q-add-form__title-row">
          <input
            ref={titleRef}
            className="q-add-form__title-input"
            placeholder={selectedPdf ? 'PDF title…' : 'Note title…'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleTitleKeyDown}
            aria-label="Title"
          />
          <button
            className="q-add-form__close"
            onClick={handleCancel}
            aria-label="Cancel"
            type="button"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>

        {/* Tags row */}
        <div className="q-add-form__tags-row">
          <TagIcon
            size={11}
            strokeWidth={1.75}
            className="q-add-form__tag-icon"
            aria-hidden="true"
          />

          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              className="q-add-form__tag-chip"
              onClick={() => removeTag(tag)}
              aria-label={`Remove tag ${tag}`}
            >
              {tag}
              <X size={9} strokeWidth={2.5} />
            </button>
          ))}

          <div className="q-add-form__tag-input-wrap">
            <input
              className="q-add-form__tag-input"
              placeholder={tags.length === 0 ? 'Add tags…' : ''}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              aria-label="Add tag"
            />
            {/* Suggestions dropdown */}
            {suggestions.length > 0 && (
              <div className="q-add-form__suggestions" role="listbox">
                {suggestions.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    role="option"
                    className="q-add-form__suggestion"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      setTags((prev) => [...prev, tag.name])
                      setTagInput('')
                    }}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {tags.length === 0 && !tagInput && (
            <span className="q-add-form__tag-hint" aria-hidden="true">
              Enter or , to confirm
            </span>
          )}
        </div>

        {/* PDF attachment indicator */}
        {selectedPdf && (
          <div className="q-add-form__pdf-chip">
            <FileText size={11} strokeWidth={1.75} />
            <span>{selectedPdf.name}</span>
            <button
              type="button"
              onClick={() => setSelectedPdf(null)}
              aria-label="Remove PDF"
            >
              <X size={10} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="q-add-form__actions">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
            type="button"
            leftIcon={<FileText size={13} />}
          >
            {selectedPdf ? 'Change PDF' : 'Attach PDF'}
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            aria-hidden="true"
          />

          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={!title.trim() || isPending}
            loading={isPending}
            type="button"
          >
            {selectedPdf ? 'Save PDF' : 'Create note'}
          </Button>
        </div>
      </div>
    )
  },
)
