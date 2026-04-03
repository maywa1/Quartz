import { Text } from '#/components/ui'

export function NoteNotFound() {
  return (
    <div className="quartz h-full flex items-center justify-center">
      <div className="text-center">
        <Text variant="body" className="text-q-text">
          Document not found
        </Text>
      </div>
    </div>
  )
}
