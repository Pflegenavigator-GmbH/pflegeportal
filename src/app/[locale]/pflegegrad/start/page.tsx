// src/app/[locale]/pflegegrad/start/page.tsx
'use client';

import { Shield, ArrowRight, Plus, ArrowLeft } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useEffect, use } from 'react';
import { toast } from 'sonner';

import { validateAndStoreSession } from '@/src/app/actions/case-session';
import { PaywallModal } from '@/src/components/modal/PaywallModal';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/src/components/ui';
import { useStripeCheckout } from '@/src/hooks/useStripeCheckout';
import { EREIGNISSE } from '@/src/lib/analytics/events';
import { verfolge, verfolgeEinmalig } from '@/src/lib/analytics/track';
import { storeCaseCode } from '@/src/lib/case-storage';
import { logger } from '@/src/lib/logger';
import { hatErgebnisFuerAktuellenFall } from '@/src/lib/pflegegrad/ergebnis-storage';
import { createClient } from '@/src/lib/supabase/client';

import { LoadCaseCard } from './_components/LoadCaseCard';
import { NewCaseCard } from './_components/NewCaseCard';

interface ProductFromDb {
  id: string;
  name: string;
  price_cents: number;
}

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    session_id?: string;
    check_code?: string;
    error?: string;
    case?: string;
  }>;
}

