// src/app/[locale]/page.tsx
'use client';

import {
  Shield,
  Calculator,
  FileText,
  ArrowRight,
  Clock,
  Users,
  Stethoscope,
  MessageCircle,
  BookOpen,
  Smartphone,
  Sparkles,
  QrCode,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import dschungelBild from '@/public/megan_rexazin_conde-medical-5459633_1920.png';
import pageStyles from '@/src/styles/page.module.css';

export default function Startseite() {
  const router = useRouter();
  const t = useTranslations('startseite');

  const [hatAktiveSession, setHatAktiveSession] = useState(false);

  useEffect(() => {
    const storedCode = typeof window !== 'undefined' ? localStorage.getItem('case_code') : null;
    if (storedCode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHatAktiveSession(true);
    }
  }, []);

  const funktionen = [
    { id: 'rechner', icon: Calculator, path: './pflegegrad/start' },
    { id: 'widerspruch', icon: FileText, path: './widerspruch' },
    { id: 'avatar', icon: MessageCircle, path: './avatar' },
    { id: 'tagebuch', icon: BookOpen, path: './tagebuch' },
    { id: 'qr', icon: QrCode, path: '#' },
    { id: 'multi', icon: Smartphone, path: '#' },
    // `as const` ist hier nicht Kosmetik: Erst dadurch ist `fkt.id` ein
    // Literal-Typ, und `t(`features.items.${fkt.id}.title`)` lässt sich
    // gegen die vorhandenen Schlüssel prüfen. Ohne das wäre es `string`
    // und die Prüfung liefe ins Leere.
  ] as const;

  return (
    <div className={pageStyles.pageContainer}>
      {/* Haupt-Inhaltsbereich mit eindeutiger Landmarke für Screenreader nach BFSG */}
      <div className={pageStyles.mainWrapper} role="document">
        {/* 🧠 HERO: Einbindung des Avatars Navi & problemorientierter CTAs */}
        <section className={pageStyles.heroSection} aria-labelledby="hero-heading">
          <div className={pageStyles.heroContent}>
            <div className={pageStyles.badge} role="status">
              <Sparkles className="w-3.5 h-3.5" /> {t('hero.badge')}
            </div>

            <h1 id="hero-heading" className={pageStyles.heroTitle}>
              {t.rich('hero.title', {
                span: (chunks) => <span className={pageStyles.highlight}>{chunks}</span>,
              })}
            </h1>

            {/* ♿ Einfache Sprache & Kognitive Barrierefreiheit (Navi-Begrüßung) */}
            <p className={pageStyles.heroText}>
              {t.rich('hero.text', {
                avatarName: t('hero.avatarName'),
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>

            <div className={pageStyles.heroActions}>
              {/* Session-Management: Schaltet flackerfrei basierend auf lokaler Sitzung um */}
              <button
                onClick={() =>
                  router.push(hatAktiveSession ? `./pflegegrad/ergebnis` : `./pflegegrad/start`)
                }
                className={pageStyles.btnPrimary}
                style={{ minHeight: '56px' }} // ♿ Akzeptanzkriterium erfüllt
                aria-label={hatAktiveSession ? t('hero.btnResume') : t('hero.btnStart')}
              >
                {hatAktiveSession ? t('hero.btnResume') : t('hero.btnStart')}{' '}
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => router.push(`./widerspruch`)}
                className={pageStyles.btnAccent}
                style={{ minHeight: '56px' }}
              >
                {t('hero.btnWiderspruch')}
              </button>
            </div>
          </div>

          {/* Visuelle Unterstützung zur Beruhigung der emotionalen UX */}
          <div className={pageStyles.imageWrapper}>
            <Image
              src={dschungelBild}
              alt="Ein geborgenes Pflegeumfeld, das emotionale Sicherheit vermittelt"
              fill={true}
              priority={true}
              className={pageStyles.heroImage}
              sizes="(max-w-768px) 100vw, 50vw"
            />
          </div>
        </section>

        {/* ⚖️ TRIAGE-RIEGEL: Der direkte, leicht verständliche Systemvergleich */}
        <div className={pageStyles.promiseBox} role="note" aria-label="Leistungsversprechen">
          <Clock className="w-5 h-5 text-[#4a90e2] flex-shrink-0" />
          <p className={pageStyles.promiseText}>
            {t.rich('promise.text', {
              timeStuetzkopf: t('promise.timeStuetzkopf'),
              timePortal: t('promise.timePortal'),
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
        </div>

        {/* 📦 FEATURE-GRID: Problemorientierte Fragestellungen */}
        <section className={pageStyles.sectionStack} aria-labelledby="features-heading">
          <div className={pageStyles.sectionHeader}>
            <h2 id="features-heading">{t('features.heading')}</h2>
            <p>{t('features.subheading')}</p>
          </div>

          <div className={pageStyles.gridContainer}>
            {funktionen.map((fkt) => (
              <div
                key={fkt.id}
                className={pageStyles.triageCard}
                onClick={() => fkt.path !== '#' && router.push(fkt.path)}
                role="link"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && fkt.path !== '#') router.push(fkt.path);
                }}
              >
                <div className={pageStyles.cardMeta}>
                  <div className={pageStyles.iconBox}>
                    <fkt.icon className="w-5 h-5" />
                  </div>
                  <span className={pageStyles.cardTag}>{t(`features.items.${fkt.id}.tag`)}</span>
                </div>
                <div className={pageStyles.cardBody}>
                  <h3>{t(`features.items.${fkt.id}.title`)}</h3>
                  <p>{t(`features.items.${fkt.id}.description`)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 🏢 B2B RIEMEN: Für Fachkräfte */}
        <div
          onClick={() => router.push(`./pflegekraefte`)}
          className={pageStyles.b2bRow}
          role="link"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter') router.push(`./pflegekraefte`);
          }}
        >
          <div className={pageStyles.b2bMeta}>
            <div className={pageStyles.iconBox}>
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h4 className={pageStyles.b2bTitle}>{t('b2b.title')}</h4>
              <p className={pageStyles.b2bText}>{t('b2b.text')}</p>
            </div>
          </div>
          <span className={pageStyles.b2bLink}>
            {t('b2b.link')} <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* 🛡️ TRUST REGISTER: Unmittelbar sichtbare Vertrauensindikatoren */}
        <div
          className={pageStyles.footerRegister}
          role="region"
          aria-label="Sicherheitszertifikate"
        >
          <div className={pageStyles.registerCard}>
            <Users className="w-5 h-5 text-[#4a90e2] flex-shrink-0" />
            <span>
              {t.rich('trust.basis', {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </span>
          </div>
          <div className={pageStyles.registerCard}>
            <Shield className="w-5 h-5 text-[#4a90e2] flex-shrink-0" />
            <span>
              {t.rich('trust.anonym', {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </span>
          </div>
          <div className={pageStyles.registerCard}>
            <Clock className="w-5 h-5 text-[#4a90e2] flex-shrink-0" />
            <span>
              {t.rich('trust.rechtssicher', {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
