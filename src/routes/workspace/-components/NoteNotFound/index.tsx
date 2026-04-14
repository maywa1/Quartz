import { Text } from '#/components/ui'
import { Sidebar } from '../Sidebar'

export function NoteNotFound() {
  return (
    <div className="h-screen flex">
      <Sidebar actions={[]} />

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
