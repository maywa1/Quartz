import type { KeyboardEvent } from "react";
import { cn } from "#/components/ui/cn";
import { Badge } from "#/components/ui";
import "./NoteItem.css";

export interface NoteItemProps {
  title: string;
  tags?: string[];
  date?: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * NoteItem — sidebar list row representing a single note.
 *
 * @example
 * <NoteItem
 *   title="Euler's Identity"
 *   tags={["Analysis"]}
 *   date="Today"
 *   active
 *   onClick={() => navigate("/notes/1")}
 * />
 */
export function NoteItem({
  title,
  tags = [],
  date,
  active = false,
  onClick,
  className,
}: NoteItemProps) {
  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-current={active ? "page" : undefined}
      className={cn("q-note-item", active && "q-note-item--active", className)}
      onClick={onClick}
      onKeyDown={handleKeyDown}
    >
      <span className="q-note-item__title">{title}</span>
      {(tags.length > 0 || date) && (
        <div className="q-note-item__meta">
          {tags.map((tag) => (
            <Badge key={tag} variant="green" className="q-note-item__tag">
              {tag}
            </Badge>
          ))}
          {date && <span className="q-note-item__date">{date}</span>}
        </div>
      )}
    </div>
  );
}
