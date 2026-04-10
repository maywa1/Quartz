import { Text } from '#/components/ui'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'

export function NoteNotFound() {
  const navigate = useNavigate()

  return (
    <div className="h-screen flex">
      <div className="w-14 border-r border-(--q-border) bg-(--q-bg) flex flex-col py-4">
        <button
          onClick={() => navigate({ to: '/' })}
          className="group flex items-center justify-center w-10 h-10 mx-auto mb-2 text-(--q-text-muted) hover:text-(--q-text) hover:bg-(--q-green-pale) rounded-md transition-colors relative"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="absolute left-full ml-2 px-2 py-1 text-xs text-(--q-text) bg-(--q-bg-secondary) border border-(--q-border) rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
            Back
          </span>
        </button>
      </div>

      <div className="quartz flex-1 flex items-center justify-center">
        <div className="text-center">
          <Text variant="display" className="text-q-text">
            Waiting for a note :)
          </Text>
        </div>
      </div>
    </div>
  )
}
