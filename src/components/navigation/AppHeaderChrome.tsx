// src/components/navigation/AppHeaderChrome.tsx
'use client';

import {
  ArrowLeft,
  BookOpen,
  Copy,
  FileText,
  FolderLock,
  HelpCircle,
  Home,
  Info,
  KeyRound,
  Menu,
  Share2,
  Trash2,
  ChevronDown,
  Wrench,
  Newspaper,
  Users,
  Calculator,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { clearCaseSession, validateAndStoreSession } from '@/src/app/actions/case-session';
import LanguageSwitcher from '@/src/components/i18n/LanguageSwitcher';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
} from '@/src/components/ui';
import {
  CASE_CODE_EVENT,
  clearCaseData,
  getStoredCaseCode,
  storeCaseCode,
} from '@/src/lib/case-storage';

import styles from '../../styles/layout.module.css';

// Dynamisch geladen: zieht qrcode.react erst ins Bundle, wenn das Modal
// tatsächlich geöffnet wird — nicht in jeden Seiten-Chunk über den Header.
const AccessShareModal = dynamic(
  () => import('@/src/components/modal/AccessShareModal').then((m) => m.AccessShareModal),
  { ssr: false }
);

interface AppHeaderChromeProps {
  locale: string;
}

export default function AppHeaderChrome({ locale }: AppHeaderChromeProps) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('common.header');
  const tA11y = useTranslations('common.accessibility');
  const [caseCode, setCaseCode] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState('');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const syncCaseCode = () => setCaseCode(getStoredCaseCode());

    syncCaseCode();

    window.addEventListener('storage', syncCaseCode);
    window.addEventListener(CASE_CODE_EVENT, syncCaseCode);
    return () => {
      window.removeEventListener('storage', syncCaseCode);
      window.removeEventListener(CASE_CODE_EVENT, syncCaseCode);
    };
  }, []);

  const istStartseite = pathname === `/${locale}` || pathname === `/${locale}/`;

  const handleSetCase = async () => {
    const cleanedCode = inputCode.trim().toUpperCase();
    if (!cleanedCode) return;
    setIsChecking(true);
    try {
      const session = await validateAndStoreSession(cleanedCode);
      if (session.success && session.isExpired) {
        toast.error(t('fehler.abgelaufen'));
      } else if (session.success) {
        // Schreibt localStorage + feuert das Event → syncCaseCode aktualisiert den State
        storeCaseCode(cleanedCode);
        // Hard-Reload, damit Server Components das neue Cookie mitbekommen
        window.location.reload();
      } else {
        toast.error(t('fehler.codeUnbekannt'));
      }
    } catch {
      toast.error(t('fehler.verbindung'));
    } finally {
      setIsChecking(false);
    }
  };

  const handleSessionReset = async () => {
    if (!confirm(t('fall.schliessenBestaetigung'))) return;
    setIsResetting(true);
    try {
      await clearCaseSession(); // Server: HTTP-only-Cookie entwerten
      clearCaseData(); // Client: alle fallbezogenen Daten + Event
      window.location.assign(`/${locale}/pflegegrad/start`);
    } catch {
      toast.error(t('fehler.beenden'));
      setIsResetting(false);
    }
  };

  return (
    <>
      {caseCode && (
        <AccessShareModal
          caseCode={caseCode}
          open={isShareModalOpen}
          onOpenChange={setIsShareModalOpen}
        />
      )}

      <header className={styles.headerChrome}>
        <div className={styles.headerContainer}>
          {/* Links: Logo & Back-Button */}
          <div className={styles.brandGroup}>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={styles.mobileMenuBtn}
              aria-label={tA11y('openMenu')}
            >
              <Menu className="w-4 h-4" />
            </button>

            {!istStartseite && (
              <button
                onClick={() => router.back()}
                className={styles.mobileMenuBtn}
                title={t('zurueck')}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <Link href={`/${locale}`} className={styles.logoLink}>
              <Home className="w-4 h-4 md:inline hidden" />
              <span>
                PflegeNavigator <span className={styles.logoAccent}>EU</span>
              </span>
            </Link>
          </div>

          {/* 🧠 Desktop-Navigation: Dringlichkeit von links nach rechts */}
          <nav className={styles.mainNav}>
            {/* 🛠️ 1. Für Betroffene (Dropdown) */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className={`${styles.navLink} ${pathname.includes('/briefe') || pathname.includes('/tagebuch') || pathname.includes('/pflegegrad') ? styles.navLinkActive : ''}`}
              >
                <Wrench className="w-4 h-4" /> {t('gruppen.betroffene')}{' '}
                <ChevronDown className="w-3 h-3 opacity-70" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-[#0a1c3a] border-white/10 text-white p-2">
                <DropdownMenuLabel className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
                  {t('labels.assistenten')}
                </DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/${locale}/pflegegrad/start`}
                    className="cursor-pointer font-medium p-2 hover:bg-white/5 flex items-center gap-2"
                  >
                    <Calculator className="w-4 h-4 text-[#4a90e2]" /> {t('links.pflegegrad')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/${locale}/briefe`}
                    className="cursor-pointer font-medium p-2 hover:bg-white/5 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-[#4a90e2]" /> {t('links.briefe')}
                  </Link>
                </DropdownMenuItem>
                {caseCode && (
                  <DropdownMenuItem asChild>
                    <Link
                      href={`/${locale}/tagebuch`}
                      className="cursor-pointer font-medium p-2 hover:bg-white/5 flex items-center gap-2"
                    >
                      <BookOpen className="w-4 h-4 text-[#4a90e2]" /> {t('links.tagebuch')}
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <span aria-hidden className="w-px h-4 bg-white/10 hidden md:block" />

            {/* 🏢 2. Für Fachkräfte (Dropdown) */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className={`${styles.navLink} ${pathname.includes('/pflegekraefte') ? styles.navLinkActive : ''}`}
              >
                <Users className="w-4 h-4" /> {t('gruppen.fachkraefte')}{' '}
                <ChevronDown className="w-3 h-3 opacity-70" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-[#0a1c3a] border-white/10 text-white p-2">
                <DropdownMenuLabel className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
                  {t('labels.institutionen')}
                </DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/${locale}/pflegekraefte`}
                    className="cursor-pointer font-medium p-2 hover:bg-white/5 flex items-center gap-2"
                  >
                    <Users className="w-4 h-4 text-[#4a90e2]" /> {t('links.pflegekraefte')}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <span aria-hidden className="w-px h-4 bg-white/10 hidden md:block" />

            {/* ♿ 3. FAQ (Direktlink) */}
            <Link
              href={`/${locale}/faq`}
              className={`${styles.navLink} ${pathname.includes('/faq') ? styles.navLinkActive : ''}`}
            >
              <HelpCircle className="w-4 h-4" /> {t('links.faq')}
            </Link>

            <span aria-hidden className="w-px h-4 bg-white/10 hidden md:block" />

            {/* ℹ️ 4. Über uns (Dropdown) */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className={`${styles.navLink} ${pathname.includes('/ueber-uns') || pathname.includes('/philosophie') || pathname.includes('/presse') ? styles.navLinkActive : ''}`}
              >
                <Info className="w-4 h-4" /> {t('gruppen.ueberUns')}{' '}
                <ChevronDown className="w-3 h-3 opacity-70" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-[#0a1c3a] border-white/10 text-white p-2">
                <DropdownMenuLabel className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">
                  {t('labels.hintergrund')}
                </DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/${locale}/philosophie`}
                    className="cursor-pointer font-medium p-2 hover:bg-white/5 flex items-center gap-2"
                  >
                    <Info className="w-4 h-4 text-[#4a90e2]" /> {t('links.philosophie')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href={`/${locale}/presse`}
                    className="cursor-pointer font-medium p-2 hover:bg-white/5 flex items-center gap-2"
                  >
                    <Newspaper className="w-4 h-4 text-[#4a90e2]" /> {t('links.presse')}
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Rechts: Fallstatus & Sprache */}
          <div className={styles.rightFlank}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className={styles.caseBadge}>
                  <FolderLock className="w-4 h-4 flex-shrink-0" />
                  <span className={`${styles.caseText} ${caseCode ? styles.caseTextActive : ''}`}>
                    {caseCode ?? t('fall.keiner')}
                  </span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-64 bg-[#0a1c3a] border-white/10 text-white p-4"
                align="end"
              >
                {!caseCode ? (
                  <div className="space-y-2">
                    <DropdownMenuLabel className="text-xs text-gray-400 p-0 font-bold">
                      {t('fall.codeEingeben')}
                    </DropdownMenuLabel>
                    <Input
                      placeholder="PF-XXXX-XXXX"
                      value={inputCode}
                      disabled={isChecking}
                      onChange={(e) => setInputCode(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSetCase();
                      }}
                      className="bg-black/30 border-white/10 text-white text-sm focus-visible:ring-[#4a90e2]"
                    />
                    <Button
                      onClick={handleSetCase}
                      disabled={isChecking || !inputCode.trim()}
                      className="w-full bg-[#4a90e2] text-[#0a1c3a] font-bold h-9 text-xs"
                    >
                      <KeyRound className="w-3.5 h-3.5 mr-2" />{' '}
                      {isChecking ? t('fall.pruefe') : t('fall.oeffnen')}
                    </Button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsShareModalOpen(true);
                        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
                      }}
                      className="w-full flex cursor-pointer items-center rounded-sm p-2 text-sm text-left font-semibold hover:bg-white/5"
                    >
                      <Share2 className="w-4 h-4 mr-2 text-[#4a90e2]" /> {t('fall.teilen')}
                    </button>
                    <DropdownMenuItem
                      onClick={() => {
                        navigator.clipboard.writeText(caseCode);
                        toast.success(t('fall.kopiert'));
                      }}
                      className="cursor-pointer font-semibold p-2 hover:bg-white/5"
                    >
                      <Copy className="w-4 h-4 mr-2" /> {t('fall.kopieren')}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuItem
                      onClick={handleSessionReset}
                      disabled={isResetting}
                      className="cursor-pointer text-rose-400 font-bold p-2 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />{' '}
                      {isResetting ? t('fall.wirdBeendet') : t('fall.schliessen')}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <LanguageSwitcher />
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 mt-3 pt-3 bg-[#0a1c3a] animate-in fade-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-1 text-sm font-medium">
              <Link
                href={`/${locale}/pflegegrad/start`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-[#4a90e2] hover:bg-white/5 p-2.5 rounded-xl flex items-center gap-3 transition-colors"
              >
                <Calculator className="w-4 h-4" /> {t('links.pflegegrad')}
              </Link>
              <Link
                href={`/${locale}/briefe`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-[#4a90e2] hover:bg-white/5 p-2.5 rounded-xl flex items-center gap-3 transition-colors"
              >
                <FileText className="w-4 h-4" /> {t('links.briefe')}
              </Link>
              {caseCode && (
                <Link
                  href={`/${locale}/tagebuch`}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="hover:text-white hover:bg-white/5 p-2.5 rounded-xl flex items-center gap-3 transition-colors text-gray-300"
                >
                  <BookOpen className="w-4 h-4" /> {t('links.tagebuch')}
                </Link>
              )}
              <div className="h-px bg-white/5 my-1" />
              <Link
                href={`/${locale}/pflegekraefte`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-white hover:bg-white/5 p-2.5 rounded-xl flex items-center gap-3 transition-colors text-gray-300"
              >
                <Users className="w-4 h-4" /> {t('links.pflegekraefteMobil')}
              </Link>
              <div className="h-px bg-white/5 my-1" />
              <Link
                href={`/${locale}/faq`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-white hover:bg-white/5 p-2.5 rounded-xl flex items-center gap-3 transition-colors text-gray-300"
              >
                <HelpCircle className="w-4 h-4" /> {t('links.faq')}
              </Link>
              <Link
                href={`/${locale}/philosophie`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-white hover:bg-white/5 p-2.5 rounded-xl flex items-center gap-3 transition-colors text-gray-300"
              >
                <Info className="w-4 h-4" /> {t('links.philosophie')}
              </Link>
              <Link
                href={`/${locale}/presse`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="hover:text-white hover:bg-white/5 p-2.5 rounded-xl flex items-center gap-3 transition-colors text-gray-300"
              >
                <Newspaper className="w-4 h-4" /> {t('links.presse')}
              </Link>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
