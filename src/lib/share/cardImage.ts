import { getFontEmbedCSS, toBlob } from 'html-to-image'

/** The artifact's true size. Everything on the card is sized in `cqw`, so it
 *  composes identically whether it is laid out at 340px or at 1080px. */
export const EXPORT_WIDTH = 1080
export const EXPORT_HEIGHT = 1350

/**
 * Web fonts, inlined once.
 *
 * Rasterising walks the stylesheets and fetches every font file it finds. Doing
 * that per export costs seconds and repeats identical downloads, so the result
 * is memoised for the page's lifetime. Without it the export silently falls
 * back to system faces — the failure people notice last and complain about
 * first.
 */
let fontCSS: Promise<string> | null = null
function embeddedFonts(node: HTMLElement): Promise<string> {
  fontCSS ??= getFontEmbedCSS(node).catch(() => '')
  return fontCSS
}

/**
 * Lays a copy of the card out at export size, off screen, and hands it over.
 *
 * The rasteriser snapshots *computed* styles, so a card measured on screen at
 * 400px exports with every `cqw` value frozen at 400px scale and then stretched
 * — the content ends up a quarter size in the corner of the canvas. The fix is
 * to give the browser a real 1080px layout first, so the container queries
 * resolve at export scale before anything is measured.
 *
 * A clone is used rather than resizing the live card, so the user never sees
 * the page lurch while their image is being made.
 */
async function withExportLayout<T>(
  node: HTMLElement,
  draw: (clone: HTMLElement) => Promise<T>,
): Promise<T> {
  const holder = document.createElement('div')
  // Off screen rather than hidden: `display:none` has no layout and
  // `opacity:0` can rasterise as transparent.
  holder.style.cssText = `position:fixed;left:-${EXPORT_WIDTH * 2}px;top:0;width:${EXPORT_WIDTH}px;pointer-events:none;`

  const clone = node.cloneNode(true) as HTMLElement
  clone.style.width = `${EXPORT_WIDTH}px`
  clone.style.maxWidth = 'none'
  clone.style.margin = '0'
  // A rounded corner exports as transparent, which reads as a torn edge on a
  // white feed. The frame keeps its radius on screen and squares off here.
  clone.style.borderRadius = '0'

  holder.appendChild(clone)
  document.body.appendChild(holder)
  try {
    await document.fonts?.ready
    // Two frames: one for layout, one for the container queries to settle.
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    return await draw(clone)
  } finally {
    holder.remove()
  }
}

/** Rasterises a card element to a PNG at export size. */
export async function renderCardToBlob(node: HTMLElement): Promise<Blob> {
  return withExportLayout(node, async (clone) => {
    const blob = await toBlob(clone, {
      width: EXPORT_WIDTH,
      height: EXPORT_HEIGHT,
      pixelRatio: 1,
      fontEmbedCSS: await embeddedFonts(clone),
    })
    if (!blob) throw new Error('The card could not be rendered to an image')
    return blob
  })
}

function fileName(subjectName: string): string {
  const slug =
    subjectName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'sibling'
  return `rakshabot-${slug}.png`
}

export type ShareOutcome = 'shared' | 'downloaded' | 'cancelled'

/**
 * Hands the card to whatever the device can do with it.
 *
 * Phones get the native share sheet with the image attached, which is the whole
 * point — the card is meant to land in a chat, not a downloads folder. Desktop
 * browsers mostly cannot share files, so they save instead. A dismissed share
 * sheet is a decision, not a failure, and must not fall through to a surprise
 * download.
 */
export async function shareCard(node: HTMLElement, subjectName: string): Promise<ShareOutcome> {
  const blob = await renderCardToBlob(node)
  const file = new File([blob], fileName(subjectName), { type: 'image/png' })

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
      // Anything else (a share target that rejects the file, a permissions
      // policy) still leaves the user wanting their card.
    }
  }

  downloadBlob(blob, file.name)
  return 'downloaded'
}

/** Saves the card as a file. */
export async function downloadCard(node: HTMLElement, subjectName: string): Promise<void> {
  downloadBlob(await renderCardToBlob(node), fileName(subjectName))
}

function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Revoked on the next frame: revoking synchronously can cancel the download
  // in some browsers before it has read the blob.
  requestAnimationFrame(() => URL.revokeObjectURL(url))
}
