'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import ChalkParticles from '@/components/ChalkParticles';
import { VISUA_AI_SUBJECT_KEY, VISUA_AI_USER_KEY, type VisuaAiUser } from '@/lib/auth';

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

type Subject = 'math' | 'physics';

export default function WelcomePage() {
  const router = useRouter();
  const [user, setUser] = useState<VisuaAiUser | null>(null);

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

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  const chooseSubject = (subject: Subject) => {
    try {
      localStorage.setItem(VISUA_AI_SUBJECT_KEY, subject);
    } catch {
      // ignore
    }
    router.push(`/chat?subject=${subject}`);
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
        </motion.div>

        <motion.p
          className="welcome-foot"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          You can switch subjects any time from the top bar.
        </motion.p>
      </div>
    </main>
  );
}
