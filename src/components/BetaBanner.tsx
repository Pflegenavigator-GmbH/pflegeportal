// src/components/BetaBanner.tsx
'use client'

import { useState } from 'react'

export default function BetaBanner() {
    const [visible, setVisible] = useState(true)

    if (!visible) return null

    return (
        <div className="w-full bg-[#92400e] text-white px-4 py-2.5 text-center text-sm font-medium flex items-center justify-center gap-2 relative z-50 shadow-md">
      <span className="bg-white text-[#92400e] text-xs uppercase px-2 py-0.5 rounded font-extrabold tracking-wider">
        Beta-Version
      </span>
            <p className="max-w-4xl text-xs sm:text-sm">
                Willkommen beim PflegeNavigator EU. Dieses Portal befindet sich aktuell in der optimierten Testphase.
                Alle Auswertungen dienen als Orientierungshilfe.
            </p>
            <button
                onClick={() => setVisible(false)}
                className="absolute right-4 hover:opacity-75 text-white font-bold text-base p-1"
                aria-label="Banner schließen"
            >
                ✕
            </button>
        </div>
    )
}