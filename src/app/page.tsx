'use client';

import { useCallback, useLayoutEffect, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MATHCANVAS_USER_KEY, type MathCanvasUser } from '@/lib/auth';

type GoogleAccounts = {
  id: {
    initialize: (config: {
      client_id: string;
      callback: (response: { credential?: string }) => void;
    }) => void;
    renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
  };
};

declare global {
  interface Window {
    __mathcanvasGsiClientId?: string;
  }
}

/** Keep opacity at 1 in `hidden` so SSR / no-JS never paints an invisible page. */
const fadeUp = {
  hidden: { opacity: 1, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.1 * i, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function HomePage() {
  const router = useRouter();
  const [authError, setAuthError] = useState('');
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const googleClientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').trim();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MATHCANVAS_USER_KEY);
      if (raw) {
        router.replace('/chat');
      }
    } catch {
      // ignore
    }
  }, [router]);

  const onGoogleCredential = useCallback(
    (response: { credential?: string }) => {
      try {
        const token = response.credential || '';
        const payloadPart = token.split('.')[1];
        if (!payloadPart) throw new Error('Missing token payload');
        const payload = JSON.parse(atob(payloadPart)) as Record<string, string | undefined>;
        const signedInUser: MathCanvasUser = {
          name: payload.name,
          email: payload.email,
          picture: payload.picture,
        };
        localStorage.setItem(MATHCANVAS_USER_KEY, JSON.stringify(signedInUser));
        setAuthError('');
        router.push('/chat');
      } catch {
        setAuthError('Google sign-in failed. Please try again.');
      }
    },
    [router],
  );

  useLayoutEffect(() => {
    if (!googleClientId) return;

    const host = googleButtonRef.current;
    if (!host) return;

    const mountButton = () => {
      const el = googleButtonRef.current;
      if (!el) return;

      const g = (window as unknown as { google?: { accounts?: GoogleAccounts } }).google;
      if (!g?.accounts?.id) return;

      if (window.__mathcanvasGsiClientId !== googleClientId) {
        g.accounts.id.initialize({
          client_id: googleClientId,
          callback: onGoogleCredential,
        });
        window.__mathcanvasGsiClientId = googleClientId;
      }

      el.innerHTML = '';
      g.accounts.id.renderButton(el, {
        theme: 'filled_blue',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        logo_alignment: 'left',
        width: 320,
      });
    };

    const g = (window as unknown as { google?: { accounts?: GoogleAccounts } }).google;
    if (g?.accounts?.id) {
      mountButton();
      return;
    }

    const existing = document.querySelector(
      'script[data-google-identity="true"]',
    ) as HTMLScriptElement | null;
    if (existing) {
      const w = window as unknown as { google?: { accounts?: GoogleAccounts } };
      if (w.google?.accounts?.id) {
        mountButton();
        return;
      }
      const onLoad = () => mountButton();
      existing.addEventListener('load', onLoad);
      return () => existing.removeEventListener('load', onLoad);
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.setAttribute('data-google-identity', 'true');
    script.onload = () => mountButton();
    script.onerror = () => {
      setAuthError('Google Sign-In script failed to load. Check network or ad-blockers.');
    };
    document.body.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, [googleClientId, onGoogleCredential]);

  return (
    <main className="landing-page landing-page--home">
      <motion.div
        className="landing-glow landing-glow--a"
        aria-hidden
        initial={false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
      <motion.div
        className="landing-glow landing-glow--b"
        aria-hidden
        initial={false}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, delay: 0.15, ease: 'easeOut' }}
      />

      <header className="landing-nav">
        <motion.div
          className="landing-logo"
          initial={false}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
        >
          MathCanvas
        </motion.div>
        <motion.span
          className="landing-nav-tag"
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Visual math · AI tutor
        </motion.span>
      </header>

      <section className="landing-hero landing-hero--split">
        <motion.div
          className="landing-hero-copy"
          initial={false}
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
          }}
        >
          <motion.p className="social-proof" variants={fadeUp} custom={0}>
            Trusted by students & self-learners
          </motion.p>
          <motion.p className="hero-kicker" variants={fadeUp} custom={1}>
            The tutor that draws every step
          </motion.p>
          <motion.h1 className="hero-title" variants={fadeUp} custom={2}>
            Visual math intuition,
            <br />
            <span className="hero-title-accent">one chalkboard at a time.</span>
          </motion.h1>
          <motion.p className="hero-subtitle" variants={fadeUp} custom={3}>
            Ask a concept. Watch colorful chalk build the picture step by step, like a teacher at the board,
            but interactive. No graphing toy: pure geometry and intuition.
          </motion.p>
        </motion.div>

        <motion.div
          className="landing-auth-card landing-auth-card--elevated"
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="auth-card-label">Get started</p>
          <p className="auth-title">Sign in with Google</p>
          <p className="small-muted auth-card-sub">
            Free to try. After sign-in you&apos;ll land in the chat where every lesson begins.
          </p>

          {!googleClientId ? (
            <div className="google-signin-missing">
              <p className="small-muted">
                Set your OAuth 2.0 <strong>Web client ID</strong> in{' '}
                <code>.env.local</code> as <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>, then restart{' '}
                <code>pnpm dev</code>.
              </p>
              <a
                className="primary-btn"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 44 }}
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Google Cloud credentials
              </a>
            </div>
          ) : null}

          <div
            ref={googleButtonRef}
            className="google-btn-wrap"
            style={{ display: googleClientId ? 'flex' : 'none' }}
            aria-hidden={!googleClientId}
          />

          {authError ? <p className="auth-error">{authError}</p> : null}
          <ul className="auth-benefits">
            <li>Step-by-step chalk animations</li>
            <li>Pick your pace with Next</li>
            <li>Built for intuition, not memorization</li>
          </ul>
        </motion.div>
      </section>

      <motion.footer
        className="landing-footer"
        initial={false}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
      >
        <span>MathCanvas</span>
        <span className="landing-footer-dot">·</span>
        <span>Not a substitute for professional care in a crisis</span>
      </motion.footer>
    </main>
  );
}
