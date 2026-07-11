'use client';

import {
  Shield,
  Calculator,
  FileText,
  ArrowRight,
  Clock,
  Users,
  Stethoscope,
  FolderOpen,
  MessageCircle,
  BookOpen,
  Smartphone,
  Sparkles,
  QrCode
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';

// 🪄 Punktlandung: Genau 2 Ebenen hoch bricht in src/styles/ ein
import styles from '../../styles/page.module.css';

export default function Startseite() {
  const router = useRouter();
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
    {
      icon: Calculator,
      title: 'Pflegegrad-Rechner',
      description: 'Berechnen Sie Ihren Pflegegrad rechtssicher in 6 Modulen gemäß den echten Richtlinien des MDK.',
      highlight: '15 Min. • Frei',
    },
    {
      icon: FileText,
      title: 'Widerspruchs-Zentrum',
      description: 'Erstellen Sie automatisch begründete Widerspruchsschreiben mit allen gesetzlichen Pflichtklauseln.',
      highlight: '§ 84 SGG Frist',
    },
    {
      icon: MessageCircle,
      title: 'Avatar-Begleitung „Navi“',
      description: 'Klären Sie komplexe Fragen im barrierefreien Dialog per Text oder sanfter Audio-Ausgabe.',
      highlight: 'Kokoro Engine',
    },
    {
      icon: BookOpen,
      title: 'Digitales Pflegetagebuch',
      description: 'Dokumentieren Sie Pflegezeiten und Erleichterungen als lückenlosen Hauptbeweis für die MDK-Prüfung.',
      highlight: 'Export-Fähig',
    },
    {
      icon: QrCode,
      title: 'Verschlüsseltes QR-System',
      description: 'Teilen Sie Ihre Fall-Akte ohne Angabe von Namen sicher mit Familienangehörigen oder Ärzten.',
      highlight: 'DSGVO Safe',
    },
    {
      icon: Smartphone,
      title: 'Integrierte Multi-Rechner',
      description: 'GdB-Ermittlung nach VersMedV, SGB XIV Opferentschädigung und steuerliche Pauschbeträge 2026.',
      highlight: 'Rechtsstand 2026',
    },
  ];

  return (
      <div className={styles.pageContainer}>
        <div className={styles.mainWrapper}>

          {/* 🧠 HERO: Empathischer Scope mit dem warmen Dschungel-Bild */}
          <section className={styles.heroSection}>
            <div className={styles.heroContent}>
              <div className={styles.badge}>
                <Sparkles className="w-3.5 h-3.5" /> Innovation im Sozialrecht
              </div>
              <h1 className={styles.heroTitle}>
                Schluss mit dem <span>Pflege-Dschungel</span>. Wir helfen Ihnen.
              </h1>
              <p className={styles.heroText}>
                Hallo. Ich bin <strong>Navi</strong>, Ihr digitaler Begleiter. Ob Erstbeantragung, Höherstufung oder plötzliche Ablehnung: Wir wandeln unübersichtliche Bürokratie in einen klaren, verständlichen Fahrplan um.
              </p>
              <div className={styles.heroActions}>
                <button
                    onClick={() => router.push(hatAktiveSession ? `./pflegegrad/ergebnis` : `./pflegegrad/start`)}
                    className={styles.btnPrimary}
                >
                  {hatAktiveSession ? 'Laufende Akte öffnen' : 'Einstufung prüfen'} <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => router.push(`./widerspruch`)} className={styles.btnAccent}>
                  Widerspruch schreiben
                </button>
              </div>
            </div>

            {/* 🖼️ Next.js optimiertes Bild-Handling */}
            <div className={styles.imageWrapper}>
              <Image
                  src="/pflegenavigator_dschungel.png"
                  alt="Vom bürokratischen Aktenchaos hin zur sicheren, geführten digitalen Lösung auf dem Smartphone"
                  fill
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
              Termine im Pflegestützpunkt dauern oft <strong>2 bis 6 Wochen</strong>. Bei uns erhalten Sie eine fundierte sozialrechtliche Orientierungs-Matrix in nur <strong>15 Minuten</strong> – anonym, sicher und kostenfrei.
            </p>
          </div>

          {/* 📦 FEATURE-GRID */}
          <section className={styles.sectionStack}>
            <div className={styles.sectionHeader}>
              <h2>Was kann das Portal für Sie tun?</h2>
              <p>Alle Werkzeuge für Ihre Pflegesituation digital gebündelt.</p>
            </div>

            <div className={styles.gridContainer}>
              {funktionen.map((fkt, i) => (
                  <div key={i} className={styles.triageCard}>
                    <div className={styles.cardMeta}>
                      <div className={styles.iconBox}>
                        <fkt.icon className="w-5 h-5" />
                      </div>
                      <span className={styles.cardTag}>
                    {fkt.highlight}
                  </span>
                    </div>
                    <div className={styles.cardBody}>
                      <h3>{fkt.title}</h3>
                      <p>{fkt.description}</p>
                    </div>
                  </div>
              ))}
            </div>
          </section>

          {/* 🏢 B2B ACCOUNTING-RIEGEL */}
          <div onClick={() => router.push(`./pflegekraefte`)} className={styles.b2bRow}>
            <div className={styles.b2bMeta}>
              <div className={styles.iconBox}>
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h4 className={styles.b2bTitle}>Für Pflegekräfte, Berater & Pflegedienste</h4>
                <p className={styles.b2bText}>Nutzen Sie fortgeschrittene Fall-Akteure, PflegeGPT-Schnittstellen und Lastprofil-Analysen.</p>
              </div>
            </div>
            <span className={styles.b2bLink}>
            Fach-Tools öffnen <ArrowRight className="w-3.5 h-3.5" />
          </span>
          </div>

          {/* 🛡️ TRUST REGISTER */}
          <div className={styles.footerRegister}>
            <div className={styles.registerCard}>
              <Users className="w-5 h-5 text-[#4a90e2] flex-shrink-0" />
              <span><strong>4,9 Millionen</strong> verifizierte Fall-Schicksale als mathematische Berechnungsbasis.</span>
            </div>
            <div className={styles.registerCard}>
              <Shield className="w-5 h-5 text-[#4a90e2] flex-shrink-0" />
              <span><strong>100% Anonym:</strong> Keine Angabe von Klarnamen oder sensiblen Daten erzwungen.</span>
            </div>
            <div className={styles.registerCard}>
              <Clock className="w-5 h-5 text-[#4a90e2] flex-shrink-0" />
              <span><strong>Rechtssicher 2026:</strong> Ständige Aktualisierung aller Freibeträge, SGB-Sätze und Fristen.</span>
            </div>
          </div>

        </div>
      </div>
  );
}
