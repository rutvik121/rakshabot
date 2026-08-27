import { useEffect } from 'react'

/**
 * Keeps `--app-height` in sync with the *visual* viewport.
 *
 * On mobile, opening the keyboard shrinks the visual viewport but leaves
 * `100dvh` alone, so a full-height screen keeps its original size and the
 * content the user is typing about gets pushed out of view behind the keyboard.
 * Tracking `visualViewport` lets a screen shrink to the space actually visible,
 * so its header and footer stay put and nothing needs scrolling back to.
 *
 * Falls back to `100dvh` where `visualViewport` is unavailable.
 */
export function useViewportHeight() {
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    const update = () => {
      document.documentElement.style.setProperty('--app-height', `${vv.height}px`)
    }

    update()
    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    return () => {
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
      document.documentElement.style.removeProperty('--app-height')
    }
  }, [])
}
