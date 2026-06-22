// src/app/[locale]/pflegegrad/start/page.tsx
'use client';

import { Shield, ArrowRight, Plus, ArrowLeft } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useEffect, use } from 'react';
import { toast } from 'sonner';

import { validateAndStoreSession } from '@/src/app/actions/case-session';
import { PaywallModal } from '@/src/components/modal/PaywallModal';
import { Button } from '@/src/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/src/components/ui/card';
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
  searchParams: Promise<{ session_id?: string; check_code?: string; error?: string }>;
}

export default function PflegegradStartPage(props: PageProps) {
  const router = useRouter();
  const { locale } = useParams();
  const searchParams = use(props.searchParams);

  // Zentrale i18n-Instanz für statische UI-Texte
  const t = useTranslations();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isNewCase, setIsNewCase] = useState(false);
  const [caseCode, setCaseCode] = useState('');

  const [showPaywall, setShowPaywall] = useState(false);
  const [dbProducts, setDbProducts] = useState<ProductFromDb[]>([]);
  const [isBetaExpired, setIsBetaExpired] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (searchParams.session_id && searchParams.check_code) {
      validateAndStoreSession(searchParams.check_code).then((status) => {
        if (status.isUnlocked) {
          toast.success('Premium-Optionen erfolgreich freigeschaltet!');
          localStorage.setItem('case_code', searchParams.check_code!);
          router.push(`/${locale}/pflegegrad/modul1`);
        }
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
      localStorage.setItem('case_code', verifiedCode);

      if (status.isExpired) {
        setIsBetaExpired(true);
        setShowPaywall(true);
        setLoading(false);
        return;
      }

      toast.success('Willkommen zurück! Daten geladen.');
      if (localStorage.getItem('pflegegrad-ergebnis')) {
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

      setCaseCode(resData.caseCode);
      localStorage.setItem('case_code', resData.caseCode);

      setIsNewCase(true);
      toast.success('Kostenloser Fallcode generiert!');
    } catch (err) {
      console.error(err);
      setError('Fehler beim Initialisieren des neuen Falls über die API.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (paketId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/checkout/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseCode, paket: paketId }),
      });
      const session = await response.json();
      if (session.url) router.push(session.url);
    } catch {
      toast.error('Fehler bei der Stripe-Weiterleitung.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 py-12 px-4 text-white">
      <div className="container mx-auto max-w-2xl">
        <button
          onClick={() => router.push(`/${locale}`)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Zurück zur Startseite</span>
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
                    <CardTitle className="text-white">
                      {t('title') || 'Neuen Fall starten'}
                    </CardTitle>
                    <CardDescription className="text-gray-400 text-xs">
                      {t('subtitle') || 'Kostenlose Pflegegrad-Einschätzung beginnen'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Starten Sie ein vollkommen anonymes und kostenfreies Verfahren. Es wird ein
                  verschlüsselter Code generiert, unter dem Ihre Angaben DSGVO-konform gesichert
                  werden.
                </p>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleCreateCase}
                  disabled={loading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                  size="lg"
                >
                  {loading ? 'Wird erstellt...' : 'Kostenlos starten'}
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
            loading={loading}
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
