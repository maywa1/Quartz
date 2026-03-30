import type { ReactNode, CSSProperties } from "react";
import type { MathBlockLabel } from "../types";
import { cn } from "../cn";
import "./MathBlock.css";

export interface MathBlockProps {
  /** Semantic label shown above the expression */
  label?: MathBlockLabel;
  /** The mathematical expression — plain text, Unicode, or LaTeX string */
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * MathBlock — a left-bordered display block for mathematical expressions.
 *
 * Renders content in monospace. Pair with a LaTeX renderer (KaTeX, MathJax)
 * by passing the rendered output as children.
 *
 * @example
 * <MathBlock label="Identity">e^(iπ) + 1 = 0</MathBlock>
 *
 * <MathBlock label="Definition">
 *   lim(n→∞) (1 + 1/n)ⁿ = e ≈ 2.71828...
 * </MathBlock>
 */
export function MathBlock({ label, children, className, style }: MathBlockProps) {
  return (
    <figure
      className={cn("q-math-block", className)}
      style={style}
      aria-label={label ? `${label}: ${typeof children === "string" ? children : ""}` : undefined}
    >
      {label && (
        <figcaption className="q-math-block__label">{label}</figcaption>
      )}
      <div className="q-math-block__expr">{children}</div>
    </figure>
  );
}

/* ── Inline formula chip ──────────────────────────────────── */

export interface FormulaProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * Formula — inline monospace chip for short expressions within prose.
 *
 * @example
 * <p>
 *   The function <Formula>f(x)</Formula> is continuous on{" "}
 *   <Formula>[a, b]</Formula>.
 * </p>
 */
export function Formula({ children, className, style }: FormulaProps) {
  return (
    <code className={cn("q-formula", className)} style={style}>
      {children}
    </code>
  );
}
