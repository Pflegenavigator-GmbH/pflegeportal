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
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

import styles from '../../styles/page.module.css';
import dschungelBild from '../../../public/megan_rexazin_conde-medical-5459633_1920.png';

export default function Startseite() {
  const router = useRouter();

  // 🪄 Hook greift nun sauber auf den isolierten Namespace 'startseite' zu
  const t = useTranslations('startseite');

  const [hatAktiveSession, setHatAktiveSession] = useState(false);
  const [caseCode, setCaseCode] = useState<string | null>(null);

  useEffect(() => {
    const storedCode = typeof window !== 'undefined' ? localStorage.getItem('case_code') : null;
    if (storedCode) {
      setHatAktiveSession(true);
      setCaseCode(storedCode.toUpperCase());
    }
  }, []);

  const funktionen = [
    { id: 'rechner', icon: Calculator },
    { id: 'widerspruch', icon: FileText },
    { id: 'avatar', icon: MessageCircle },
    { id: 'tagebuch', icon: BookOpen },
    { id: 'qr', icon: QrCode },
    { id: 'multi', icon: Smartphone },
  ];

  return (
    <div className={styles.pageContainer}>
      <div className={styles.mainWrapper}>
        {/* 🧠 HERO */}
        <section className={styles.heroSection}>
          <div className={styles.heroContent}>
            <div className={styles.badge}>
              <Sparkles className="w-3.5 h-3.5" /> {t('hero.badge')}
            </div>

            <h1 className={styles.heroTitle}>
              {t.rich('hero.title', {
                span: (chunks) => <span className={styles.highlight}>{chunks}</span>,
              })}
            </h1>

            {/* 🧠 HERO TEXT */}
            <p className={styles.heroText}>
              {t.rich('hero.text', {
                avatarName: t('hero.avatarName'),
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </p>

            <div className={styles.heroActions}>
              <button
                onClick={() =>
                  router.push(hatAktiveSession ? `./pflegegrad/ergebnis` : `./pflegegrad/start`)
                }
                className={styles.btnPrimary}
              >
                {hatAktiveSession ? t('hero.btnResume') : t('hero.btnStart')}{' '}
                <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => router.push(`./widerspruch`)} className={styles.btnAccent}>
                {t('hero.btnWiderspruch')}
              </button>
            </div>
          </div>

          <div className={styles.imageWrapper}>
            <Image
              src={dschungelBild}
              alt="Vom bürokratischen Aktenchaos hin zur sicheren, geführten digitalen Lösung auf dem Smartphone"
              fill={true}
              priority
              className={styles.heroImage}
              sizes="(max-w-768px) 100vw, 50vw"
            />
          </div>
        </section>

        {/* ⚖️ TRIAGE-RIEGEL */}
        <div className={styles.promiseBox}>
          <Clock className="w-5 h-5 text-[#4a90e2] flex-shrink-0" />
          <p className={styles.promiseText}>
            {t.rich('promise.text', {
              timeStuetzkopf: t('promise.timeStuetzkopf'),
              timePortal: t('promise.timePortal'),
              // 🪄 Exakt gematcht auf das <strong> Tag im JSON
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
        </div>

        {/* 📦 FEATURE-GRID */}
        <section className={styles.sectionStack}>
          <div className={styles.sectionHeader}>
            <h2>{t('features.heading')}</h2>
            <p>{t('features.subheading')}</p>
          </div>

          <div className={styles.gridContainer}>
            {funktionen.map((fkt) => (
              <div key={fkt.id} className={styles.triageCard}>
                <div className={styles.cardMeta}>
                  <div className={styles.iconBox}>
                    <fkt.icon className="w-5 h-5" />
                  </div>
                  <span className={styles.cardTag}>{t(`features.items.${fkt.id}.tag`)}</span>
                </div>
                <div className={styles.cardBody}>
                  <h3>{t(`features.items.${fkt.id}.title`)}</h3>
                  <p>{t(`features.items.${fkt.id}.description`)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 🏢 B2B RIEMEN */}
        <div onClick={() => router.push(`./pflegekraefte`)} className={styles.b2bRow}>
          <div className={styles.b2bMeta}>
            <div className={styles.iconBox}>
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h4 className={styles.b2bTitle}>{t('b2b.title')}</h4>
              <p className={styles.b2bText}>{t('b2b.text')}</p>
            </div>
          </div>
          <span className={styles.b2bLink}>
            {t('b2b.link')} <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* 🛡️ TRUST REGISTER */}
        <div className={styles.footerRegister}>
          <div className={styles.registerCard}>
            <Users className="w-5 h-5 text-[#4a90e2] flex-shrink-0" />
            <span>
              {t.rich('trust.basis', {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </span>
          </div>
          <div className={styles.registerCard}>
            <Shield className="w-5 h-5 text-[#4a90e2] flex-shrink-0" />
            <span>
              {t.rich('trust.anonym', {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </span>
          </div>
          <div className={styles.registerCard}>
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
