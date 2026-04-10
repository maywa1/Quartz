import { useState } from "react";
import { SettingsNav } from "./-components/SettingsNav";
import { Text } from "#/components/ui";
import { SETTINGS_PANELS, DEFAULT_SETTINGS_PANEL_ID } from "./settings.config";

/**
 * SettingsLayout — the two-column shell used by the /settings route.
 *
 * Left  → SettingsNav (sidebar)
 * Right → active panel content
 *
 * State is local. If you need the active panel to be URL-driven
 * (deep-linkable), replace useState with a TanStack Router search param:
 *
 *   const { panel } = Route.useSearch()
 *   const navigate = useNavigate()
 *   // then pass panel / (id) => navigate({ search: { panel: id } })
 */
export function SettingsLayout() {
  const [activeId, setActiveId] = useState(DEFAULT_SETTINGS_PANEL_ID);

  const navItems = SETTINGS_PANELS.map((p) => p.nav);
  const activeEntry = SETTINGS_PANELS.find((p) => p.nav.id === activeId);
  const activeLabel = activeEntry?.nav.label ?? "";
  const activePanel = activeEntry?.panel;

  return (
    <div className="flex gap-10 min-h-screen">

      {/* ── Sidebar ──────────────────────────── */}
      <aside className="w-48 flex-shrink-0 pt-1">
        <SettingsNav
          items={navItems}
          activeId={activeId}
          onSelect={setActiveId}
        />
      </aside>

      {/* ── Main panel ───────────────────────── */}
      <main className="flex-1 min-w-0" aria-live="polite">
        {/* Panel heading */}
        <div className="mb-8">
          <Text variant="heading">{activeLabel}</Text>
        </div>

        {/* Panel content or empty state */}
        {activePanel ?? (
          <EmptyPanel label={activeLabel} />
        )}
      </main>

    </div>
  );
}

// ── Empty state shown for panels not yet built ────────────────

interface EmptyPanelProps {
  label: string;
}

function EmptyPanel({ label }: EmptyPanelProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 rounded-2xl border border-dashed border-(--q-border)">
      <div className="w-10 h-10 rounded-xl bg-(--q-green-pale) flex items-center justify-center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--q-green-deep)" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </div>
      <p className="text-sm text-(--q-text-muted) font-light">
        {label} settings coming soon.
      </p>
    </div>
  );
}

