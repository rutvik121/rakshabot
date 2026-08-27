interface RakshaBotMascotProps {
  className?: string
}

/**
 * RakshaBot: a small boxy HR clerk who takes the paperwork very seriously and
 * is, despite the clipboard, entirely soft about it — hence the heart antenna.
 *
 * Motion is deliberately small and slow: a bob, an occasional blink, a heartbeat
 * and a nodding clipboard. All of it is disabled under prefers-reduced-motion.
 */
export function RakshaBotMascot({ className = '' }: RakshaBotMascotProps) {
  return (
    <svg
      viewBox="0 0 140 152"
      className={className}
      role="img"
      aria-label="RakshaBot, a small robot holding a clipboard"
    >
      <defs>
        <linearGradient id="rb-shell" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff6e8" />
          <stop offset="1" stopColor="#e9d9be" />
        </linearGradient>
        <linearGradient id="rb-heart" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff5fa2" />
          <stop offset="1" stopColor="#ff3d81" />
        </linearGradient>
        <radialGradient id="rb-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#ff3d81" stopOpacity="0.55" />
          <stop offset="1" stopColor="#ff3d81" stopOpacity="0" />
        </radialGradient>
      </defs>

      <g className="rb-bob">
        {/* antenna, with a heart that beats */}
        <g className="rb-antenna">
          <path d="M70 36V22" stroke="#c9b79a" strokeWidth="3" strokeLinecap="round" />
          <g className="rb-heart">
            <ellipse cx="70" cy="16" rx="16" ry="14" fill="url(#rb-glow)" />
            <path
              d="M70 22c-4.6-3.3-8-6-8-9.4A4.2 4.2 0 0 1 66.2 8c1.6 0 3 .8 3.8 2 .8-1.2 2.2-2 3.8-2A4.2 4.2 0 0 1 78 12.6c0 3.4-3.4 6.1-8 9.4z"
              fill="url(#rb-heart)"
            />
          </g>
        </g>

        {/* ears */}
        <rect x="10" y="56" width="13" height="24" rx="6.5" fill="#c9b79a" />
        <rect x="117" y="56" width="13" height="24" rx="6.5" fill="#c9b79a" />

        {/* head shell */}
        <rect x="22" y="34" width="96" height="70" rx="26" fill="url(#rb-shell)" />
        <rect
          x="22"
          y="34"
          width="96"
          height="70"
          rx="26"
          fill="none"
          stroke="#0b0a13"
          strokeOpacity="0.12"
          strokeWidth="2"
        />

        {/* face screen */}
        <rect x="35" y="46" width="70" height="46" rx="17" fill="#15121f" />

        {/* eyes */}
        <g className="rb-eyes" fill="#ff8fbe">
          <ellipse cx="57" cy="66" rx="6" ry="7.5" />
          <ellipse cx="83" cy="66" rx="6" ry="7.5" />
        </g>
        {/* catchlights */}
        <circle cx="59" cy="63" r="1.8" fill="#fff2df" opacity="0.9" />
        <circle cx="85" cy="63" r="1.8" fill="#fff2df" opacity="0.9" />

        {/* blush */}
        <ellipse cx="45" cy="78" rx="6" ry="3.4" fill="#ff3d81" opacity="0.4" />
        <ellipse cx="95" cy="78" rx="6" ry="3.4" fill="#ff3d81" opacity="0.4" />

        {/* smile */}
        <path
          d="M63 78q7 6 14 0"
          stroke="#ff8fbe"
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />

        {/* clipboard, nodding as if being written on */}
        <g className="rb-clipboard">
          <rect x="43" y="104" width="54" height="42" rx="5" fill="#f6ecda" />
          <rect
            x="43"
            y="104"
            width="54"
            height="42"
            rx="5"
            fill="none"
            stroke="#0b0a13"
            strokeOpacity="0.18"
            strokeWidth="1.5"
          />
          <rect x="61" y="99" width="18" height="9" rx="4" fill="#c9b79a" />

          {/* ruled lines with ticks */}
          <path
            d="M52 119h22M52 128h28M52 137h16"
            stroke="#0b0a13"
            strokeOpacity="0.22"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M80 116.5l2.5 2.5 4.5-5M84 125l2.5 2.5 4.5-5"
            stroke="#ff3d81"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>

        {/* hands holding the board */}
        <circle cx="41" cy="120" r="7" fill="url(#rb-shell)" />
        <circle cx="99" cy="120" r="7" fill="url(#rb-shell)" />
      </g>
    </svg>
  )
}
