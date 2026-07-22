/** Display formatting for money. All money renders with `$` and thousands
 * separators, tabular-aligned (PRD §11). Values are rounded to whole dollars. */

export function formatMoney(n: number): string {
  return `$${Math.round(n).toLocaleString('en-US')}`
}

/** Signed money using a true minus sign, e.g. "−$297,000" / "+$10,000". */
export function formatSignedMoney(n: number): string {
  const rounded = Math.round(n)
  const sign = rounded < 0 ? '−' : rounded > 0 ? '+' : ''
  return `${sign}$${Math.abs(rounded).toLocaleString('en-US')}`
}
