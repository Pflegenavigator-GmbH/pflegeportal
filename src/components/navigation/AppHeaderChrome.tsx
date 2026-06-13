// src/component/navigation/AppHeaderChrome.tsx
'use client';

import {
  ArrowLeft,
  FolderLock,
  Trash2,
  Home,
  HelpCircle,
  Newspaper,
  Info,
  FileText,
  Copy,
  BookOpen,
  KeyRound,
  Share2,
  Menu, // Hinzugefügt für das Mobile-Menü
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import LanguageSwitcher from '@/src/components/i18n/LanguageSwitcher';
import { AccessShareModal } from '@/src/components/modal/AccessShareModal';

import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '../ui/dropdown-menu';
import { Input } from '../ui/input';

interface AppHeaderChromeProps {
  locale: string;
}

export default function AppHeaderChrome({ locale }: AppHeaderChromeProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [caseCode, setCaseCode] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const readCaseCode = () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('case_code');
  };

  useEffect(() => {
    const syncCaseCode = () => setCaseCode(readCaseCode());

    window.addEventListener('storage', syncCaseCode);
    return () => window.removeEventListener('storage', syncCaseCode);
  }, []);

  const istStartseite = pathname === `/${locale}` || pathname === `/${locale}/`;

  const handleSetCase = () => {
    if (inputCode.trim()) {
      localStorage.setItem('case_code', inputCode.trim().toUpperCase());
      setCaseCode(inputCode.trim().toUpperCase());
      toast.success('Fall geladen');
      window.location.reload();
    }
  };

  const handleSessionReset = () => {
    if (
      confirm(
        'Möchten Sie die aktuelle Fall-Session wirklich schließen? Alle nicht gespeicherten Rohdaten werden lokal gelöscht.'
      )
    ) {
      localStorage.removeItem('case_code');
      localStorage.removeItem('pflege_case');
      localStorage.removeItem('pflegegrad-ergebnis');
      for (let i = 1; i <= 6; i++) {
        localStorage.removeItem(`modul${i}_rohpunkte`);
        localStorage.removeItem(`modul${i}_answers`);
      }
      setCaseCode(null);
      toast.success('Fall-Session erfolgreich beendet.');
      router.push(`/${locale}/pflegegrad/start`);
    }
  };

  return (
    <>
      {/* Modal außerhalb des Headers mounten */}
      {caseCode && (
        <AccessShareModal
          caseCode={caseCode}
          open={isShareModalOpen}
          onOpenChange={setIsShareModalOpen}
        />
      )}

      <header className="bg-[#0f2744] border-b border-white/10 py-3 sm:py-4 px-4 sticky top-0 z-40 backdrop-blur-md bg-opacity-95 text-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Linke Flanke: Logo & Mobile Burger Trigger */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Burger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 md:hidden hover:bg-white/5 rounded-xl border border-white/10 transition-colors text-gray-300"
              aria-label="Menü öffnen"
            >
              <Menu className="w-4 h-4" />
            </button>

            {!istStartseite && (
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-white/5 rounded-xl border border-white/10 transition-colors text-gray-300 hover:text-white"
                title="Zurück"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <Link
              href={`/${locale}`}
              className="text-base sm:text-xl font-bold tracking-tight text-white cursor-pointer select-none flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            >
              <Home className="w-4 h-4 text-[#20b2aa] md:inline hidden" />
              <span>
                PflegeNavigator <span className="text-[#20b2aa]">EU</span>
              </span>
            </Link>
          </div>

          {/* 🧭 MITTE: Navigationsleiste (Desktop-only) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
            <Link
              href={`/${locale}/briefe`}
              className="text-[#20b2aa] hover:text-[#3ddbd0] transition-colors flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" /> Brief-Zentrum
            </Link>
            <Link
              href={`/${locale}/ueber-uns`}
              className="hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Info className="w-4 h-4" /> Über uns
            </Link>
            <Link
              href={`/${locale}/faq`}
              className="hover:text-white transition-colors flex items-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4" /> FAQ
            </Link>
            <Link
              href={`/${locale}/presse`}
              className="hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Newspaper className="w-4 h-4" /> Presse & Blog
            </Link>
          </nav>

          {/* Rechte Flanke: Session & Sprache */}
          <div className="flex items-center gap-2 sm:gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center bg-slate-950/40 border border-white/10 rounded-xl px-2 sm:px-3 py-1.5 gap-1.5 sm:gap-2 shadow-inner cursor-pointer hover:bg-slate-900 transition-colors max-w-[140px] sm:max-w-none truncate">
                  <FolderLock
                    className={`w-3.5 h-3.5 flex-shrink-0 ${caseCode ? 'text-[#20b2aa]' : 'text-gray-500'}`}
                  />
                  <span className="text-[11px] sm:text-xs font-mono text-gray-300 font-medium truncate">
                    {caseCode ? caseCode.toUpperCase() : 'Laden...'}
                  </span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-64 bg-[#0f2744] border-white/10 text-white p-4"
                align="end"
              >
                {!caseCode ? (
                  <div className="space-y-2">
                    <DropdownMenuLabel className="text-xs text-gray-400 p-0">
                      Fallcode eingeben
                    </DropdownMenuLabel>
                    <Input
                      placeholder="PF-XXXX-XXXX"
                      value={inputCode}
                      onChange={(e) => setInputCode(e.target.value)}
                      className="bg-slate-900 border-white/10 text-sm focus-visible:ring-[#20b2aa]"
                    />
                    <Button
                      onClick={handleSetCase}
                      className="w-full bg-[#20b2aa] hover:bg-[#3ddbd0] text-slate-950 font-bold h-8 text-xs"
                    >
                      <KeyRound className="w-3 h-3 mr-2" /> Laden
                    </Button>
                  </div>
                ) : (
                  <>
                    <DropdownMenuItem asChild>
                      <Link
                        href={`/${locale}/tagebuch`}
                        className="cursor-pointer hover:bg-white/5 focus:bg-white/5"
                      >
                        <BookOpen className="w-4 h-4 mr-2 text-[#20b2aa]" /> Pflegetagebuch
                      </Link>
                    </DropdownMenuItem>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsShareModalOpen(true);
                        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                      }}
                      className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-white/5 focus:bg-white/5"
                    >
                      <Share2 className="w-4 h-4 mr-2 text-[#20b2aa]" /> Zugang sichern / teilen
                    </button>

                    <DropdownMenuItem
                      onClick={() => {
                        navigator.clipboard.writeText(caseCode);
                        toast.success('Code kopiert');
                      }}
                      className="cursor-pointer hover:bg-white/5 focus:bg-white/5"
                    >
                      <Copy className="w-4 h-4 mr-2" /> Code kopieren
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem
                      onClick={handleSessionReset}
                      className="cursor-pointer text-rose-400 focus:text-rose-400 focus:bg-rose-500/10 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Fall schließen
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <LanguageSwitcher />
          </div>
        </div>

        {/* 📱 Mobile Navigations-Akkordeon / Drawer (Einklappbar) */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 mt-3 pt-3 bg-[#0f2744] animate-in fade-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-1 text-sm font-medium">
              <Link
                href={`/${locale}/briefe`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-[#20b2aa] hover:bg-white/5 p-2.5 rounded-xl flex items-center gap-3 transition-colors"
              >
                <FileText className="w-4 h-4" /> Brief-Zentrum
              </Link>
              <Link
                href={`/${locale}/ueber-uns`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-white hover:bg-white/5 p-2.5 rounded-xl flex items-center gap-3 transition-colors text-gray-300"
              >
                <Info className="w-4 h-4" /> Über uns
              </Link>
              <Link
                href={`/${locale}/faq`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-white hover:bg-white/5 p-2.5 rounded-xl flex items-center gap-3 transition-colors text-gray-300"
              >
                <HelpCircle className="w-4 h-4" /> FAQ
              </Link>
              <Link
                href={`/${locale}/presse`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-white hover:bg-white/5 p-2.5 rounded-xl flex items-center gap-3 transition-colors text-gray-300"
              >
                <Newspaper className="w-4 h-4" /> Presse & Blog
              </Link>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
