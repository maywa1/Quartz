import { useState, useMemo } from 'react'
import {
  useTags,
  useCreateTag,
  useAddTagToNote,
  useRemoveTagFromNote,
  useAddTagToPdf,
  useRemoveTagFromPdf,
} from '#/hooks'
import type { Tag } from '#/types/types'

interface UseNoteItemTagsOptions {
  id: string
  tags: Tag[]
  isPdf: boolean
}

export function useNoteItemTags({ id, tags, isPdf }: UseNoteItemTagsOptions) {
  const [newTagName, setNewTagName] = useState('')

  const { data: allTags = [] } = useTags()
  const createTag = useCreateTag()
  const addTagToNote = useAddTagToNote()
  const removeTagFromNote = useRemoveTagFromNote()
  const addTagToPdf = useAddTagToPdf()
  const removeTagFromPdf = useRemoveTagFromPdf()

  const selectedTagIds = useMemo(() => new Set(tags.map((t) => t.id)), [tags])

  async function toggleTag(tag: Tag) {
    const has = selectedTagIds.has(tag.id)
    try {
      if (isPdf) {
        has
          ? await removeTagFromPdf.mutateAsync({ tagId: tag.id, pdfId: id })
          : await addTagToPdf.mutateAsync({ tagId: tag.id, pdfId: id })
      } else {
        has
          ? await removeTagFromNote.mutateAsync({ tagId: tag.id, noteId: id })
          : await addTagToNote.mutateAsync({ tagId: tag.id, noteId: id })
      }
    } catch {
      /* errors handled by mutation */
    }
  }

  async function createAndAttach() {
    if (!newTagName.trim()) return
    try {
      const tagId = await createTag.mutateAsync(newTagName.trim())
      if (isPdf) await addTagToPdf.mutateAsync({ tagId, pdfId: id })
      else await addTagToNote.mutateAsync({ tagId, noteId: id })
      setNewTagName('')
    } catch {
      /* errors handled by mutation */
    }
  }

  return {
    allTags,
    selectedTagIds,
    newTagName,
    setNewTagName,
    toggleTag,
    createAndAttach,
  }
}
