'use client';

import Link from 'next/link';
import { MapPinOff, Home, ArrowLeft } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function NotFound() {
    const params = useParams();
    const locale = (params?.locale as string) || 'de';

    return (
        <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4 text-white font-sans">
            <div className="text-center max-w-md mx-auto space-y-6">

                <div className="inline-flex items-center justify-center w-24 h-24 bg-rose-500/10 border border-rose-500/30 rounded-full shadow-2xl mb-2">
                    <MapPinOff className="w-12 h-12 text-rose-400" />
                </div>

                <div className="space-y-3">
                    <h1 className="text-7xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-[#20b2aa] to-[#3ddbd0]">
                        404
                    </h1>
                    <h2 className="text-2xl font-bold text-white">Seite nicht gefunden</h2>
                    <p className="text-gray-400 leading-relaxed mt-4">
                        Hoppla! Diese Seite konnten wir im Pflege-Dschungel leider nicht finden.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                    <Link
                        href={`/${locale}`}
                        className="w-full sm:w-auto h-12 px-6 bg-[#20b2aa] hover:bg-[#3ddbd0] text-slate-950 font-bold text-base shadow-lg rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        <Home className="w-4 h-4" />
                        Zur Startseite
                    </Link>

                    <button
                        onClick={() => window.history.back()}
                        className="w-full sm:w-auto h-12 px-6 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Zurück
                    </button>
                </div>

            </div>
        </main>
    );
}