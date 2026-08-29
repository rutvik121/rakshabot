/**
 * Font size in `cqw` that keeps one line of text inside a width budget.
 *
 * Every artifact has a headline that must not wrap — a second line pushes the
 * whole composition out of a fixed frame. The model's copy varies in length far
 * more than a fixed size can absorb, so the size follows the text instead.
 *
 * 0.62 is the measured average glyph width of the display face in bold caps,
 * as a fraction of its font size.
 */
export function fitOneLine(text: string, maxCqw: number, budgetCqw = 84): number {
  return Math.min(maxCqw, budgetCqw / Math.max(text.length * 0.62, 1))
}
