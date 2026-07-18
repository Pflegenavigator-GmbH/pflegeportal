// src/app/global-not-found.tsx
// Globale 404 für URLs, die keine Route treffen (Next 16, experimental.globalNotFound).
// Ersetzt die frühere Redirect-Lösung, die statt eines 404-Status einen
// 307 nach /de geliefert hat. Rendert ohne Root-Layout — html/body sind Pflicht.

export default function GlobalNotFound() {
  return (
    <html lang="de">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a1c3a',
          color: '#ffffff',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
        }}
      >
        <main style={{ padding: '2rem', maxWidth: '28rem' }}>
          <h1 style={{ fontSize: '4rem', margin: 0, color: '#20b2aa' }}>404</h1>
          <h2 style={{ fontSize: '1.5rem', margin: '0.5rem 0 1rem' }}>Seite nicht gefunden</h2>
          <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
            Diese Seite existiert nicht oder wurde verschoben.
          </p>
          {/* global-not-found rendert ohne App-Router-Kontext — bewusst ein natives <a> */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/de"
            style={{
              display: 'inline-block',
              marginTop: '1.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#20b2aa',
              color: '#0a1c3a',
              fontWeight: 700,
              borderRadius: '0.75rem',
              textDecoration: 'none',
            }}
          >
            Zur Startseite
          </a>
        </main>
      </body>
    </html>
  );
}
