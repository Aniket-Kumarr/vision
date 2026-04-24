'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import ChalkParticles from '@/components/ChalkParticles';
import {
  VISUA_AI_CONCEPT_KEY,
  VISUA_AI_SUBJECT_KEY,
  VISUA_AI_TOPIC_KEY,
  VISUA_AI_USER_KEY,
  type VisuaAiUser,
} from '@/lib/auth';
import { listDue } from '@/lib/quizDeck';

const WARM_CHALK_DUST: [number, number, number][] = [
  [192, 90, 40],
  [37, 96, 96],
  [122, 90, 66],
  [180, 140, 70],
];

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.05 + i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

type Subject = 'math' | 'physics' | 'chemistry' | 'biology';

export default function WelcomePage() {
  const router = useRouter();
  const [user, setUser] = useState<VisuaAiUser | null>(null);
  const [dueCount, setDueCount] = useState(0);
  const [threeDMode, setThreeDMode] = useState(false);
  const [quickConcept, setQuickConcept] = useState('');

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem(VISUA_AI_USER_KEY) ?? localStorage.getItem('mathcanvas_user');
      if (!raw) {
        router.replace('/');
        return;
      }
      setUser(JSON.parse(raw) as VisuaAiUser);
    } catch {
      router.replace('/');
    }
  }, [router]);

  // Load due card count (SSR-safe — runs only in browser after mount)
  useEffect(() => {
    setDueCount(listDue().length);
  }, []);

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const chooseSubject = (subject: Subject) => {
    try {
      localStorage.setItem(VISUA_AI_SUBJECT_KEY, subject);
    } catch {
      // ignore
    }
    router.push(`/chat?subject=${subject}`);
  };

  const onQuickSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = quickConcept.trim();
    if (!trimmed) return;
    const topic = trimmed.length > 56 ? `${trimmed.slice(0, 54)}…` : trimmed;
    try {
      localStorage.setItem(VISUA_AI_CONCEPT_KEY, trimmed);
      localStorage.setItem(VISUA_AI_TOPIC_KEY, topic);
    } catch {
      // ignore storage errors
    }
    // Route based on the 3D toggle — this is the hand-off to /canvas vs
    // /canvas-3d. We URL-encode the concept so it survives the query string.
    if (threeDMode) {
      router.push(`/canvas-3d?c=${encodeURIComponent(trimmed)}`);
    } else {
      router.push('/canvas');
    }
  };

  const signOut = () => {
    try {
      localStorage.removeItem(VISUA_AI_USER_KEY);
      localStorage.removeItem('mathcanvas_user');
    } catch {
      // ignore
    }
    router.push('/');
  };

  if (!user) {
    return (
      <main className="chat-session-page">
        <div className="chat-session-inner" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
          <p className="small-muted">Checking session…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="chat-session-page welcome-page">
      <ChalkParticles count={18} colors={WARM_CHALK_DUST} className="chat-ambient" />

      <motion.header
        className="chat-session-nav"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="chat-session-logo">Visua AI</span>
        <div className="chat-session-nav-right">
          <Link
            href="/review"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              color: 'rgba(245,240,232,0.6)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              letterSpacing: '0.03em',
            }}
          >
            Review
            {dueCount > 0 && (
              <span
                style={{
                  background: 'rgba(127,217,127,0.2)',
                  border: '1px solid rgba(127,217,127,0.45)',
                  borderRadius: 10,
                  padding: '1px 7px',
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'rgba(127,217,127,0.9)',
                  lineHeight: '16px',
                }}
              >
                {dueCount}
              </span>
            )}
          </Link>
          {user.picture ? (
            <Image src={user.picture} alt="" width={32} height={32} className="avatar" />
          ) : null}
          <span className="chat-session-name">{firstName}</span>
          <button type="button" className="ghost-btn" onClick={signOut}>
            Sign out
          </button>
        </div>
      </motion.header>

      <div className="welcome-inner">
        <motion.section
          className="welcome-hero"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
          }}
        >
          <motion.p className="chat-eyebrow" variants={fadeUp} custom={0}>
            Welcome back
          </motion.p>
          <motion.h1 className="welcome-title" variants={fadeUp} custom={1}>
            Hi {firstName}, what do you want to{' '}
            <span className="chat-title-accent">
              learn
              <svg
                className="handwritten-underline"
                viewBox="0 0 200 14"
                preserveAspectRatio="none"
                aria-hidden
              >
                <path d="M4 9 Q 50 3, 100 8 T 196 7" />
              </svg>
            </span>{' '}
            today?
          </motion.h1>
          <motion.p className="welcome-lede" variants={fadeUp} custom={2}>
            Visua AI turns any concept into a hand-drawn visual lesson. Pick a subject below and type
            whatever is stuck in your head — we&apos;ll build it on the chalkboard, one step at a time.
          </motion.p>
        </motion.section>

        <motion.div
          className="welcome-grid"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.12, delayChildren: 0.25 } },
          }}
        >
          <motion.button
            type="button"
            className="welcome-card welcome-card-math"
            variants={fadeUp}
            custom={0}
            onClick={() => chooseSubject('math')}
            aria-label="Enter the math workspace"
          >
            <div className="welcome-card-noise" aria-hidden />
            <div className="welcome-card-inner">
              <span className="welcome-card-kicker">Subject</span>
              <h2 className="welcome-card-title">Math</h2>
              <p className="welcome-card-tagline">
                unit circles, derivatives, areas under curves
              </p>
              <p className="welcome-card-desc">
                Proofs, graphs, and geometry worked out on screen. Trig, calculus, algebra — anything
                you can picture.
              </p>
              <span className="welcome-card-cta">
                Start drawing <span aria-hidden>→</span>
              </span>
            </div>
          </motion.button>

          <motion.button
            type="button"
            className="welcome-card welcome-card-physics"
            variants={fadeUp}
            custom={1}
            onClick={() => chooseSubject('physics')}
            aria-label="Enter the physics workspace"
          >
            <div className="welcome-card-noise" aria-hidden />
            <div className="welcome-card-inner">
              <span className="welcome-card-kicker">Subject</span>
              <h2 className="welcome-card-title">Physics</h2>
              <p className="welcome-card-tagline">
                forces, motion, energy, waves
              </p>
              <p className="welcome-card-desc">
                Free-body diagrams, projectile paths, and energy flows sketched step by step. Mechanics
                first — more coming.
              </p>
              <span className="welcome-card-cta">
                Start drawing <span aria-hidden>→</span>
              </span>
            </div>
          </motion.button>

          <motion.button
            type="button"
            className="welcome-card welcome-card-chemistry"
            variants={fadeUp}
            custom={2}
            onClick={() => chooseSubject('chemistry')}
            aria-label="Enter the chemistry workspace"
          >
            <div className="welcome-card-noise" aria-hidden />
            <div className="welcome-card-inner">
              <span className="welcome-card-kicker">Subject</span>
              <h2 className="welcome-card-title">Chemistry</h2>
              <p className="welcome-card-tagline">
                orbitals, reactions, energy diagrams
              </p>
              <p className="welcome-card-desc">
                Structural diagrams, orbital shapes, reaction arrows, and titration curves drawn
                step by step on the chalkboard.
              </p>
              <span className="welcome-card-cta">
                Start drawing <span aria-hidden>→</span>
              </span>
            </div>
          </motion.button>

          <motion.button
            type="button"
            className="welcome-card welcome-card-biology"
            variants={fadeUp}
            custom={3}
            onClick={() => chooseSubject('biology')}
            aria-label="Enter the biology workspace"
          >
            <div className="welcome-card-noise" aria-hidden />
            <div className="welcome-card-inner">
              <span className="welcome-card-kicker">Subject</span>
              <h2 className="welcome-card-title">Biology</h2>
              <p className="welcome-card-tagline">
                cycles, organelles, genetics, action potentials
              </p>
              <p className="welcome-card-desc">
                Process diagrams, Krebs cycles, Punnett squares, and membrane dynamics visualized
                one step at a time.
              </p>
              <span className="welcome-card-cta">
                Start drawing <span aria-hidden>→</span>
              </span>
            </div>
          </motion.button>
        </motion.div>

        <motion.div
