'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import SuggestionChips from '@/components/SuggestionChips';

const CONCEPT_KEY = 'mathcanvas_concept';
const USER_KEY = 'mathcanvas_user';

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

export default function Page() {
  const router = useRouter();
  const [concept, setConcept] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [user, setUser] = useState<SignedInUser | null>(null);
  const [authError, setAuthError] = useState('');
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const promptSectionRef = useRef<HTMLElement>(null);
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
        text: 'signin_with',
        logo_alignment: 'left',
        width: 280,
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
    window.setTimeout(() => router.push('/canvas'), 380);
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    submitConcept(concept);
  };

  return (
    <main className={`landing-page ${isTransitioning ? 'is-transitioning' : ''}`}>
      <header className="landing-nav">
        <div className="landing-logo">MathCanvas</div>
        <div className="landing-nav-actions">
          {user ? (
            <button
              className="ghost-btn"
              onClick={() => {
                localStorage.removeItem(USER_KEY);
                setUser(null);
              }}
            >
              Sign out
            </button>
          ) : (
            <span className="small-muted">AI Math Tutor</span>
          )}
        </div>
      </header>

      <section className="landing-hero">
        <p className="social-proof">Over 1,000 learners use MathCanvas</p>
        <p className="hero-kicker">Understand math visually</p>
        <h1 className="hero-title">
          Learn concepts through
          <br />
          interactive chalkboard animation
        </h1>
        <p className="hero-subtitle">
          Ask one concept. Watch each step draw in real time. Build intuition, not just memorization.
        </p>

        <div className="hero-cta-row">
          <button
            className="primary-btn large"
            onClick={() => promptSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            Start for free
          </button>
          <button
            className="ghost-btn large"
            onClick={() => setConcept('Unit Circle')}
          >
            Try Unit Circle
          </button>
        </div>

        <div className="landing-auth-card">
          {!user ? (
            <>
              <p className="auth-title">Sign in with Google</p>
              {googleClientId ? (
                <div ref={googleButtonRef} />
              ) : (
                <p className="small-muted">
                  Add <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> to <code>.env.local</code> to enable Google sign-in.
                </p>
              )}
              {authError && <p className="auth-error">{authError}</p>}
            </>
          ) : (
            <div className="signed-in-row">
              {user.picture ? <Image src={user.picture} alt="" width={34} height={34} className="avatar" /> : null}
              <div>
                <p className="auth-title">Welcome back, {firstName}</p>
                <p className="small-muted">{user.email || 'Signed in'}</p>
              </div>
            </div>
          )}
        </div>

        {user ? (
          <>
            <section className="prompt-card" ref={promptSectionRef}>
              <p className="prompt-label">What do you want to understand?</p>
              <form onSubmit={onSubmit} className="prompt-form">
                <input
                  type="text"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  disabled={isTransitioning}
                  placeholder="Try: Why does the unit circle work?"
                  className="prompt-input"
                  aria-label="Math concept input"
                />
                <button type="submit" disabled={isTransitioning || !concept.trim()} className="primary-btn">
                  Start Visual Lesson
                </button>
              </form>
              <p className="small-muted">Visual math intuition, one step at a time</p>
            </section>

            <div className="chip-wrap">
              <SuggestionChips
                disabled={isTransitioning}
                onSelect={(chip) => {
                  setConcept(chip);
                  submitConcept(chip);
                }}
              />
            </div>
          </>
        ) : (
          <div className="locked-card">
            <p className="locked-title">Sign in to unlock your interactive math tutor</p>
            <p className="small-muted">After login, you can ask any concept and start a guided visual lesson.</p>
          </div>
        )}
      </section>

      <div className="transition-shade" />
    </main>
  );
}
