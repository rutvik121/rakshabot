import { useEffect } from 'react'

/**
 * Below this visible height the flow switches to its compact layout.
 *
 * It is the height actually left over once the keyboard is up — on a phone that
 * is roughly 350–450px — not the height of the screen.
 */
const COMPACT_HEIGHT = 560

/**
 * Keeps a full-height screen usable while the on-screen keyboard is open.
 *
 * Opening the keyboard shrinks the *visual* viewport and leaves the layout
 * viewport alone, so `100dvh` and `max-height` media queries both keep
 * reporting the full screen. A screen sized that way keeps its original height
 * and the field being typed into ends up behind the keyboard.
 *
 * This tracks `visualViewport` and publishes what it finds two ways:
 *
 * - `--app-height` on the root, so a screen can size itself to the space that
 *   is actually visible.
 * - `data-compact` on the root, which drives the `compact:` variant. A media
 *   query cannot do this job: the keyboard never changes the height a media
 *   query sees.
 *
 * It also keeps the focused field in view, because how much room a keyboard
 * leaves varies enormously between devices and IMEs — the compact layout fits
 * the common case, and scrolling covers the rest.
 *
 * Where `visualViewport` is unavailable the screen falls back to `100dvh` and
 * stays in its roomy layout, which is the desktop case anyway.
 */
export function useKeyboardViewport() {
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const root = document.documentElement

    const revealFocusedField = () => {
      const el = document.activeElement
      if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return
      // One frame late, so the shrunken, compacted layout is settled first.
      requestAnimationFrame(() => {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' })
      })
    }

    const update = () => {
      root.style.setProperty('--app-height', `${vv.height}px`)
      if (vv.height <= COMPACT_HEIGHT) root.setAttribute('data-compact', '')
      else root.removeAttribute('data-compact')
      revealFocusedField()
    }

    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    // Moving between fields while the keyboard is already up fires no resize.
    window.addEventListener('focusin', revealFocusedField)

    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
      window.removeEventListener('focusin', revealFocusedField)
      root.style.removeProperty('--app-height')
      root.removeAttribute('data-compact')
    }
  }, [])
}
