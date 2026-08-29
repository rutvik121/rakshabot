/**
 * Trimming copy to fit a fixed card.
 *
 * Every artifact is a fixed 1080×1350 frame, so an over-long string is a layout
 * break rather than a wrapped line. Cutting on a word boundary alone still
 * leaves copy that reads as unfinished, so this prefers a clause boundary and
 * then drops trailing function words.
 */
/** Words that read as unfinished when a trim happens to land on them. */
const DANGLING =
  /[\s,;:]+(and|or|but|the|a|an|of|to|with|for|on|in|at|my|his|her|their|its|every|some|any|very|really|just|no|not|never|is|are|was|were|has|have|had|been|being|do|does|did|can|will|would|about|into|from|than|then|that|this|these|those|over|under|when|while|because|so)$/i

/**
 * Trims to a limit on a word boundary, then drops a trailing function word.
 *
 * Cutting on a word boundary alone still leaves copy like "every single." —
 * technically whole words, but visibly unfinished.
 */
export function clamp(value: string, max: number): string {
  const s = value.trim()
  if (s.length <= max) return s
  const cut = s.slice(0, max)

  /*
   * Prefer a clause boundary. Cutting "…without asking, every single time" at a
   * word boundary yields "…every single", which reads as broken; cutting at the
   * comma yields "…without asking", which reads as finished.
   */
  const lastComma = Math.max(cut.lastIndexOf(', '), cut.lastIndexOf('; '))
  if (lastComma > max * 0.5) return cut.slice(0, lastComma).trim()

  const lastSpace = cut.lastIndexOf(' ')
  let out = (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()
  // A trim can strand several in a row ("... with every" → "...").
  for (let i = 0; i < 3 && DANGLING.test(out); i++) out = out.replace(DANGLING, '')
  return out.replace(/[\s,;:]+$/, '')
}