<<<<<<< HEAD
          className="welcome-latex-link"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65, duration: 0.5 }}
        >
          <button
            type="button"
            className="ghost-btn welcome-latex-btn"
            onClick={() => router.push('/latex')}
          >
            Paste LaTeX <span aria-hidden>→</span>
          </button>
          <span className="welcome-latex-hint">Have an equation from a textbook? Visualize it directly.</span>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{
            marginTop: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 12,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'rgba(245,240,232,0.45)',
              }}
            >
              Quick launch
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={threeDMode}
              aria-label="Toggle 3D mode"
              onClick={() => setThreeDMode((v) => !v)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 999,
                border: `1px solid ${
                  threeDMode ? 'rgba(127,255,239,0.55)' : 'rgba(245,240,232,0.25)'
                }`,
                background: threeDMode ? 'rgba(127,255,239,0.12)' : 'rgba(245,240,232,0.04)',
                color: threeDMode ? '#7FFFEF' : 'rgba(245,240,232,0.65)',
                fontFamily: "'Inter', sans-serif",
                fontSize: 12,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <span
                aria-hidden
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: threeDMode ? '#7FFFEF' : 'rgba(245,240,232,0.3)',
                  boxShadow: threeDMode ? '0 0 8px rgba(127,255,239,0.7)' : 'none',
                }}
              />
              3D mode {threeDMode ? 'on' : 'off'}
            </button>
          </div>

          <form
            onSubmit={onQuickSubmit}
            style={{
              display: 'flex',
              gap: '0.5rem',
              width: '100%',
              maxWidth: 520,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <input
              type="text"
              value={quickConcept}
              onChange={(e) => setQuickConcept(e.target.value)}
              placeholder={
                threeDMode
                  ? 'e.g. cross product, paraboloid, plane through 3 points'
                  : 'e.g. unit circle, derivatives, projectile motion'
              }
              aria-label="Concept input"
              style={{
                flex: '1 1 280px',
                minWidth: 0,
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid rgba(245,240,232,0.2)',
                background: 'rgba(245,240,232,0.04)',
                color: '#F5F0E8',
                fontFamily: "'Inter', sans-serif",
                fontSize: 14,
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={!quickConcept.trim()}
              style={{
                padding: '10px 18px',
                borderRadius: 10,
                border: '1px solid rgba(245,240,232,0.28)',
                background: quickConcept.trim()
                  ? 'rgba(245,240,232,0.12)'
                  : 'rgba(245,240,232,0.05)',
                color: quickConcept.trim() ? '#F5F0E8' : 'rgba(245,240,232,0.4)',
                fontFamily: "'Inter', sans-serif",
                fontSize: 13,
                letterSpacing: '0.04em',
                cursor: quickConcept.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              {threeDMode ? 'Open 3D board →' : 'Start lesson →'}
            </button>
          </form>
        </motion.section>

        <motion.div
          className="welcome-foot-row"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}
        >
          <p className="welcome-foot">
            You can switch subjects any time from the top bar.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => router.push('/challenge')}
              style={{ fontSize: 13, opacity: 0.65 }}
              aria-label="Open challenge mode"
            >
              Challenge mode →
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => router.push('/compare')}
              style={{ fontSize: 13, opacity: 0.6 }}
            >
              Compare Models →
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
