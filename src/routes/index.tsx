import { createFileRoute } from '@tanstack/react-router'
import { NoteItem, Text, Tabs, SearchBar } from '#/components/ui'
import Header from '#/components/Header'

export const Route = createFileRoute('/')({ component: Explorer })

function Explorer() {
  const notes = [{title: "Euler's Edentity", tags:["Analysis"], date:"Today"},
                {title: "Euler's Edentity 2", tags:["Analysis"], date:"Today"}, ]
  return (<>
    <Header/>
    <div className="max-w-5xl mx-auto px-8 py-12 space-y-4">
      <SearchBar/>
      <Tabs tabs={[{label: "All", content: <></>},{label: "Individual", content: <></>}, {label: "PDF", content: <></>}]}/>
      <p className='q-section-label'>NOTES</p>
      <div className='cursor-pointer hover:underline'>
        <Text variant='caption'>Create a new note (Alt + N)</Text>
      </div>
      <div >
        {notes.map((note) => (
        <div className="border-b border-(--q-green-mid) py-2">
        <NoteItem
          title={note.title}
          tags={note.tags}
          date={note.date}
        />
        </div>
        ))}
      </div>
    </div>
    </>
  )
}
