// src/app/[locale]/preview-login/page.tsx
'use client';

import { FormEvent, useState } from 'react';

export default function PreviewLoginPage() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!password || isLoading) {
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/preview-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? 'Das eingegebene Passwort ist nicht korrekt.');
        return;
      }

      // Cookie wurde serverseitig gesetzt.
      // Anschließend zurück auf die Website.
      window.location.href = '/';
    } catch {
      setError('Die Anmeldung konnte nicht durchgeführt werden. Bitte versuche es erneut.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="preview">
      <div className="preview__glow preview__glow--one" />
      <div className="preview__glow preview__glow--two" />

      <section className="preview__card">
        <div className="preview__icon" aria-hidden="true">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="5"
              y="10"
              width="14"
              height="10"
              rx="3"
              stroke="currentColor"
              strokeWidth="1.7"
            />
            <path
              d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="preview__heading">
          <span className="preview__badge">Private Vorschau</span>

          <h1>Willkommen zur Vorschau</h1>

          <p>
            Diese Website befindet sich derzeit in einer geschützten Vorschauphase. Bitte gib das
            bereitgestellte Passwort ein, um fortzufahren.
          </p>
        </div>

        <form className="preview__form" onSubmit={handleSubmit} noValidate>
          <label htmlFor="preview-password">Passwort</label>

          <div className={`preview__inputWrapper ${error ? 'preview__inputWrapper--error' : ''}`}>
            <svg
              className="preview__inputIcon"
              width="19"
              height="19"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <rect
                x="5"
                y="10"
                width="14"
                height="10"
                rx="3"
                stroke="currentColor"
                strokeWidth="1.7"
              />
              <path
                d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>

            <input
              id="preview-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);

                if (error) {
                  setError('');
                }
              }}
              placeholder="Passwort eingeben"
              autoComplete="current-password"
              autoFocus
              required
              disabled={isLoading}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'preview-password-error' : undefined}
            />

            <button
              className="preview__showPassword"
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              disabled={isLoading}
              aria-label={showPassword ? 'Passwort ausblenden' : 'Passwort anzeigen'}
            >
              {showPassword ? (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M3 3l18 18"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                  <path
                    d="M10.6 10.7a2 2 0 0 0 2.7 2.7"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                  <path
                    d="M9.9 5.2A10.7 10.7 0 0 1 12 5c5.5 0 9 7 9 7a17 17 0 0 1-2.2 3.1M6.2 6.2C4.1 7.7 3 10 3 12c0 0 3.5 7 9 7 1.3 0 2.5-.4 3.5-.9"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
                </svg>
              )}
            </button>
          </div>

          {error && (
            <div id="preview-password-error" className="preview__error" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
                <path d="M12 7.5v5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                <circle cx="12" cy="16" r="1" fill="currentColor" />
              </svg>

              <span>{error}</span>
            </div>
          )}

          <button className="preview__submit" type="submit" disabled={!password || isLoading}>
            {isLoading ? (
              <>
                <span className="preview__spinner" aria-hidden="true" />
                Zugang wird geprüft …
              </>
            ) : (
              <>
                Vorschau öffnen
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M5 12h14M14 7l5 5-5 5"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </>
            )}
          </button>
        </form>

        <div className="preview__divider" />

        <div className="preview__footer">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 3 5 6v5c0 4.6 2.9 8.2 7 10 4.1-1.8 7-5.4 7-10V6l-7-3Z"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinejoin="round"
            />
            <path
              d="m9.5 12 1.7 1.7 3.5-3.7"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <span>Zugriff nur für autorisierte Personen</span>
        </div>
      </section>

      <style jsx>{`
        .preview {
          position: relative;
          display: flex;
          min-height: 100dvh;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 24px;
          background:
            radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.09), transparent 38%), #f7f8fb;
          color: #111827;
        }

        .preview::before {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(17, 24, 39, 0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(17, 24, 39, 0.025) 1px, transparent 1px);
          background-size: 40px 40px;
          content: '';
          mask-image: linear-gradient(to bottom, black, transparent 75%);
          pointer-events: none;
        }

        .preview__glow {
          position: absolute;
          border-radius: 999px;
          filter: blur(1px);
          pointer-events: none;
        }

        .preview__glow--one {
          top: -180px;
          left: calc(50% - 330px);
          width: 420px;
          height: 420px;
          background: rgba(99, 102, 241, 0.08);
        }

        .preview__glow--two {
          right: -100px;
          bottom: -180px;
          width: 360px;
          height: 360px;
          background: rgba(59, 130, 246, 0.06);
        }

        .preview__card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 460px;
          padding: 38px;
          border: 1px solid rgba(17, 24, 39, 0.08);
          border-radius: 24px;
          background: rgba(255, 255, 255, 0.88);
          box-shadow:
            0 1px 2px rgba(0, 0, 0, 0.02),
            0 20px 60px rgba(17, 24, 39, 0.08);
          backdrop-filter: blur(18px);
        }

        .preview__icon {
          display: flex;
          width: 48px;
          height: 48px;
          align-items: center;
          justify-content: center;
          margin-bottom: 26px;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
          background: #fff;
          color: #4f46e5;
          box-shadow: 0 4px 12px rgba(17, 24, 39, 0.05);
        }

        .preview__heading {
          margin-bottom: 30px;
        }

        .preview__badge {
          display: inline-flex;
          margin-bottom: 12px;
          padding: 5px 9px;
          border: 1px solid #e0e7ff;
          border-radius: 999px;
          background: #eef2ff;
          color: #4338ca;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        h1 {
          margin: 0 0 12px;
          color: #111827;
          font-size: clamp(26px, 5vw, 32px);
          font-weight: 700;
          letter-spacing: -0.035em;
          line-height: 1.15;
        }

        p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
          line-height: 1.65;
        }

        .preview__form {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        label {
          color: #374151;
          font-size: 13px;
          font-weight: 600;
        }

        .preview__inputWrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .preview__inputIcon {
          position: absolute;
          z-index: 1;
          left: 14px;
          color: #9ca3af;
          pointer-events: none;
        }

        input {
          width: 100%;
          height: 50px;
          padding: 0 48px 0 44px;
          border: 1px solid #dfe3e8;
          outline: none;
          border-radius: 12px;
          background: #fff;
          color: #111827;
          font: inherit;
          font-size: 14px;
          transition:
            border-color 150ms ease,
            box-shadow 150ms ease,
            opacity 150ms ease;
        }

        input::placeholder {
          color: #9ca3af;
        }

        input:focus {
          border-color: #818cf8;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
        }

        input:disabled {
          cursor: not-allowed;
          opacity: 0.65;
        }

        .preview__inputWrapper--error input {
          border-color: #fca5a5;
        }

        .preview__inputWrapper--error input:focus {
          border-color: #ef4444;
          box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.08);
        }

        .preview__inputWrapper--error .preview__inputIcon {
          color: #ef4444;
        }

        .preview__showPassword {
          position: absolute;
          right: 8px;
          display: flex;
          width: 36px;
          height: 36px;
          align-items: center;
          justify-content: center;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #9ca3af;
          cursor: pointer;
          transition:
            background 150ms ease,
            color 150ms ease;
        }

        .preview__showPassword:hover:not(:disabled) {
          background: #f3f4f6;
          color: #4b5563;
        }

        .preview__showPassword:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .preview__error {
          display: flex;
          align-items: flex-start;
          gap: 7px;
          margin: 1px 0 2px;
          color: #dc2626;
          font-size: 12px;
          line-height: 1.5;
        }

        .preview__error svg {
          flex: 0 0 auto;
          margin-top: 1px;
        }

        .preview__submit {
          display: flex;
          width: 100%;
          height: 50px;
          align-items: center;
          justify-content: center;
          gap: 9px;
          margin-top: 8px;
          border: 0;
          border-radius: 12px;
          background: #111827;
          color: #fff;
          font: inherit;
          font-size: 14px;
          font-weight: 650;
          cursor: pointer;
          box-shadow: 0 5px 15px rgba(17, 24, 39, 0.14);
          transition:
            transform 150ms ease,
            background 150ms ease,
            box-shadow 150ms ease,
            opacity 150ms ease;
        }

        .preview__submit:hover:not(:disabled) {
          background: #1f2937;
          box-shadow: 0 8px 20px rgba(17, 24, 39, 0.18);
          transform: translateY(-1px);
        }

        .preview__submit:active:not(:disabled) {
          transform: translateY(0);
        }

        .preview__submit:disabled {
          cursor: not-allowed;
          opacity: 0.45;
          box-shadow: none;
        }

        .preview__spinner {
          width: 17px;
          height: 17px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: preview-spin 700ms linear infinite;
        }

        @keyframes preview-spin {
          to {
            transform: rotate(360deg);
          }
        }

        .preview__divider {
          height: 1px;
          margin: 28px 0 20px;
          background: #eef0f3;
        }

        .preview__footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          color: #9ca3af;
          font-size: 11px;
        }

        @media (max-width: 520px) {
          .preview {
            padding: 16px;
          }

          .preview__card {
            padding: 28px 22px;
            border-radius: 20px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            scroll-behavior: auto !important;
            transition: none !important;
          }

          .preview__spinner {
            animation-duration: 1.5s;
          }
        }
      `}</style>
    </main>
  );
}