export default function PflegegradStartPage(props: PageProps) {
  const router = useRouter();
  const { locale } = useParams();
  const searchParams = use(props.searchParams);

  // Namensraum-Weichen aktivieren
  const tStart = useTranslations('pflegegrad.start');
  const tCommon = useTranslations('common.buttons');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isNewCase, setIsNewCase] = useState(false);
  const [caseCode, setCaseCode] = useState('');

  const [showPaywall, setShowPaywall] = useState(false);
  const [dbProducts, setDbProducts] = useState<ProductFromDb[]>([]);
  const [isBetaExpired, setIsBetaExpired] = useState(false);

  const [supabase] = useState(() => createClient());
  const { triggerCheckout, checkoutLoading } = useStripeCheckout();

  useEffect(() => {
    if (searchParams.session_id && searchParams.check_code) {
      const checkCode = searchParams.check_code.trim().toUpperCase();

      validateAndStoreSession(checkCode).then((status) => {
        if (!status.success) return;

        // localStorage + Event → AppHeaderChrome aktualisiert sich sofort
        storeCaseCode(checkCode);

        // Einmalig je Stripe-Sitzung: Ohne diesen Riegel zählt ein Reload den
        // Kauf erneut, denn session_id bleibt in der URL stehen, solange die
        // Freischaltung noch aussteht.
        verfolgeEinmalig(EREIGNISSE.kaufErfolgreich, searchParams.session_id ?? 'unbekannt', {
          freigeschaltet: Boolean(status.isUnlocked),
        });

        if (status.isUnlocked) {
          toast.success('Premium-Optionen erfolgreich freigeschaltet!');
          router.push(`/${locale}/pflegegrad/modul1`);
        } else {
          toast.info(
            'Zahlung wird noch verarbeitet. Ihr Fall ist geladen — Premium schaltet sich in Kürze frei.'
          );
        }
      });
    } else if (searchParams.case) {
      // Geteilte Links (QR-Code, E-Mail, SMS) laden den Fall direkt
      const sharedCode = searchParams.case.trim().toUpperCase();

      validateAndStoreSession(sharedCode).then((status) => {
        if (!status.success) {
          setError('Der geteilte Fallcode ist ungültig oder abgelaufen.');
          return;
        }

        setCaseCode(sharedCode);
        storeCaseCode(sharedCode);

        if (status.isExpired) {
          setIsBetaExpired(true);
          setShowPaywall(true);
          return;
        }

        verfolge(EREIGNISSE.rechnerGestartet, { einstieg: 'geteilt' });
        toast.success('Fall über geteilten Link geladen.');
      });
    }

    supabase
      .from('products')
      .select('id, name, price_cents')
      .eq('is_active', true)
      .then(({ data }) => {
        if (data) setDbProducts(data as ProductFromDb[]);
      });
  }, [searchParams, locale, router, supabase]);

  const handleLoadCase = async (inputCode: string) => {
    setLoading(true);
    setError('');
    try {
      const verifiedCode = inputCode.trim().toUpperCase();
      const status = await validateAndStoreSession(verifiedCode);

      if (!status.success) {
        setError('Fallcode nicht gefunden. Bitte prüfen Sie die Eingabe.');
        setLoading(false);
        return;
      }

      setCaseCode(verifiedCode);
      storeCaseCode(verifiedCode);

      if (status.isExpired) {
        setIsBetaExpired(true);
        setShowPaywall(true);
        setLoading(false);
        return;
      }

      verfolge(EREIGNISSE.rechnerGestartet, { einstieg: 'geladen' });

      toast.success('Willkommen zurück! Daten geladen.');
      // Nur weiterleiten, wenn das Ergebnis zu DIESEM Fall gehört. Die reine
      // Existenzprüfung von früher zeigte sonst den Pflegegrad des zuvor
      // geladenen Falls.
      if (hatErgebnisFuerAktuellenFall()) {
        router.push(`/${locale}/pflegegrad/ergebnis`);
      } else {
        router.push(`/${locale}/pflegegrad/modul1`);
      }
    } catch {
      setError('Fehler bei der Session-Prüfung.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCase = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Server-Antwort war nicht erfolgreich.');
      const resData = await response.json();
      if (resData.error) throw new Error(resData.error);

      await validateAndStoreSession(resData.caseCode);

      setCaseCode(resData.caseCode);
      storeCaseCode(resData.caseCode);

      setIsNewCase(true);
      verfolge(EREIGNISSE.rechnerGestartet, { einstieg: 'neu' });
      toast.success('Kostenloser Fallcode generiert!');
    } catch (err) {
      logger.error({ err }, 'Fehler beim Initialisieren des neuen Falls über die API');
      setError('Fehler beim Initialisieren des neuen Falls über die API.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = (paketId: string) => triggerCheckout(caseCode, paketId);

  return (
    <main className="min-h-screen bg-slate-900 py-12 px-4 text-white">
      <div className="container mx-auto max-w-2xl">
        <button
          onClick={() => router.push(`/${locale}`)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{tCommon('back')}</span>
        </button>

        {isNewCase ? (
          <NewCaseCard caseCode={caseCode} locale={locale as string} />
        ) : (
          <>
            <LoadCaseCard onLoad={handleLoadCase} loading={loading} externalError={error} />

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-slate-900 px-4 text-sm text-gray-500">oder</span>
              </div>
            </div>

            <Card className="bg-white/5 border-emerald-500/20 text-white shadow-xl">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
                    <Plus className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white">{tStart('newTitle')}</CardTitle>
                    <CardDescription className="text-gray-400 text-xs">
                      {tStart('newDescription')}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm leading-relaxed">{tStart('newText')}</p>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleCreateCase}
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                  size="lg"
                >
                  {loading ? tStart('newButtonLoading') : tStart('newButton')}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </CardFooter>
            </Card>
          </>
        )}

        {showPaywall && (
          <PaywallModal
            caseCode={caseCode}
            isExpired={isBetaExpired}
            products={dbProducts}
            onCheckout={handleCheckout}
            onClose={() => setShowPaywall(false)}
            loading={checkoutLoading}
          />
        )}

        <div className="mt-8 pt-6 border-t border-white/10 flex items-start gap-3 text-gray-400 text-xs leading-relaxed">
          <Shield className="w-5 h-5 flex-shrink-0 text-gray-500 mt-0.5" />
          <p>
            <strong>Wichtiger rechtlicher Hinweis:</strong> Dieser Pflegegrad-Rechner bietet eine
            mathematische Orientierungshilfe auf Basis des SGB XI. Er ersetzt keine medizinische
            Begutachtung oder verbindliche Rechtsberatung. Einstufungen werden rechtswirksam
            ausschließlich durch die zuständige Pflegekasse vorgenommen.
          </p>
        </div>
      </div>
    </main>
  );
}
