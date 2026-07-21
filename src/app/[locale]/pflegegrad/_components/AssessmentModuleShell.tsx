// src/app/[locale]/pflegegrad/_components/AssessmentModuleShell.tsx
'use client';

import { ArrowLeft, ArrowRight, LucideIcon, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ReactNode, CSSProperties } from 'react';

import { Button, Progress } from '@/src/components/ui';
import styles from '@/src/styles/pflegegrad.module.css';

interface AssessmentModuleShellProps {
  title: string;
  weightLabel: string;
  /** Gewichtstext in Modulfarbe hervorheben (statt gedämpft) */
  weightAccent?: boolean;
  icon: LucideIcon;
  /** Modul-Akzentfarbe (Wayfinding) — als CSS-Variable vererbt */
  accentColor: string;
  caseCode: string | null;
  fortschritt: number;
  backHref: string;
  backLabel: string;
  nextLabel: string;
  savingLabel?: string;
  loading: boolean;
  canProceed: boolean;
  onNext: () => void;
  legalStrong?: string;
  legalText?: string;
  children: ReactNode;
}

export function AssessmentModuleShell({
  title,
  weightLabel,
  weightAccent = false,
  icon: Icon,
  accentColor,
  caseCode,
  fortschritt,
  backHref,
  backLabel,
  nextLabel,
  savingLabel = 'Speichere...',
  loading,
  canProceed,
  onNext,
  legalStrong,
  legalText,
  children,
}: AssessmentModuleShellProps) {
  const router = useRouter();
  const accentStyle = { '--module-accent': accentColor } as CSSProperties;

  return (
    <div className={styles.page} style={accentStyle}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <div className={styles.headerBrand}>
            <div className={styles.iconBox}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h1 className={styles.title}>{title}</h1>
              <p
                className={styles.weight}
                style={
                  weightAccent ? { color: 'var(--module-accent)', fontWeight: 600 } : undefined
                }
              >
                {weightLabel}
              </p>
            </div>
          </div>
          {caseCode && <span className={styles.idBadge}>ID: {caseCode}</span>}
        </div>
        <Progress value={fortschritt} className="w-full h-2 bg-white/5" />
      </div>

      {children}

      <div className={styles.navBar}>
        <Button
          variant="outline"
          disabled={loading}
          onClick={() => router.push(backHref)}
          className="border-[var(--border-subtle)] text-white hover:bg-white/5 h-12 px-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {backLabel}
        </Button>
        <Button
          onClick={onNext}
          disabled={!canProceed || loading}
          className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-[var(--color-on-accent)] font-bold h-12 px-6 shadow-lg disabled:opacity-40"
        >
          {loading ? savingLabel : nextLabel}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {legalText && (
        <div className={styles.legalNote}>
          <Shield className={`w-5 h-5 ${styles.legalIcon}`} />
          <p>
            {legalStrong && <strong>{legalStrong}</strong>} {legalText}
          </p>
        </div>
      )}
    </div>
  );
}
