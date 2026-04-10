import type { ReactNode } from "react";
import { Divider } from "#/components/ui";

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  /** Suppress the top divider — use on the first section */
  first?: boolean;
}

/**
 * SettingsSection — a titled, divided region within a settings panel.
 * Add new sections by composing this component with SettingsRow children.
 *
 * @example
 * <SettingsSection title="Appearance" description="Customise how Quartz looks.">
 *   <SettingsRow label="Theme" description="Light or dark interface">
 *     <Select ... />
 *   </SettingsRow>
 * </SettingsSection>
 */
export function SettingsSection({
  title,
  description,
  children,
  first = false,
}: SettingsSectionProps) {
  return (
    <section aria-labelledby={`section-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      {!first && <Divider />}
      <div className="mb-5">
        <h2
          id={`section-${title.toLowerCase().replace(/\s+/g, "-")}`}
          className="text-sm font-medium tracking-widest uppercase text-(--q-green-deep) opacity-60"
        >
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-(--q-text-muted) font-light leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1">{children}</div>
    </section>
  );
}
