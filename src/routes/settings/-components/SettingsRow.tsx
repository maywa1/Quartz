import type { ReactNode } from "react";

interface SettingsRowProps {
  label: string;
  description?: string;
  /** The control rendered on the right — Switch, Select, Button, etc. */
  children: ReactNode;
  /** Render the control below the label instead of to the right */
  stacked?: boolean;
}

/**
 * SettingsRow — a label + optional description on the left,
 * a control (Switch, Select, Button…) on the right.
 *
 * Pass `stacked` for tall controls like Input or Textarea.
 *
 * @example
 * <SettingsRow label="Auto-render LaTeX" description="Preview formulas as you type">
 *   <Switch />
 * </SettingsRow>
 *
 * <SettingsRow label="Display name" stacked>
 *   <Input placeholder="Your name" />
 * </SettingsRow>
 */
export function SettingsRow({
  label,
  description,
  children,
  stacked = false,
}: SettingsRowProps) {
  return (
    <div
      className={`
        flex rounded-xl px-4 py-3.5 transition-colors duration-150
        hover:bg-(--q-green-pale)
        ${stacked ? "flex-col gap-3" : "flex-row items-center justify-between gap-6"}
      `}
    >
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-sm font-normal text-(--q-text) leading-snug">
          {label}
        </span>
        {description && (
          <span className="text-xs text-(--q-text-muted) font-light leading-relaxed">
            {description}
          </span>
        )}
      </div>
      <div className={stacked ? "w-full" : "shrink-0"}>
        {children}
      </div>
    </div>
  );
}
