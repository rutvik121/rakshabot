import { useRef } from 'react'
import { ResultCard } from '@/components/result/ResultCard'
import { downloadCard } from '@/lib/share/cardImage'
import { OUTPUT_STYLES, type OutputStyle } from '@/lib/review/styles'
import { SAMPLE_REVIEWS, STRESS_REVIEW } from '@/data/sampleReviews'

/**
 * Development-only view of every output template.
 *
 * Reached with `?preview=all`, `?preview=CASE_FILE`, or `?preview=stress`. The
 * templates are a fixed-canvas design problem, so they need to be looked at
 * side by side and at export width — not discovered one at a time by running
 * the whole flow. `App` only mounts this under `import.meta.env.DEV`, so it is
 * eliminated from a production build.
 */
export function TemplateGallery({ which }: { which: string }) {
  const key = which.toUpperCase()
  // `?width=1080` renders at true export size, to check the design holds when
  // it is not being flattered by a small preview.
  const width = Number(new URLSearchParams(window.location.search).get('width')) || 400

  if (key === 'STRESS') {
    return (
      <Wrap title="Stress test · every field at or over its limit">
        <Slot label="CASE_FILE · stress" width={width}>
          <ResultCard review={STRESS_REVIEW} />
        </Slot>
      </Wrap>
    )
  }

  const styles = (OUTPUT_STYLES as readonly string[]).includes(key)
    ? [key as OutputStyle]
    : OUTPUT_STYLES

  return (
    <Wrap title="One sibling. Many worlds.">
      {styles.map((style) => (
        <Slot key={style} label={style} width={width}>
          <ResultCard review={SAMPLE_REVIEWS[style]} />
        </Slot>
      ))}
    </Wrap>
  )
}

function Wrap({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-svh bg-ink px-6 py-10">
      <h1 className="mb-8 text-center font-display text-2xl font-extrabold text-cream">{title}</h1>
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-start justify-center gap-10">
        {children}
      </div>
    </div>
  )
}

function Slot({
  label,
  width,
  children,
}: {
  label: string
  width: number
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  return (
    <div data-template={label} className="flex flex-col gap-3" style={{ width }}>
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-cream/45">
          {label}
        </span>
        {/*
          Exports run the real share path. Rasterising a DOM is where gradient
          text, clip-path, emoji and web fonts quietly fail, so the only useful
          check is looking at the file each template actually produces.
        */}
        <button
          data-export={label}
          onClick={() => {
            const node = ref.current?.firstElementChild
            if (node instanceof HTMLElement) void downloadCard(node, label)
          }}
          className="rounded-full border border-ink-line px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-cream/60 hover:text-cream"
        >
          Export png
        </button>
      </div>
      <div ref={ref}>{children}</div>
    </div>
  )
}
