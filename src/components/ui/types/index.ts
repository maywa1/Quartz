import type { CSSProperties, ReactNode } from "react";

/** Sizes used consistently across interactive components */
export type Size = "sm" | "md" | "lg";

/** Variants for buttons and badges */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "icon";
export type BadgeVariant = "green" | "outline" | "muted";

/** Callout intent */
export type CalloutIntent = "info" | "warn";

/** Math block label type */
export type MathBlockLabel =
  | "Definition"
  | "Theorem"
  | "Lemma"
  | "Corollary"
  | "Proof"
  | "Equation"
  | "Identity"
  | "Remark"
  | "Example"
  | (string & Record<never, never>); // allow arbitrary strings while still suggesting common ones

/** Base props shared by most components */
export interface BaseProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/** Tab definition for the Tabs component */
export interface TabItem {
  label: string;
  content: ReactNode;
}

/** Note list item data shape */
export interface NoteItemData {
  title: string;
  tags?: string[];
  date?: string;
  active?: boolean;
  onClick?: () => void;
}
