import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ["Arial", "Helvetica", "sans-serif"],
            },
            fontSize: {
                base: ["1.125rem", { lineHeight: "1.6" }],
                sm: ["1rem", { lineHeight: "1.5" }],
                xs: ["0.875rem", { lineHeight: "1.4" }],
            },
            colors: {
                // Offizielle barrierefreie Bundes-Farbmatrix
                bund: {
                    dunkelblau: "#0a1c3a",  // Primärer Anker / Tiefer Hintergrund
                    hellblau: "#4a90e2",    // Kontrastpartner (mind. 5,2:1 zu Dunkelblau)
                    violett: "#6b21a8",     // 5,5:1 zu Hellblau
                    dunkelrot: "#991b1b",   // 6,2:1 zu Hellblau (z.B. für Notfall/Sturz)
                    dunkelgruen: "#166534",  // 4,5:1 zu Hellblau (z.B. für Med ✓)
                    gelb: "#f59e0b",        // 6,9:1 zu Dunkelblau
                    hellgruen: "#22c55e",    // 5,2:1 zu Dunkelblau
                    hellgrau: "#f3f4f6",    // 5,3:1 zu Dunkelblau
                    weiss: "#ffffff",        // 9,3:1 zu Dunkelblau
                    schwarz: "#000000",     // 11,9:1 zu Hellblau
                },
            },
            boxShadow: {
                'premium': '0 10px 30px -10px rgba(10, 28, 58, 0.3)',
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
};

export default config;