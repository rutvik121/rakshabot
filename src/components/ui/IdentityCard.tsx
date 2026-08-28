import { useRef } from 'react'
import { MAX_NAME_LENGTH, type SiblingIdentity } from '@/types'
import { Polaroid } from './Polaroid'

interface IdentityCardProps {
  identity: SiblingIdentity
  onChange: (identity: SiblingIdentity) => void
}

/**
 * Opens the flow by asking who is being reviewed: their name, and optionally a
 * photo for the poster's polaroid. The photo is held as an object URL and
 * revoked when replaced, so nothing leaks if the user picks several.
 */
export function IdentityCard({ identity, onChange }: IdentityCardProps) {
  const fileInput = useRef<HTMLInputElement>(null)

  function setPhoto(file: File | undefined) {
    if (!file) return
    if (identity.photoUrl) URL.revokeObjectURL(identity.photoUrl)
    onChange({ ...identity, photoUrl: URL.createObjectURL(file) })
  }

  function clearPhoto() {
    if (identity.photoUrl) URL.revokeObjectURL(identity.photoUrl)
    onChange({ ...identity, photoUrl: undefined })
    if (fileInput.current) fileInput.current.value = ''
  }

  return (
    <div className="flex flex-col gap-6 compact:gap-3">
      <div className="flex items-start gap-4 compact:gap-3">
        <span className="text-5xl leading-none compact:text-3xl" aria-hidden>
          🫱
        </span>
        <div className="flex flex-col gap-1.5 pt-1">
          <h2 className="font-display text-2xl font-bold leading-tight text-cream sm:text-3xl compact:text-xl">
            Who are we reviewing?
          </h2>
          <p className="text-sm text-cream/50 compact:hidden">
            Their name goes on the report. Spell it right.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="sibling-name"
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-cream/45"
        >
          Sibling's name
        </label>
        <input
          id="sibling-name"
          autoFocus
          value={identity.name}
          onChange={(e) => onChange({ ...identity, name: e.target.value })}
          placeholder="e.g. Ananya"
          maxLength={MAX_NAME_LENGTH}
          autoComplete="off"
          className="w-full rounded-2xl border border-ink-line bg-ink-soft px-5 py-4 font-sans text-lg text-cream outline-none transition-colors placeholder:text-cream/25 focus:border-hotpink/60 focus:ring-2 focus:ring-hotpink/20 compact:py-2.5 compact:text-base"
        />
      </div>

      {/* photo */}
      <div className="flex items-center gap-4 rounded-2xl border border-ink-line bg-ink-soft/60 p-4 compact:p-3">
        <Polaroid
          emoji="🙂"
          photoUrl={identity.photoUrl}
          photoAlt={identity.name}
          rotate={-3}
          className="w-20 shrink-0 compact:w-14"
        />

        <div className="flex min-w-0 flex-col items-start gap-1.5">
          <span className="font-display text-sm font-semibold text-cream">
            Add their photo <span className="font-normal text-cream/40">(optional)</span>
          </span>
          <p className="text-xs leading-relaxed text-cream/45 compact:hidden">
            Goes in the polaroid. Skip it and they get an emoji instead.
          </p>

          <div className="mt-1 flex items-center gap-3">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="rounded-full border border-ink-line px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-cream/80 transition-colors hover:border-white/30 hover:text-cream"
            >
              {identity.photoUrl ? 'Change' : 'Choose photo'}
            </button>
            {identity.photoUrl && (
              <button
                type="button"
                onClick={clearPhoto}
                className="font-mono text-[11px] uppercase tracking-[0.12em] text-cream/40 transition-colors hover:text-coral"
              >
                Remove
              </button>
            )}
          </div>

          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => setPhoto(e.target.files?.[0])}
          />
        </div>
      </div>
    </div>
  )
}
