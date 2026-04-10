import type { ReactNode } from 'react'
import type { SettingsNavItem } from './-components/SettingsNav'
import { AboutPanel } from './-components/AboutPanel'
import { ImportExportPanel } from './-components/ImportExportPanel'
import { Palette, Info, Download } from 'lucide-react'

// ── Panel registry ────────────────────────────────────────────
// To add a new settings panel:
//   1. Create a new Panel component in ./components/
//   2. Add a new entry here — nav item + panel component
//   3. Done. No other files need touching.

export interface SettingsPanelEntry {
  nav: SettingsNavItem
  panel: ReactNode
}

export const SETTINGS_PANELS: SettingsPanelEntry[] = [
  {
    nav: { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
    panel: null, // <AppearancePanel /> — add when ready
  },
  {
    nav: {
      id: 'import-export',
      label: 'Import / Export',
      icon: <Download size={16} />,
    },
    panel: <ImportExportPanel />,
  },
  {
    nav: { id: 'about', label: 'About', icon: <Info size={16} /> },
    panel: <AboutPanel />,
  },
]

export const DEFAULT_SETTINGS_PANEL_ID =
  SETTINGS_PANELS[0]?.nav.id ?? 'appearance'
