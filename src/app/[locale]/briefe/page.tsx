// src/app/[locale]/briefe/page.tsx
// src/app/[locale]/briefe/page.tsx
'use client';

import { motion } from 'framer-motion';
import {
  FileText,
  Shield,
  Scale,
  Heart,
  Building2,
  GraduationCap,
  Wallet,
  HelpCircle,
} from 'lucide-react';
import { useRouter } from 'next/navigation'; // 🚀 HINZUGEFÜGT: Router-Import
import { useState, use } from 'react';

import { BriefFormModal } from '@/src/components/modal/BriefFormModal';
import { BriefType } from '@/src/types/briefe';

const briefKategorien = [
  {
    id: 'antrag-pflegegrad',
    name: 'Antrag Pflegegrad',
    beschreibung: 'Erstbeantragung bei der Pflegekasse',
    icon: Heart,
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
  },
  {
    id: 'widerspruch-pflegegrad',
    name: 'Widerspruch Pflegegrad',
    beschreibung: 'Widerspruch gegen Pflegekassen-Bescheid',
    icon: Scale,
    color: 'text-orange-400',
    bg: 'bg-orange-500/10',
  },
  {
    id: 'versorgungsamt',
    name: 'Versorgungsamt',
    beschreibung: 'Anfragen und Feststellungsanträge',
    icon: Building2,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
  },
  {
    id: 'em-rente',
    name: 'Erwerbsminderungsrente',
    beschreibung: 'Antrag bei der Deutschen Rentenversicherung',
    icon: Wallet,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
  },
  {
    id: 'schwerbehindertenausweis',
    name: 'Schwerbehindertenausweis',
    beschreibung: 'GdB-Antrag beim Versorgungsamt',
    icon: Shield,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
  },
  {
    id: 'betreuungsrecht',
    name: 'Betreuungsrecht',
    beschreibung: 'Vorsorgevollmacht & Patientenverfügung',
    icon: HelpCircle,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
  },
  {
    id: 'erbrecht',
    name: 'Erbrecht',
    beschreibung: 'Testament- und Pflichtteilsansprüche',
    icon: FileText,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
  },
  {
    id: 'allgemein',
    name: 'Allgemeiner Brief',
    beschreibung: 'Universelle Vorlage für Behörden & Kassen',
    icon: GraduationCap,
    color: 'text-teal-400',
    bg: 'bg-teal-500/10',
  },
];

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function BriefePage(props: PageProps) {
  const router = useRouter(); // 🚀 HINZUGEFÜGT: Router-Initialisierung
  const params = use(props.params);
  const locale = params?.locale || 'de';
  const [selectedType, setSelectedType] = useState<BriefType | null>(null);

  return (
    <main className="min-h-screen bg-slate-900 text-white font-sans py-12 px-4">
      <div className="container mx-auto max-w-6xl space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Rechtssicheres Brief-Zentrum
          </h1>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Erstellen Sie rechtlich fundierte Anträge, Widersprüche und Mitteilungen nach aktuellen
            SGB- und BGB-Richtlinien.
          </p>
        </div>

        {/* Grid-Auswahl */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {briefKategorien.map((kat) => {
            const Icon = kat.icon;
            return (
              <motion.button
                key={kat.id}
                whileHover={{ scale: 1.02, borderColor: 'rgba(255,255,255,0.15)' }}
                whileTap={{ scale: 0.98 }}
                // 🚀 HINZUGEFÜGT: Intelligente onClick-Logik
                onClick={() => {
                  if (kat.id === 'widerspruch-pflegegrad') {
                    // Leitet zur spezialisierten Premium-Widerspruchsseite weiter
                    router.push(`/${locale}/widerspruch`);
                  } else {
                    // Öffnet für alle anderen das normale Formular-Modal
                    setSelectedType(kat.id as BriefType);
                  }
                }}
                className="p-6 bg-white/5 border border-white/10 rounded-2xl text-left transition-all group flex flex-col justify-between h-48 hover:bg-white/[0.08]"
              >
                <div>
                  <div
                    className={`w-12 h-12 ${kat.bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className={`w-6 h-6 ${kat.color}`} />
                  </div>
                  <h3 className="font-bold text-white text-base group-hover:text-[#20b2aa] transition-colors">
                    {kat.name}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">{kat.beschreibung}</p>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Infobox */}
        <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-start gap-3 max-w-3xl mx-auto">
          <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-gray-300 leading-relaxed">
            <strong>Hinweis zur Dokumenten-Validierung:</strong> Alle Schreiben basieren auf den
            gesetzlichen Standards für das Jahr 2026. Für komplexe Individualfälle haftet die gUG
            nicht. Einschreiben mit Rückschein wird dringend empfohlen.
          </div>
        </div>

        {/* Dynamisches Steuerungs-Modal */}
        {selectedType && (
          <BriefFormModal
            typ={selectedType}
            isOpen={!!selectedType}
            onClose={() => setSelectedType(null)}
          />
        )}
      </div>
    </main>
  );
}
