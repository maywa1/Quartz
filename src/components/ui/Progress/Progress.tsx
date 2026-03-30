import type { CSSProperties } from "react";
import { cn } from "../cn";
import "./Progress.css";

export interface ProgressProps {
  /** 0–100 */
  value: number;
  /** Accessible label for screen readers */
  label?: string;
  /** Show percentage text to the right of the label */
  showValue?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * Progress — horizontal bar tracking completion.
 *
 * @example
 * <Progress value={68} label="Chapter 5 — Sequences & Series" showValue />
 * <Progress value={100} label="Chapter 3 — Differentiation" showValue />
 */
export function Progress({
  value,
  label,
  showValue = false,
  className,
  style,
}: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("q-progress", className)} style={style}>
      {(label || showValue) && (
        <div className="q-progress__header">
          {label && <span className="q-progress__label">{label}</span>}
          {showValue && (
            <span className="q-progress__value" aria-hidden="true">
              {clamped}%
            </span>
          )}
        </div>
      )}
      <div
        className="q-progress__track"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="q-progress__fill"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
