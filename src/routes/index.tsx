import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { NoteItem } from './-components/NoteItem'
import { AddNoteItem } from './-components/AddNoteItem'
import { SearchBar } from './-components/SearchBar'
import { Tabs } from '#/components/ui'
import Header from '#/components/Header'

export const Route = createFileRoute('/')({ component: Explorer })

function Explorer() {
  const [notes, setNotes] = useState([
    { title: "Euler's Identity", tags: ['Analysis'], date: 'Today' },
  ]);

  function handleAdd({ title, tags }: { title: string; tags: string[] }) {
    setNotes((prev) => [{ title, tags, date: 'Today' }, ...prev]);
  }

  return (
    <>
      <Header />
      <div className="max-w-5xl mx-auto px-8 py-8jspace-y-4">
        <SearchBar />

        <AddNoteItem onAdd={handleAdd} />
        <Tabs
          tabs={[
            { label: 'All', content: <></> },
            { label: 'Individual', content: <></> },
            { label: 'PDF', content: <></> },
          ]}/>
        <div>
        <p className="q-section-label">NOTES</p>
          {notes.map((note, idx) => (
            <div key={idx} className="border-b border-(--q-green-mid) py-2">
              <NoteItem title={note.title} tags={note.tags} date={note.date} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
