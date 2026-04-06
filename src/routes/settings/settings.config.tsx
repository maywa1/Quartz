import type { ReactNode } from "react";
import type { SettingsNavItem } from "./-components/SettingsNav";
import { AboutPanel } from "./-components/AboutPanel";

// ── Icons ─────────────────────────────────────────────────────
// Using inline SVGs — swap for your icon library (lucide-react, etc.)

function IconAppearance() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="3" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" />
    </svg>
  );
}

function IconEditor() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 4h12M2 8h8M2 12h5" />
    </svg>
  );
}

function IconNotifications() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M8 1a5 5 0 0 1 5 5v3l1 2H2l1-2V6a5 5 0 0 1 5-5z" />
      <path d="M6.5 13.5a1.5 1.5 0 0 0 3 0" />
    </svg>
  );
}

function IconKeyboard() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="1" y="4" width="14" height="9" rx="1.5" />
      <path d="M4 8h1M7.5 8h1M11 8h1M4 11h8" />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="7" />
      <path d="M8 7v4M8 5v.5" />
    </svg>
  );
}

// ── Panel registry ────────────────────────────────────────────
// To add a new settings panel:
//   1. Create a new Panel component in ./components/
//   2. Add a new entry here — nav item + panel component
//   3. Done. No other files need touching.

export interface SettingsPanelEntry {
  nav: SettingsNavItem;
  panel: ReactNode;
}

export const SETTINGS_PANELS: SettingsPanelEntry[] = [
  {
    nav: { id: "appearance", label: "Appearance", icon: <IconAppearance /> },
    panel: null, // <AppearancePanel /> — add when ready
  },
  {
    nav: { id: "editor", label: "Editor", icon: <IconEditor /> },
    panel: null, // <EditorPanel />
  },
  {
    nav: { id: "notifications", label: "Notifications", icon: <IconNotifications /> },
    panel: null, // <NotificationsPanel />
  },
  {
    nav: { id: "shortcuts", label: "Shortcuts", icon: <IconKeyboard /> },
    panel: null, // <ShortcutsPanel />
  },
  {
    nav: { id: "about", label: "About", icon: <IconInfo /> },
    panel: <AboutPanel />,
  },
];

export const DEFAULT_SETTINGS_PANEL_ID = SETTINGS_PANELS[0]?.nav.id ?? "appearance";

