import type { HTMLAttributes } from "react";
import { cn } from "../cn";
import "./Card.css";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** `elevated` has a subtle shadow + hover lift; `flat` uses a tinted surface with no shadow */
  variant?: "elevated" | "flat";
  /** Remove the default padding */
  noPadding?: boolean;
}

/**
 * Card — a contained surface for grouped content.
 *
 * @example
 * <Card>
 *   <Text as="h3" variant="heading">Euler's Identity</Text>
 *   <Text>e^(iπ) + 1 = 0</Text>
 * </Card>
 *
 * <Card variant="flat">...</Card>
 */
export function Card({
  variant = "elevated",
  noPadding = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        "q-card",
        `q-card--${variant}`,
        noPadding && "q-card--no-padding",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
