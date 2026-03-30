/**
 * Lightweight className utility — merges truthy strings.
 * Drop-in for clsx/classnames without the dependency.
 * For Tailwind users, swap this body with `clsx` + `tailwind-merge` if needed.
 */
export function cn(
  ...classes: Array<string | boolean | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}
