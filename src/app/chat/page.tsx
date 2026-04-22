'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import SuggestionChips from '@/components/SuggestionChips';
import {
  MATHCANVAS_CONCEPT_KEY,
  MATHCANVAS_TOPIC_KEY,
  MATHCANVAS_USER_KEY,
  type MathCanvasUser,
} from '@/lib/auth';
import {
  displayTopicForUserConcept,
  promptForUserConcept,
  SUGGESTION_TO_PROMPT,
} from '@/lib/conceptPrompts';

const fadeUp = {
  hidden: { opacity: 1, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<MathCanvasUser | null>(null);
  const [concept, setConcept] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const firstName = useMemo(() => {
    if (!user?.name) return 'there';
    return user.name.split(' ')[0];
  }, [user]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(MATHCANVAS_USER_KEY);
      if (!raw) {
        router.replace('/');
        return;
      }
      setUser(JSON.parse(raw) as MathCanvasUser);
    } catch {
      router.replace('/');
    }
  }, [router]);

  const startLesson = (topicLabel: string, apiPrompt: string) => {
    const prompt = apiPrompt.trim();
    const topic = (topicLabel.trim() || displayTopicForUserConcept(prompt)).slice(0, 120);
    if (!prompt || isTransitioning) return;
    localStorage.setItem(MATHCANVAS_CONCEPT_KEY, prompt);
    localStorage.setItem(MATHCANVAS_TOPIC_KEY, topic);
    setIsTransitioning(true);
    window.setTimeout(() => router.push('/canvas'), 380);
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const raw = concept.trim();
    if (!raw) return;
    startLesson(displayTopicForUserConcept(raw), promptForUserConcept(raw));
  };

  const signOut = () => {
    localStorage.removeItem(MATHCANVAS_USER_KEY);
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
    <main className={`chat-session-page ${isTransitioning ? 'is-transitioning' : ''}`}>
      <motion.header
        className="chat-session-nav"
        initial={false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <span className="chat-session-logo">MathCanvas</span>
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

      <div className="chat-session-inner">
        <motion.section
          className="chat-session-hero"
          initial={false}
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.1 } },
          }}
        >
          <motion.p className="chat-eyebrow" variants={fadeUp} custom={0}>
            Your session
          </motion.p>
          <motion.h1 className="chat-session-title" variants={fadeUp} custom={1}>
            Hi {firstName}, what should we visualize today?
          </motion.h1>
          <motion.p className="chat-session-lede" variants={fadeUp} custom={2}>
            Every concept is visual. We draw it for you. Type a topic below and we&apos;ll build it on the
            chalkboard, one step at a time.
          </motion.p>
        </motion.section>

        <motion.div
          className="chatbot-panel"
          initial={false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="chatbot-thread">
            <motion.div
              className="bot-bubble chat-bubble"
              initial={false}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35, duration: 0.4 }}
            >
              I&apos;m ready when you are. Ask about any topic: unit circle, derivatives, area puzzles, or
              something you&apos;re stuck on in class.
            </motion.div>
          </div>

          <p className="prompt-label">What do you want to understand?</p>
          <form onSubmit={onSubmit} className="prompt-form">
            <input
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              disabled={isTransitioning}
              placeholder="e.g. Explain the unit circle intuitively"
              className="prompt-input"
              aria-label="Math concept input"
            />
            <motion.button
              type="submit"
              disabled={isTransitioning || !concept.trim()}
              className="primary-btn"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Start lesson
            </motion.button>
          </form>
          <p className="small-muted">Press Enter or pick a suggestion to open the chalkboard.</p>
        </motion.div>

        <motion.div
          className="chip-wrap"
          initial={false}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.4 }}
        >
          <SuggestionChips
            disabled={isTransitioning}
            onSelect={(chip) => {
              setConcept(chip);
              const prompt =
                chip in SUGGESTION_TO_PROMPT
                  ? SUGGESTION_TO_PROMPT[chip as keyof typeof SUGGESTION_TO_PROMPT]
                  : promptForUserConcept(chip);
              startLesson(chip, prompt);
            }}
          />
        </motion.div>
      </div>

      <div className="transition-shade" />
    </main>
  );
}
