import { LayoutGrid } from 'lucide-react'
import { cn } from '#/components/ui/cn'
import './ViewFilter.css'

export interface ViewFilterProps {
  value: 'all' | 'notes' | 'pdfs'
  onChange: (value: 'all' | 'notes' | 'pdfs') => void
  noteCount: number
  pdfCount: number
  className?: string
}

export function ViewFilter({
  value,
  onChange,
  noteCount,
  pdfCount,
  className,
}: ViewFilterProps) {
  const totalCount = noteCount + pdfCount

  const options = [
    { id: 'all', label: `All`, count: totalCount },
    { id: 'notes', label: `Notes`, count: noteCount },
    { id: 'pdfs', label: `PDFs`, count: pdfCount },
  ] as const

  return (
    <div className={cn('q-view-filter', className)} role="tablist">
      <span className='text-(--q-green-mid)'>I</span>
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          role="tab"
          aria-selected={value === opt.id}
          className={cn(
            'q-view-filter__tab',
            value === opt.id && 'q-view-filter__tab--active',
          )}
          onClick={() => onChange(opt.id)}
        >
          <span className="q-view-filter__label">{opt.label}</span>
          <span className="q-view-filter__count">{opt.count}</span>
        </button>
      ))}
    </div>
  )
}
