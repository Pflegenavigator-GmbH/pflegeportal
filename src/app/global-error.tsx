// src/app/global-error.tsx
// Fängt Fehler im Root-/Locale-Layout ab. Muss eigene html/body-Tags liefern,
// da es das Root-Layout ersetzt (siehe Next-16-Doku zu error.js).
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
          <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>
            Es ist ein Fehler aufgetreten
          </h1>
          <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
            Bitte laden Sie die Seite neu. Ihre gespeicherten Falldaten sind davon nicht betroffen.
          </p>
          {error.digest && (
            <p style={{ color: '#64748b', fontSize: '0.75rem' }}>Fehlercode: {error.digest}</p>
          )}
          <button
            onClick={reset}
            style={{
              marginTop: '1.5rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#20b2aa',
              color: '#0a1c3a',
              fontWeight: 700,
              borderRadius: '0.75rem',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Erneut versuchen
          </button>
        </main>
      </body>
    </html>
  );
}
