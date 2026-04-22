'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import ChalkboardPreview from '@/components/ChalkboardPreview';

const CONCEPT_KEY = 'mathcanvas_concept';
const USER_KEY = 'mathcanvas_user';

const CHIPS = [
  'Unit Circle',
  'Pythagorean Theorem',
  'Derivatives',
  'Integrals',
  'Logarithms',
  'Parabolas',
  'Sine Waves',
];

type SignedInUser = {
  name?: string;
  email?: string;
  picture?: string;
};

type GoogleAccounts = {
  id: {
    initialize: (config: {
      client_id: string;
      callback: (response: { credential?: string }) => void;
    }) => void;
    renderButton: (el: HTMLElement, options: Record<string, unknown>) => void;
  };
};

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 + i * 0.07, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] as const },
  }),
};

export default function Page() {
  const router = useRouter();
  const [concept, setConcept] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [user, setUser] = useState<SignedInUser | null>(null);
  const [authError, setAuthError] = useState('');
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLDivElement>(null);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  const firstName = useMemo(() => {
    if (!user?.name) return 'there';
    return user.name.split(' ')[0];
  }, [user]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      if (saved) setUser(JSON.parse(saved) as SignedInUser);
    } catch {
      // ignore invalid local state
    }
  }, []);

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return;

    const loadGoogle = () => {
      const g = (window as unknown as { google?: { accounts?: GoogleAccounts } }).google;
      const buttonEl = googleButtonRef.current;
      if (!g?.accounts?.id || !buttonEl) return;

      g.accounts.id.initialize({
        client_id: googleClientId,
        callback: (response: { credential?: string }) => {
          try {
            const token = response.credential || '';
            const payloadPart = token.split('.')[1];
            if (!payloadPart) throw new Error('Missing token payload');
            const payload = JSON.parse(atob(payloadPart));
            const signedInUser: SignedInUser = {
              name: payload.name,
              email: payload.email,
              picture: payload.picture,
            };
            setUser(signedInUser);
            localStorage.setItem(USER_KEY, JSON.stringify(signedInUser));
            setAuthError('');
          } catch {
            setAuthError('Google sign-in failed. Please try again.');
          }
        },
      });

      buttonEl.innerHTML = '';
      g.accounts.id.renderButton(buttonEl, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        logo_alignment: 'left',
        width: 260,
      });
    };

    const existing = document.querySelector('script[data-google-identity="true"]');
    if (existing) {
      loadGoogle();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.setAttribute('data-google-identity', 'true');
    script.onload = loadGoogle;
    script.onerror = () => {
      setAuthError('Google Sign-In script failed to load. Check network/ad-block settings.');
    };
    document.body.appendChild(script);
  }, [googleClientId]);

  const submitConcept = (value: string) => {
    const cleanValue = value.trim();
    if (!cleanValue || isTransitioning) return;
    localStorage.setItem(CONCEPT_KEY, cleanValue);
    setIsTransitioning(true);
    window.setTimeout(() => router.push('/canvas'), 420);
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitConcept(concept);
  };

  const scrollToPrompt = () => {
    if (user) {
      promptRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      document.getElementById('signin-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <main className={`landing ${isTransitioning ? 'is-transitioning' : ''}`}>
      <div className="landing-inner">
        {/* NAV */}
        <motion.nav
          className="nav"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className="nav-brand">
            <span className="nav-brand-mark" />
            MathCanvas
          </div>
          <div className="nav-links">
            <a className="nav-link" href="#how">
              How it works
            </a>
            <a className="nav-link" href="#topics">
              Topics
            </a>
            <a className="nav-link" href="#signin-panel">
              {user ? 'Account' : 'Sign in'}
            </a>
          </div>
          <button className="nav-cta" onClick={scrollToPrompt}>
            {user ? 'Start a lesson' : 'Try for free'}
            <span aria-hidden>→</span>
          </button>
        </motion.nav>

        {/* HERO */}
        <section className="hero">
          <div className="hero-grid">
            <div>
              <motion.div
                className="hero-eyebrow"
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={0}
              >
                <span className="hero-eyebrow-dot" />
                Live interactive lessons · 1,000+ learners
              </motion.div>

              <motion.h1
                className="hero-title"
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={1}
              >
                The math tutor
                <br />
                that <span className="italic">draws</span>{' '}
                <span className="underline-word">itself.</span>
              </motion.h1>

              <motion.p
                className="hero-sub"
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={2}
              >
                Ask one concept. Watch each step draw in real time on an interactive chalkboard.
                Build intuition, not just memorization — from unit circles to integrals.
              </motion.p>

              <motion.div
                className="hero-cta-row"
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={3}
              >
                <button className="btn btn-primary" onClick={scrollToPrompt}>
                  Start for free
                  <span className="btn-arrow" aria-hidden>
                    →
                  </span>
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => {
                    setConcept('Unit Circle');
                    if (user) submitConcept('Unit Circle');
                    else scrollToPrompt();
                  }}
                >
                  Try Unit Circle
                </button>
              </motion.div>

              <motion.div
                className="hero-meta"
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                custom={4}
              >
                <span>
                  Press <kbd>Enter</kbd> to draw
                </span>
                <span aria-hidden>·</span>
                <span>No credit card required</span>
              </motion.div>
            </div>

            <motion.div
              className="hero-visual"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <div className="visual-label">
                <span className="visual-label-dot" />
                Drawing · Unit Circle
              </div>
              <ChalkboardPreview />
              <div className="visual-caption">
                &ldquo;Every curve tells a story — here&rsquo;s the one behind sin &amp; cos.&rdquo;
              </div>
            </motion.div>
          </div>

          {/* SIGN-IN / PROMPT PANEL */}
          <motion.div
            id="signin-panel"
            className="panel"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={5}
          >
            <AnimatePresence mode="wait">
              {!user ? (
                <motion.div
                  key="signed-out"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35 }}
                  style={{ display: 'contents' }}
                >
                  <div>
                    <p className="panel-title">Sign in to start a visual lesson</p>
                    <p className="panel-sub">
                      Your progress and past lessons stay synced across devices.
                    </p>
                    {authError && <p className="auth-error">{authError}</p>}
                  </div>
                  <div className="panel-action">
                    {googleClientId ? (
                      <div ref={googleButtonRef} />
                    ) : (
                      <p className="panel-sub">
                        Add <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to <code>.env.local</code>.
                      </p>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="signed-in"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.35 }}
                  style={{ display: 'contents' }}
                >
                  <div className="signed-in">
                    {user.picture ? (
                      <Image src={user.picture} alt="" width={38} height={38} className="avatar" />
                    ) : null}
                    <div>
                      <p className="panel-title">Welcome back, {firstName}</p>
                      <p className="panel-sub">{user.email || 'Signed in'}</p>
                    </div>
                  </div>
                  <div className="panel-action">
                    <button
                      className="btn btn-ghost"
                      onClick={() => {
                        localStorage.removeItem(USER_KEY);
                        setUser(null);
                      }}
                    >
                      Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* PROMPT (after sign-in) */}
          <AnimatePresence>
            {user && (
              <motion.div
                key="prompt"
                ref={promptRef}
                className="prompt-wrap"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <p className="prompt-label">What do you want to understand?</p>
                <form onSubmit={onSubmit} className="prompt-form">
                  <input
                    type="text"
                    value={concept}
                    onChange={(e) => setConcept(e.target.value)}
                    disabled={isTransitioning}
                    placeholder="Try: Why does the unit circle work?"
                    className="prompt-input"
                    aria-label="Math concept"
                  />
                  <button
                    type="submit"
                    disabled={isTransitioning || !concept.trim()}
                    className="btn btn-primary"
                  >
                    {isTransitioning ? 'Drawing…' : 'Start visual lesson'}
                    <span className="btn-arrow" aria-hidden>
                      →
                    </span>
                  </button>
                </form>

                <div className="chip-row" id="topics">
                  {CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      disabled={isTransitioning}
                      onClick={() => {
                        setConcept(chip);
                        submitConcept(chip);
                      }}
                      className="chip"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* FEATURES */}
        <section className="features" id="how">
          <div className="features-head">
            <div>
              <p className="features-kicker">How it works</p>
              <h2 className="features-title">
                Learn by <span className="italic">watching</span> the math happen.
              </h2>
            </div>
          </div>

          <div className="features-grid">
            {[
              {
                num: '01',
                title: 'Ask a concept',
                body: 'Type any idea — "derivatives," "Pythagoras," "why π" — or pick from common topics.',
              },
              {
                num: '02',
                title: 'Watch it draw',
                body: 'Each step is hand-drawn live with chalk strokes and annotations you can follow in real time.',
              },
              {
                num: '03',
                title: 'Build intuition',
                body: 'Ask follow-ups, redraw any step, or riff on variations. Understanding compounds.',
              },
            ].map((f, i) => (
              <motion.div
                key={f.num}
                className="feature"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: i * 0.08, duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <div className="feature-num">{f.num}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-body">{f.body}</div>
              </motion.div>
            ))}
          </div>
        </section>

        <footer className="footer">
          <div>© {new Date().getFullYear()} MathCanvas</div>
          <div>Built for curious minds.</div>
        </footer>
      </div>

      <div className="transition-shade" />
    </main>
  );
}
