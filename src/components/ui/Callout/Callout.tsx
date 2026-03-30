import type { ReactNode, CSSProperties } from "react";
import type { CalloutIntent } from "../types";
import { cn } from "../cn";
import "./Callout.css";

export interface CalloutProps {
  /** Semantic intent — controls color scheme */
  intent?: CalloutIntent;
  /** Icon rendered before the content. Defaults are provided per intent. */
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

const DEFAULT_ICONS: Record<CalloutIntent, string> = {
  info: "◈",
  warn: "△",
};

/**
 * Callout — highlighted informational or warning block.
 *
 * @example
 * <Callout intent="info">
 *   Use <Formula>\Sigma</Formula> to insert Greek letters quickly.
 * </Callout>
 *
 * <Callout intent="warn">
 *   This theorem requires continuity on the closed interval.
 * </Callout>
 */
export function Callout({
  intent = "info",
  icon,
  children,
  className,
  style,
}: CalloutProps) {
  const renderedIcon = icon ?? DEFAULT_ICONS[intent];

  return (
    <div
      className={cn("q-callout", `q-callout--${intent}`, className)}
      role={intent === "warn" ? "alert" : "note"}
      style={style}
    >
      {renderedIcon !== null && (
        <span className="q-callout__icon" aria-hidden="true">
          {renderedIcon}
        </span>
      )}
      <div className="q-callout__body">{children}</div>
    </div>
  );
}
