import { Card } from "#/components/ui"

const APP_VERSION = "0.1.0";
const BUILD_DATE = new Date().getFullYear();

interface StatItemProps {
  label: string;
  value: string;
}

function StatItem({ label, value }: StatItemProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-light text-[--q-text-muted]">{label}</span>
      <span className="text-sm font-medium text-[--q-green-deep] font-mono">
        {value}
      </span>
    </div>
  );
}

export function AboutPanel() {
  return (
    <div className="flex flex-col gap-6">

      {/* Identity */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[--q-green-pale] border border-[--q-border] flex items-center justify-center flex-shrink-0">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <polygon
              points="12,2 20,7 20,17 12,22 4,17 4,7"
              fill="var(--q-green-lite)"
              stroke="var(--q-green-deep)"
              strokeWidth="1.5"
            />
            <path
              d="M12 6v12M7 9l5 3 5-3"
              stroke="var(--q-green-deep)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-medium" style={{ fontFamily: "var(--q-font-serif)", color: "var(--q-green-deep)" }}>
            Quartz
          </h1>
          <p className="text-sm font-light text-[--q-text-muted]">
            Math note-taking, thoughtfully designed.
          </p>
        </div>
      </div>

      {/* Build info */}
      <Card variant="flat">
        <div className="grid grid-cols-3 gap-4">
          <StatItem label="Version" value={`v${APP_VERSION}`} />
          <StatItem label="Build" value="stable" />
          <StatItem label="Year" value={String(BUILD_DATE)} />
        </div>
      </Card>

      {/* Description */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-light text-[--q-text] leading-relaxed">
          Quartz is a calm environment for mathematical thinking — built for
          students, researchers, and anyone who works with formulas daily.
          Write notes, capture theorems, and organise your mathematical
          knowledge without distraction.
        </p>
        <p className="text-sm font-light text-[--q-text-muted] leading-relaxed">
          Built with React, TypeScript, and a deep respect for whitespace.
        </p>
      </div>

      {/* Links */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium tracking-widest uppercase text-[--q-green-deep] opacity-60 mb-1">
          Resources
        </p>
        {[
          { label: "Documentation", href: "#" },
          { label: "Changelog", href: "#" },
          { label: "Report an issue", href: "#" },
          { label: "Source code", href: "#" },
        ].map(({ label, href }) => (
          <a
            key={label}
            href={href}
            className="text-sm font-light text-[--q-green-deep] hover:underline underline-offset-4 w-fit transition-opacity hover:opacity-80"
          >
            {label} →
          </a>
        ))}
      </div>

      {/* Footer note */}
      <p className="text-xs text-[--q-text-muted] font-light pt-2 border-t border-[--q-border]">
        © {BUILD_DATE} Quartz. Made with care.
      </p>

    </div>
  );
}

