import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Tag } from "lucide-react";
import { Button, Badge } from "#/components/ui";
import { cn } from "#/components/ui/cn";
import "./AddNoteItem.css";

export interface AddNoteItemProps {
  onAdd?: (note: { title: string; tags: string[] }) => void;
  className?: string;
}

export function AddNoteItem({ onAdd, className }: AddNoteItemProps) {
  const [title, setTitle] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  function handleCancel() {
    setTitle("");
    setTagInput("");
    setTags([]);
  }

  function handleAddPdf() {
  }

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const next = tagInput.trim().replace(/,$/, "");
      if (next && !tags.includes(next)) {
        setTags((prev) => [...prev, next]);
      }
      setTagInput("");
    }

    if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  }

  function handleAdd() {
    if (!title.trim()) return;

    const finalTags =
      tagInput.trim() && !tags.includes(tagInput.trim())
        ? [...tags, tagInput.trim()]
        : tags;

    onAdd?.({ title: title.trim(), tags: finalTags });
    handleCancel();
  }

  function handleTitleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
    if (e.key === "Escape") handleCancel();
  }

  return (
    <div className={cn("q-add-note-item q-add-note-item--expanded", className)}>
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
          <Tag
            size={12}
            strokeWidth={1.75}
            style={{ color: "var(--q-text-muted)", flexShrink: 0 }}
          />

          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="green"
              className="q-note-item__tag"
              onClick={() =>
                setTags((prev) => prev.filter((t) => t !== tag))
              }
              style={{ cursor: "pointer" }}
            >
              {tag}
            </Badge>
          ))}

          <input
            className="q-add-note-item__tag-input"
            placeholder={tags.length === 0 ? "Add tags…" : ""}
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
          />

          {tags.length === 0 && (
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
            type="button"
          >
            Add Pdf
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleAdd}
            disabled={!title.trim()}
            type="button"
          >
            Add note
          </Button>
        </div>
      </div>
    </div>
  );
}
