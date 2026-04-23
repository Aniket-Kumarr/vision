'use client';

import { useCallback, useLayoutEffect, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { VISUA_AI_USER_KEY, type VisuaAiUser } from '@/lib/auth';
import '@/styles/mc-landing.css';

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
    __visuaAiGsiClientId?: string;
  }
}

const PLACEHOLDER_PHRASES = [
  'explain the unit circle',
  'what is a derivative?',
  'show me the pythagorean theorem',
  'how do logarithms work?',
  'visualize integration',
];

function scrollToSignIn() {
  document.getElementById('mc-signin')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export default function HomePage() {
  const router = useRouter();
  const [authError, setAuthError] = useState('');
  const googleNavRef = useRef<HTMLDivElement>(null);
  const googleFooterRef = useRef<HTMLDivElement>(null);
  const googleClientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '').trim();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem(VISUA_AI_USER_KEY) ?? localStorage.getItem('mathcanvas_user');
      if (raw) router.replace('/chat');
    } catch {
      // ignore
    }
  }, [router]);

  useEffect(() => {
    const inp = inputRef.current;
    if (!inp) return;

    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let t: ReturnType<typeof setTimeout> | undefined;

    const tick = () => {
      const phrase = PLACEHOLDER_PHRASES[phraseIndex];
      if (!deleting) {
        inp.placeholder = phrase.slice(0, charIndex + 1);
        charIndex++;
        if (charIndex === phrase.length) {
          deleting = true;
          t = setTimeout(tick, 1800);
          return;
        }
        t = setTimeout(tick, 55);
      } else {
        inp.placeholder = phrase.slice(0, charIndex - 1);
        charIndex--;
        if (charIndex === 0) {
          deleting = false;
          phraseIndex = (phraseIndex + 1) % PLACEHOLDER_PHRASES.length;
          t = setTimeout(tick, 400);
          return;
        }
        t = setTimeout(tick, 28);
      }
    };

    t = setTimeout(tick, 800);
    return () => {
      if (t) clearTimeout(t);
    };
  }, []);

  const onGoogleCredential = useCallback(
    (response: { credential?: string }) => {
      try {
        const token = response.credential || '';
        const payloadPart = token.split('.')[1];
        if (!payloadPart) throw new Error('Missing token payload');
        const payload = JSON.parse(atob(payloadPart)) as Record<string, string | undefined>;
        const signedInUser: VisuaAiUser = {
          name: payload.name,
          email: payload.email,
          picture: payload.picture,
        };
        localStorage.setItem(VISUA_AI_USER_KEY, JSON.stringify(signedInUser));
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

    const hosts = [googleNavRef.current, googleFooterRef.current].filter(Boolean) as HTMLElement[];
    if (hosts.length === 0) return;

    const renderOpts = {
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
      text: 'continue_with',
      logo_alignment: 'left',
      width: 280,
    };

    const mountAll = () => {
      const g = (window as unknown as { google?: { accounts?: GoogleAccounts } }).google;
      if (!g?.accounts?.id) return;

      if (window.__visuaAiGsiClientId !== googleClientId) {
        g.accounts.id.initialize({
          client_id: googleClientId,
          callback: onGoogleCredential,
        });
        window.__visuaAiGsiClientId = googleClientId;
      }

      for (const el of hosts) {
        el.innerHTML = '';
        g.accounts.id.renderButton(el, renderOpts);
      }
    };

    const w = window as unknown as { google?: { accounts?: GoogleAccounts } };
    if (w.google?.accounts?.id) {
      mountAll();
      return;
    }

    const existing = document.querySelector(
      'script[data-google-identity="true"]',
    ) as HTMLScriptElement | null;
    if (existing) {
      const onLoad = () => mountAll();
      existing.addEventListener('load', onLoad);
      return () => existing.removeEventListener('load', onLoad);
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.setAttribute('data-google-identity', 'true');
    script.onload = () => mountAll();
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
    <main className="mc-landing">
      <nav className="mc-nav">
        <div className="mc-nav-links">
          <a href="#mc-how">About</a>
          <a href="#mc-cta">Get started</a>
          <a href="#mc-social">Examples</a>
        </div>
        <div className="mc-nav-logo">Visua AI</div>
        <div className="mc-nav-right" id="mc-signin">
          <div ref={googleNavRef} className="mc-google-nav google-btn-wrap" aria-label="Google sign-in" />
        </div>
      </nav>

      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <div className="mc-hero">
          <div className="mc-badge">
            <div className="mc-stars">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="mc-star" />
              ))}
            </div>
            <span>Loved by 2,000+ students</span>
          </div>
          <h1 className="mc-h1">
            Every concept is visual,
            <br />
            we just <em>draw it for you.</em>
          </h1>
          <p className="mc-sub">
            Type any math concept and watch it come alive on a chalkboard, step by step, the way a great teacher
            would explain it.
          </p>
          <div className="mc-btns">
            <button type="button" className="mc-btn-p" onClick={scrollToSignIn}>
              Try for free
            </button>
            <a href="#mc-social" className="mc-btn-s" style={{ textDecoration: 'none', display: 'inline-block' }}>
              See examples
            </a>
          </div>
          <div className="mc-card">
            <div className="mc-card-noise" aria-hidden />
            <div className="mc-ftag" style={{ top: '16%', left: '5%', animationDelay: '0s' }}>
              <div className="mc-ftag-dot" style={{ background: '#FFE066' }} />
              Trigonometry
            </div>
            <div className="mc-ftag" style={{ top: '10%', right: '7%', animationDelay: '-2s' }}>
              <div className="mc-ftag-dot" style={{ background: '#7FD97F' }} />
              Derivatives
            </div>
            <div className="mc-ftag" style={{ bottom: '30%', left: '3%', animationDelay: '-1s' }}>
              <div className="mc-ftag-dot" style={{ background: '#6BBFFF' }} />
              Unit Circle
            </div>
            <div className="mc-ftag" style={{ bottom: '16%', right: '5%', animationDelay: '-3s' }}>
              <div className="mc-ftag-dot" style={{ background: '#FF7F7F' }} />
              Integrals
            </div>
            <div className="mc-ftag" style={{ top: '44%', left: '2%', animationDelay: '-4s' }}>
              <div className="mc-ftag-dot" style={{ background: '#FFB347' }} />
              Logarithms
            </div>
            <div className="mc-input-card">
              <div className="mc-input-header">
                <div className="mc-input-icon">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                    <path
                      d="M6 1L7.2 4.5H11L8 6.8L9.2 10.5L6 8.3L2.8 10.5L4 6.8L1 4.5H4.8L6 1Z"
                      fill="#F4EFE6"
                      fillOpacity="0.9"
                    />
                  </svg>
                </div>
                <span className="mc-input-label">Visua AI</span>
              </div>
              <div className="mc-input-row">
                <input
                  ref={inputRef}
                  className="mc-input"
                  aria-label="Example concept (sign in to use)"
                  readOnly
                  onFocus={scrollToSignIn}
                />
                <button type="button" className="mc-send" aria-label="Sign in to visualize" onClick={scrollToSignIn}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                    <path
                      d="M6 10V2M6 2L2 6M6 2L10 6"
                      stroke="#F4EFE6"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
              <div className="mc-hint">Sign in above to visualize any topic</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mc-social" id="mc-social">
        <p className="mc-social-label">Loved by students and teachers:</p>
        <div className="mc-tcards">
          <div className="mc-tcard">
            <div className="mc-tcard-stars">
              {['★', '★', '★', '★', '★'].map((s, i) => (
                <span key={i} className="mc-tstar">
                  {s}
                </span>
              ))}
            </div>
            <p className="mc-tcard-txt">
              &quot;I finally understood the unit circle after years of confusion. Watched it draw itself and
              everything clicked.&quot;
            </p>
            <div className="mc-tcard-author">
              <div className="mc-avatar" style={{ background: '#C05A28' }}>
                S
              </div>
              <div>
                <div className="mc-tcard-name">Sofia M.</div>
                <div className="mc-tcard-role">AP Calculus student</div>
              </div>
            </div>
          </div>
          <div className="mc-tcard">
            <div className="mc-tcard-stars">
              {['★', '★', '★', '★', '★'].map((s, i) => (
                <span key={i} className="mc-tstar">
                  {s}
                </span>
              ))}
            </div>
            <p className="mc-tcard-txt">
              &quot;My students use this before every test. The derivative animation is better than anything I could
              draw.&quot;
            </p>
            <div className="mc-tcard-author">
              <div className="mc-avatar" style={{ background: '#3A6E50' }}>
                D
              </div>
              <div>
                <div className="mc-tcard-name">Dr. Okafor</div>
                <div className="mc-tcard-role">Math teacher</div>
              </div>
            </div>
          </div>
          <div className="mc-tcard">
            <div className="mc-tcard-stars">
              {['★', '★', '★', '★', '★'].map((s, i) => (
                <span key={i} className="mc-tstar">
                  {s}
                </span>
              ))}
            </div>
            <p className="mc-tcard-txt">
              &quot;Typed explain logarithms and got a 5-step visual proof. Better than any YouTube video I&apos;ve
              watched.&quot;
            </p>
            <div className="mc-tcard-author">
              <div className="mc-avatar" style={{ background: '#6A7A30' }}>
                E
              </div>
              <div>
                <div className="mc-tcard-name">Elena V.</div>
                <div className="mc-tcard-role">College freshman</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mc-how" id="mc-how">
        <div className="mc-pill">HOW IT WORKS</div>
        <h2 className="mc-h2">
          Three steps to <em>seeing</em> math.
        </h2>
        <p className="mc-h2-sub">
          From typing a concept to watching it drawn in chalk, the whole experience takes seconds.
        </p>
        <div className="mc-frows">
          <div className="mc-frow">
            <div>
              <div className="mc-frow-num">01</div>
              <div className="mc-frow-title">Type any concept.</div>
              <p className="mc-frow-desc">
                From the unit circle to eigenvalues: type anything and Visua AI understands what you need to see,
                not just what you asked.
              </p>
            </div>
            <div className="mc-steplist">
              <div
                style={{
                  fontSize: 11,
                  color: '#B8906A',
                  marginBottom: 4,
                  letterSpacing: '0.06em',
                }}
              >
                CONCEPTS
              </div>
              <div className="mc-step-row active">
                <div className="mc-step-left">
                  <div className="mc-check done">✓</div>
                  Unit Circle
                </div>
                <div
                  style={{
                    fontSize: 10,
                    padding: '2px 7px',
                    background: 'rgba(44,26,14,0.07)',
                    borderRadius: 4,
                    color: '#7A5A42',
                  }}
                >
                  Trigonometry
                </div>
              </div>
              <div className="mc-step-row">
                <div className="mc-step-left">
                  <div className="mc-check done">✓</div>
                  Derivatives
                </div>
                <div
                  style={{
                    fontSize: 10,
                    padding: '2px 7px',
                    background: 'rgba(44,26,14,0.05)',
                    borderRadius: 4,
                    color: '#7A5A42',
                  }}
                >
                  Calculus
                </div>
              </div>
              <div className="mc-step-row">
                <div className="mc-step-left">
                  <div className="mc-check done">✓</div>
                  Pythagorean Theorem
                </div>
                <div
                  style={{
                    fontSize: 10,
                    padding: '2px 7px',
                    background: 'rgba(44,26,14,0.05)',
                    borderRadius: 4,
                    color: '#7A5A42',
                  }}
                >
                  Geometry
                </div>
              </div>
              <div className="mc-step-row">
                <div className="mc-step-left">
                  <div className="mc-check" />
                  Fourier Series
                </div>
                <div style={{ fontSize: 10, color: '#B8906A' }}>Advanced</div>
              </div>
            </div>
          </div>
          <div className="mc-frow mc-frow-accent">
            <div className="mc-chalkboard">
              <svg viewBox="0 0 280 170" xmlns="http://www.w3.org/2000/svg" width="280" height="170" aria-hidden>
                <defs>
                  <filter id="mc-ck">
                    <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="3" result="n" />
                    <feDisplacementMap in="SourceGraphic" in2="n" scale="1.5" xChannelSelector="R" yChannelSelector="G" />
                  </filter>
                </defs>
                <line
                  x1="50"
                  y1="85"
                  x2="230"
                  y2="85"
                  stroke="rgba(245,240,232,0.28)"
                  strokeWidth="1.5"
                  filter="url(#mc-ck)"
                  strokeLinecap="round"
                />
                <line
                  x1="140"
                  y1="25"
                  x2="140"
                  y2="145"
                  stroke="rgba(245,240,232,0.28)"
                  strokeWidth="1.5"
                  filter="url(#mc-ck)"
                  strokeLinecap="round"
                />
                <circle
                  cx="140"
                  cy="85"
                  r="48"
                  stroke="rgba(245,240,232,0.82)"
                  strokeWidth="2"
                  fill="none"
                  filter="url(#mc-ck)"
                />
                <circle cx="174" cy="51" r="5" fill="#7FD97F" />
                <line
                  x1="140"
                  y1="85"
                  x2="174"
                  y2="51"
                  stroke="#FFE066"
                  strokeWidth="2"
                  strokeLinecap="round"
                  filter="url(#mc-ck)"
                />
                <line
                  x1="174"
                  y1="51"
                  x2="174"
                  y2="85"
                  stroke="#FF7F7F"
                  strokeWidth="2"
                  strokeDasharray="5,4"
                  strokeLinecap="round"
                />
                <line
                  x1="140"
                  y1="85"
                  x2="174"
                  y2="85"
                  stroke="#6BBFFF"
                  strokeWidth="2"
                  strokeDasharray="5,4"
                  strokeLinecap="round"
                />
                <text x="180" y="70" fontFamily="var(--font-caveat), Caveat, cursive" fontSize="13" fill="#FF7F7F" opacity="0.9">
                  sin θ
                </text>
                <text x="148" y="100" fontFamily="var(--font-caveat), Caveat, cursive" fontSize="13" fill="#6BBFFF" opacity="0.9">
                  cos θ
                </text>
              </svg>
            </div>
            <div>
              <div className="mc-frow-num">02</div>
              <div className="mc-frow-title">Watch it drawn in chalk.</div>
              <p className="mc-frow-desc">
                Every shape draws itself stroke by stroke on a black chalkboard. Colors reveal meaning, and the
                picture builds before your eyes.
              </p>
            </div>
          </div>
          <div className="mc-frow">
            <div>
              <div className="mc-frow-num">03</div>
              <div className="mc-frow-title">Step through the intuition.</div>
              <p className="mc-frow-desc">
                You control the pace. Click Next to reveal each layer until the full geometric truth is visible, and
                hard to forget.
              </p>
            </div>
            <div className="mc-steplist">
              <div
                style={{
                  fontSize: 11,
                  color: '#B8906A',
                  marginBottom: 4,
                  letterSpacing: '0.06em',
                }}
              >
                UNIT CIRCLE · 5 STEPS
              </div>
              <div className="mc-step-row active">
                <div className="mc-step-left">
                  <div className="mc-check done">✓</div>
                  Draw axes and circle
                </div>
                <div className="mc-step-time">Step 1</div>
              </div>
              <div className="mc-step-row active">
                <div className="mc-step-left">
                  <div className="mc-check done">✓</div>
                  Add the angle θ
                </div>
                <div className="mc-step-time">Step 2</div>
              </div>
              <div className="mc-step-row active">
                <div className="mc-step-left">
                  <div className="mc-check done">✓</div>
                  Project sin and cos
                </div>
                <div className="mc-step-time">Step 3</div>
              </div>
              <div className="mc-step-row">
                <div className="mc-step-left">
                  <div className="mc-check" />
                  Animate the point
                </div>
                <div className="mc-step-time" style={{ opacity: 0.4 }}>
                  Step 4
                </div>
              </div>
              <div className="mc-step-row">
                <div className="mc-step-left">
                  <div className="mc-check" />
                  Reveal the formula
                </div>
                <div className="mc-step-time" style={{ opacity: 0.3 }}>
                  Step 5
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mc-stats">
        <div className="mc-stats-card">
          <div className="mc-stats-grid">
            <div className="mc-stat">
              <div className="mc-stat-num">8+</div>
              <div className="mc-stat-label">Core concepts visualized at launch</div>
            </div>
            <div className="mc-stat">
              <div className="mc-stat-num">2,000+</div>
              <div className="mc-stat-label">Students who finally get it</div>
            </div>
            <div className="mc-stat">
              <div className="mc-stat-num">∞</div>
              <div className="mc-stat-label">Concepts you can type and visualize</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mc-cta-sec" id="mc-cta">
        <div className="mc-pill">GET STARTED</div>
        <h2 className="mc-cta-h2">
          Math was never meant
          <br />
          to be <em>invisible.</em>
        </h2>
        <p className="mc-cta-sub">Type your first concept. Watch it drawn. Understand it forever.</p>
        {!googleClientId ? (
          <div className="mc-config-missing">
            Add <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to <code>.env.local</code> to enable sign-in, then restart{' '}
            <code>pnpm dev</code>.
          </div>
        ) : null}
        <div ref={googleFooterRef} className="mc-google-footer google-btn-wrap" aria-label="Google sign-in" />
        {authError ? <p className="mc-auth-error">{authError}</p> : null}
      </div>

      <footer className="mc-footer">
        <div className="mc-footer-logo">Visua AI</div>
        <div className="mc-footer-copy">© {new Date().getFullYear()} Visua AI</div>
      </footer>
    </main>
  );
}
