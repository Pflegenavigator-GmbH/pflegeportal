import { Accessibility } from "lucide-react";

export function GdbHeader() {
    return (
        <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#0f2744] to-[#20b2aa] border border-white/10 rounded-2xl shadow-xl">
                <Accessibility className="w-10 h-10 text-white" />
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                GdB-Fristenrechner
            </h1>

            <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto">
                Orientierungshilfe zur Ermittlung des Grades der Behinderung nach den
                Versorgungsmedizinischen Grundsätzen
            </p>
        </div>
    );
}