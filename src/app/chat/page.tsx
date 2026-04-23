'use client';

import { FormEvent, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import ChalkParticles from '@/components/ChalkParticles';
import PhysicsDoodles from '@/components/PhysicsDoodles';
import SuggestionChips from '@/components/SuggestionChips';
import {
  VISUA_AI_CONCEPT_KEY,
  VISUA_AI_SUBJECT_KEY,
  VISUA_AI_TOPIC_KEY,
  VISUA_AI_USER_KEY,
  type VisuaAiUser,
} from '@/lib/auth';
import {
  displayTopicForUserConcept,
  promptForUserConcept,
  SUGGESTION_CHIPS,
  SUGGESTION_TO_PROMPT,
} from '@/lib/conceptPrompts';
import {
  PHYSICS_SUGGESTION_CHIPS,
  PHYSICS_SUGGESTION_TO_PROMPT,
  displayPhysicsTopicForUserConcept,
  physicsPromptForUserConcept,
} from '@/lib/physicsPrompts';
import { detectSubjectScope } from '@/lib/subjectScope';

type Subject = 'math' | 'physics';
import {
  type LessonHistoryItem,
  clearLessons,
  getLessons,
  removeLesson,
  setReplay,
} from '@/lib/lessonHistory';

function relativeTime(ts: number): string {
  const d = (Date.now() - ts) / 1000;
  if (d < 30) return 'just now';
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  if (d < 604800) return `${Math.floor(d / 86400)}d ago`;
  return new Date(ts).toLocaleDateString();
}

interface LessonHistoryProps {
  disabled: boolean;
  subject: 'math' | 'physics';
  onReplay: (item: LessonHistoryItem) => void;
}

function LessonHistory({ disabled, subject, onReplay }: LessonHistoryProps) {
  const [items, setItems] = useState<LessonHistoryItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(getLessons());
    setHydrated(true);
  }, [subject]);

  const filtered = items.filter((it) => (it.subject ?? 'math') === subject);

  if (!hydrated || filtered.length === 0) return null;

  return (
    <motion.section
      className="lesson-history"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Recent lessons"
    >
      <div className="lesson-history-header">
        <h2 className="lesson-history-title">Recent lessons</h2>
        <button
          type="button"
          className="lesson-history-clear"
          onClick={() => {
            clearLessons();
            setItems([]);
          }}
        >
          Clear all
        </button>
      </div>
      <ul className="lesson-history-list">
        {filtered.map((item) => (
          <li key={item.id} className="lesson-history-item">
            <button
              type="button"
              className="lesson-history-card"
              disabled={disabled}
              onClick={() => onReplay(item)}
              title={`Replay: ${item.topic}`}
            >
              <span className="lesson-history-topic">{item.topic}</span>
              <span className="lesson-history-meta">
                <span className="lesson-history-time">{relativeTime(item.createdAt)}</span>
                <span className="lesson-history-arrow" aria-hidden>
                  →
                </span>
              </span>
            </button>
            <button
              type="button"
              className="lesson-history-delete"
              aria-label={`Remove ${item.topic} from history`}
              disabled={disabled}
              onClick={() => {
                removeLesson(item.id);
                setItems(getLessons());
              }}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </motion.section>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

// Warm-toned dust to match the cream chalkboard-lecture aesthetic.
const WARM_CHALK_DUST: [number, number, number][] = [
  [192, 90, 40],   // burnt orange
  [37, 96, 96],    // deep teal
  [122, 90, 66],   // warm brown
  [180, 140, 70],  // honey gold
];

const LILAC_CHALK_DUST: [number, number, number][] = [
  [110, 86, 160],  // deep violet
  [150, 120, 200], // soft purple
  [90, 100, 170],  // indigo-blue
  [180, 160, 220], // light lavender
];

function Typewriter({ text, startDelayMs = 0, charMs = 18 }: { text: string; startDelayMs?: number; charMs?: number }) {
  const [shown, setShown] = useState(0);
  const doneRef = useRef(false);
  useEffect(() => {
    let raf = 0;
    let timeout = 0;
    const start = () => {
      const t0 = performance.now();
      const step = (now: number) => {
        const elapsed = now - t0;
        const next = Math.min(text.length, Math.floor(elapsed / charMs));
        setShown(next);
        if (next < text.length) {
          raf = requestAnimationFrame(step);
        } else {
          doneRef.current = true;
        }
      };
      raf = requestAnimationFrame(step);
    };
    timeout = window.setTimeout(start, startDelayMs);
    return () => {
      window.clearTimeout(timeout);
      cancelAnimationFrame(raf);
    };
  }, [text, startDelayMs, charMs]);
  return (
    <>
      {text.slice(0, shown)}
      {shown < text.length ? <span className="chat-typewriter-caret" aria-hidden /> : null}
    </>
  );
}

function TutorAvatar() {
  return (
    <div className="chat-tutor-avatar" aria-hidden>
      <span>V</span>
    </div>
  );
}

// Decorative math doodles. Pure SVG, low opacity, gently float.
function ChatDoodles() {
  return (
    <>
      {/* π symbol */}
      <svg className="chat-doodle chat-doodle--tl" viewBox="0 0 64 64" fill="none" aria-hidden>
        <path
          d="M10 22 Q12 18 18 18 L48 18 Q54 18 56 22"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path d="M22 22 L18 50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M40 22 L42 46 Q42 50 46 50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>

      {/* Sine wave fragment */}
      <svg className="chat-doodle chat-doodle--tr" viewBox="0 0 80 40" fill="none" aria-hidden>
        <path
          d="M4 20 Q14 4 24 20 T44 20 T64 20 T76 20"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>

      {/* Triangle */}
      <svg className="chat-doodle chat-doodle--ml" viewBox="0 0 60 60" fill="none" aria-hidden>
        <path d="M8 50 L52 50 L30 10 Z" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M8 50 L30 30" stroke="currentColor" strokeWidth="2" strokeDasharray="3 4" />
      </svg>

      {/* Circle with axis (unit circle nod) */}
      <svg className="chat-doodle chat-doodle--mr" viewBox="0 0 80 80" fill="none" aria-hidden>
        <circle cx="40" cy="40" r="28" stroke="currentColor" strokeWidth="2.5" />
        <path d="M8 40 L72 40 M40 8 L40 72" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M40 40 L60 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>

      {/* Integral glyph */}
      <svg className="chat-doodle chat-doodle--bl" viewBox="0 0 40 60" fill="none" aria-hidden>
        <path
          d="M26 6 Q14 6 14 22 L14 42 Q14 54 6 54"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <main className="chat-session-page">
          <div className="chat-session-inner" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
            <p className="small-muted">Loading…</p>
          </div>
        </main>
      }
    >
      <ChatPageInner />
    </Suspense>
  );
}

function ChatPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<VisuaAiUser | null>(null);
  const [concept, setConcept] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const subject: Subject = useMemo(() => {
    const q = searchParams.get('subject');
    if (q === 'math' || q === 'physics') return q;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(VISUA_AI_SUBJECT_KEY);
      if (stored === 'math' || stored === 'physics') return stored;
    }
    return 'math';
  }, [searchParams]);

  useEffect(() => {
    try {
      localStorage.setItem(VISUA_AI_SUBJECT_KEY, subject);
    } catch {
      // ignore
    }
  }, [subject]);

  const chips = subject === 'physics' ? PHYSICS_SUGGESTION_CHIPS : SUGGESTION_CHIPS;
  const promptMap: Record<string, string> =
    subject === 'physics' ? PHYSICS_SUGGESTION_TO_PROMPT : SUGGESTION_TO_PROMPT;
  const genericPrompt = subject === 'physics' ? physicsPromptForUserConcept : promptForUserConcept;
  const displayTopic =
    subject === 'physics' ? displayPhysicsTopicForUserConcept : displayTopicForUserConcept;

  const firstName = useMemo(() => {
    if (!user?.name) return 'there';
    return user.name.split(' ')[0];
  }, [user]);

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

  const [scopeBanner, setScopeBanner] = useState<{
    likelySubject: Subject;
    topic: string;
    prompt: string;
    display: string;
  } | null>(null);

  const startLesson = (topicLabel: string, apiPrompt: string) => {
    const prompt = apiPrompt.trim();
    const topic = (topicLabel.trim() || displayTopic(prompt)).slice(0, 120);
    if (!prompt || isTransitioning) return;
    localStorage.setItem(VISUA_AI_CONCEPT_KEY, prompt);
    localStorage.setItem(VISUA_AI_TOPIC_KEY, topic);
    setIsTransitioning(true);
    window.setTimeout(() => router.push('/canvas'), 380);
  };

  const replayLesson = (item: LessonHistoryItem) => {
    if (isTransitioning) return;
    // Stash the cached blueprint so /canvas skips the Anthropic call.
    setReplay(item.blueprint);
    startLesson(item.topic, item.concept);
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const raw = concept.trim();
    if (!raw) return;
    const scope = detectSubjectScope(raw, subject);
    if (scope.mismatch && scope.likelySubject) {
      setScopeBanner({
        likelySubject: scope.likelySubject,
        topic: displayTopic(raw),
        prompt: genericPrompt(raw),
        display: raw,
      });
      return;
    }
    setScopeBanner(null);
    startLesson(displayTopic(raw), genericPrompt(raw));
  };

  const dismissScopeBanner = () => setScopeBanner(null);

  const switchSubjectAndStart = () => {
    if (!scopeBanner) return;
    const target = scopeBanner.likelySubject;
    try {
      localStorage.setItem(VISUA_AI_SUBJECT_KEY, target);
    } catch {
      // ignore
    }
    // Stash the concept so the new subject's /chat can pick up the input.
    setConcept(scopeBanner.display);
    setScopeBanner(null);
    router.push(`/chat?subject=${target}`);
  };

  const continueAnyway = () => {
    if (!scopeBanner) return;
    const { topic, prompt } = scopeBanner;
    setScopeBanner(null);
    startLesson(topic, prompt);
  };

  const signOut = () => {
    localStorage.removeItem(VISUA_AI_USER_KEY);
    localStorage.removeItem('mathcanvas_user');
    localStorage.removeItem(VISUA_AI_CONCEPT_KEY);
    localStorage.removeItem(VISUA_AI_TOPIC_KEY);
    localStorage.removeItem('mathcanvas_concept');
    localStorage.removeItem('mathcanvas_topic');
    localStorage.removeItem('vision_concept');
    setUser(null);
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
    <main
      className={`chat-session-page subject-${subject} ${
        isTransitioning ? 'is-transitioning' : ''
      }`}
    >
      {/* Ambient warm chalk dust drifting up — subtle, low count */}
      <ChalkParticles
        count={22}
        colors={subject === 'physics' ? LILAC_CHALK_DUST : WARM_CHALK_DUST}
        className="chat-ambient"
      />

      {/* Static decorative doodles in margins — swap with subject */}
      {subject === 'physics' ? <PhysicsDoodles /> : <ChatDoodles />}

      <motion.header
        className="chat-session-nav"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="chat-session-nav-left">
          <span className="chat-session-logo">Visua AI</span>
          <span className="chat-subject-pill" aria-label={`Current subject: ${subject}`}>
            {subject === 'physics' ? 'Physics' : 'Math'}
          </span>
        </div>
        <div className="chat-session-nav-right">
          <button
            type="button"
            className="ghost-btn"
            onClick={() => router.push('/welcome')}
            aria-label="Back to subject picker"
          >
            ← Home
          </button>
          {user.picture ? (
            <Image src={user.picture} alt="" width={32} height={32} className="avatar" />
          ) : null}
          <span className="chat-session-name">{firstName}</span>
          <button type="button" className="ghost-btn" onClick={signOut}>
            Sign out
          </button>
        </div>
      </motion.header>

      <div className="chat-session-inner">
        <motion.section
          className="chat-session-hero"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
          }}
        >
          <motion.p className="chat-eyebrow" variants={fadeUp} custom={0}>
            Your session
          </motion.p>
          <motion.h1 className="chat-session-title" variants={fadeUp} custom={1}>
            Hi {firstName}, what should we{' '}
            <span className="chat-title-accent">
              visualize
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
          <motion.p className="chat-session-lede" variants={fadeUp} custom={2}>
            Every concept is visual. We draw it for you. Type a topic below and we&apos;ll build it on the
            chalkboard, one step at a time.
          </motion.p>
        </motion.section>

        <motion.div
          className="chatbot-panel"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="chatbot-thread">
            <motion.div
              className="chat-bot-row"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.45, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <TutorAvatar />
              <div className="bot-bubble chat-bubble">
                <Typewriter
                  text={
                    subject === 'physics'
                      ? "I'm ready when you are. Ask about any topic — free-body diagrams, projectile motion, energy, waves, or something you're stuck on in class."
                      : "I'm ready when you are. Ask about any topic — unit circle, derivatives, area puzzles, or something you're stuck on in class."
                  }
                  startDelayMs={650}
                  charMs={14}
                />
              </div>
            </motion.div>
          </div>

          <p className="prompt-label">What do you want to understand?</p>

          {scopeBanner ? (
            <div
              className="scope-banner"
              role="alert"
              aria-live="polite"
            >
              <div className="scope-banner-body">
                <p className="scope-banner-title">
                  That sounds like a{' '}
                  <strong>{scopeBanner.likelySubject === 'math' ? 'math' : 'physics'}</strong>{' '}
                  topic.
                </p>
                <p className="scope-banner-text">
                  You&apos;re currently in the {subject === 'physics' ? 'Physics' : 'Math'} workspace.
                  Want to switch?
                </p>
              </div>
              <div className="scope-banner-actions">
                <button type="button" className="scope-banner-primary" onClick={switchSubjectAndStart}>
                  Switch to {scopeBanner.likelySubject === 'math' ? 'Math' : 'Physics'} →
                </button>
                <button type="button" className="scope-banner-secondary" onClick={continueAnyway}>
                  Continue anyway
                </button>
                <button
                  type="button"
                  className="scope-banner-dismiss"
                  aria-label="Dismiss"
                  onClick={dismissScopeBanner}
                >
                  ×
                </button>
              </div>
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="prompt-form">
            <input
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              disabled={isTransitioning}
              placeholder={
                subject === 'physics'
                  ? 'e.g. Why does a projectile travel in a parabola?'
                  : 'e.g. Explain the unit circle intuitively'
              }
              className="prompt-input"
              aria-label="Concept input"
            />
            <motion.button
              type="submit"
              disabled={isTransitioning || !concept.trim()}
              className="primary-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <span>Start lesson</span>
              <svg
                className="btn-sparkle"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M12 3 L13.5 9 L20 10.5 L13.5 12 L12 18 L10.5 12 L4 10.5 L10.5 9 Z" />
                <path d="M19 17 L19.8 19 L21.8 19.8 L19.8 20.6 L19 22.6 L18.2 20.6 L16.2 19.8 L18.2 19 Z" opacity="0.7" />
              </svg>
            </motion.button>
          </form>
          <p className="small-muted">Press Enter or pick a suggestion to open the chalkboard.</p>
        </motion.div>

        <div className="chip-wrap">
          <SuggestionChips
            disabled={isTransitioning}
            chips={chips}
            onSelect={(chip) => {
              setConcept(chip);
              const prompt = promptMap[chip] ?? genericPrompt(chip);
              startLesson(chip, prompt);
            }}
          />
        </div>

        <LessonHistory disabled={isTransitioning} subject={subject} onReplay={replayLesson} />
      </div>

      <div className="transition-shade" />
    </main>
  );
}
