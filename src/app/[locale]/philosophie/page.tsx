'use client';

import { Award, ArrowRight, Sparkles, Heart, Eye, Building2, Stethoscope } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { use } from 'react';

import pageStyles from '@/src/styles/page.module.css';
import animStyles from '@/src/styles/philosophie.module.css';

import vectorDoctor from '../../../../public/lu94007-doctor-6810750_1920.png';
import careImage from '../../../../public/sorinvision-elderly-care-10269837_1920.png';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default function PhilosophiePflegeNavigatorPage(props: PageProps) {
  const router = useRouter();
  const params = use(props.params);
  const locale = params?.locale || 'de';

  // 🪄 Der i18n-Hook gelinkt auf den neuen Namespace
  const t = useTranslations('philosophie');

  const isRtlLocale = ['ar', 'fa', 'he', 'ur'].includes(locale);

  return (
    <div
      className={`${pageStyles.pageContainer} ${animStyles.philosophieContainer}`}
      dir={isRtlLocale ? 'rtl' : 'ltr'}
    >
      <div className={pageStyles.mainWrapper}>
        {/* 🧠 SECTION 1: HERO */}
        <section className={pageStyles.heroSection}>
          <div className={pageStyles.heroContent} style={{ gridColumn: 'span 2' }}>
            <div className={pageStyles.badge}>
              <Sparkles className="w-3.5 h-3.5" /> {t('hero.badge')}
            </div>
            <h1 className={pageStyles.heroTitle}>
              {t.rich('hero.title', {
                span: (chunks) => <span className={pageStyles.highlight}>{chunks}</span>,
              })}
            </h1>
            <p className={pageStyles.heroText}>{t('hero.text')}</p>
            <div className={pageStyles.heroActions}>
              <button
                onClick={() => router.push(`/${locale}/pflegegrad/start`)}
                className={pageStyles.btnPrimary}
              >
                {t('hero.btnStart')} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* 🔄 SECTION 2: ZWEISPALTIGER SPLIT */}
        <div className={animStyles.mainSplitGrid}>
          {/* LINKE SPALTE: Wie alles begann */}
          <div className={animStyles.storyCol}>
            <div className={pageStyles.badge} style={{ width: 'fit-content' }}>
              <Heart className="w-3.5 h-3.5 text-rose-400" /> {t('story.badge')}
            </div>
            <h2 className="text-2xl font-bold text-white">{t('story.title')}</h2>

            <p>{t('story.p1')}</p>
            <p>{t('story.p2')}</p>

            <div className={animStyles.storyImageWrapper}>
              <Image
                src={careImage}
                alt="Empathische Pflege und digitale Unterstützung vereint"
                fill
                priority
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>

            <h3 className="text-xl font-bold text-white mt-4">{t('story.subtitle')}</h3>
            <p>{t('story.p3')}</p>

            <div className={animStyles.quoteBox}>
              {t.rich('story.statusNotice', {
                strong: (chunks) => <strong>{chunks}</strong>,
              })}
            </div>
          </div>

          {/* RECHTE SPALTE: Mission, Vision & Partner */}
          <div className={animStyles.rightCol}>
            {/* Kachel 1: Die Mission */}
            <div className={animStyles.trustCard}>
              <div className={animStyles.trustIconBox}>
                <Award className="w-5 h-5" />
              </div>
              <div className={animStyles.trustContent}>
                <h3>{t('trust.mission.title')}</h3>
                <p>{t('trust.mission.text')}</p>
              </div>
            </div>

            {/* Kachel 2: Die Vision */}
            <div className={animStyles.trustCard}>
              <div className={animStyles.trustIconBox}>
                <Eye className="w-5 h-5" />
              </div>
              <div className={animStyles.trustContent}>
                <h3>{t('trust.vision.title')}</h3>
                <p>{t('trust.vision.text')}</p>
              </div>
            </div>

            {/* Kachel 3: Medizinischer Kooperationspartner */}
            <div className={animStyles.trustCard}>
              <div className={animStyles.trustIconBox}>
                <Building2 className="w-5 h-5" />
              </div>
              <div className={animStyles.trustContent}>
                <h3>{t('trust.partner.title')}</h3>
                <p>
                  {t.rich('trust.partner.text', {
                    strong: (chunks) => <strong>{chunks}</strong>,
                  })}
                </p>
                <span className={animStyles.trustBadge}>{t('trust.partner.badge')}</span>
              </div>
            </div>

            {/* Kachel 4: Sozialpsychologische Absicherung */}
            <div className={animStyles.trustCard}>
              <div className={animStyles.trustIconBox}>
                <Stethoscope className="w-5 h-5" />
              </div>
              <div className={animStyles.trustContent}>
                <h3>{t('trust.expert.title')}</h3>
                <p>
                  {t.rich('trust.expert.text', {
                    strong: (chunks) => <strong>{chunks}</strong>,
                  })}
                </p>
                <span className={animStyles.trustBadge}>{t('trust.expert.badge')}</span>
              </div>
            </div>

            {/* Visuelles Deko-Asset */}
            <div className="relative w-full h-48 rounded-xl overflow-hidden opacity-85 hidden sm:block border border-white/5">
              <Image
                src={vectorDoctor}
                alt="Medizinische Schnittstellen-Beratung des PflegeNavigators"
                fill
                style={{ objectFit: 'contain' }}
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>

        {/* RECHTSSTAND & COPYRIGHT */}
        <div className={animStyles.legalFooter}>
          <p>{t('legal.copyright')}</p>
          <p style={{ marginTop: '0.25rem' }}>{t('legal.notice')}</p>
        </div>
      </div>
    </div>
  );
}
