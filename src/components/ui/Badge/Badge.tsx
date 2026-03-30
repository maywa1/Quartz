import type { CSSProperties, ReactNode } from "react";
import type { BadgeVariant } from "../types";
import { cn } from "../cn";
import "./Badge.css";

export interface BadgeProps {
  /** Visual style of the badge */
  variant?: BadgeVariant;
  /** Content inside the badge */
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/**
 * Badge — compact label for tags, topics, and status.
 *
 * @example
 * <Badge variant="green">Calculus</Badge>
 * <Badge variant="outline">Draft</Badge>
 * <Badge variant="muted">Archived</Badge>
 */
export function Badge({
  variant = "green",
  children,
  className,
  style,
}: BadgeProps) {
  return (
    <span
      className={cn("q-badge", `q-badge--${variant}`, className)}
      style={style}
    >
      {children}
    </span>
  );
}
