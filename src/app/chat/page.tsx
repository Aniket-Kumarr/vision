'use client';

import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import ChalkParticles from '@/components/ChalkParticles';
import PhysicsDoodles from '@/components/PhysicsDoodles';
import SuggestionChips from '@/components/SuggestionChips';
import VoiceInputButton from '@/components/VoiceInputButton';
import DifficultySlider from '@/components/DifficultySlider';
import PersonaPicker, { readStoredPersona } from '@/components/PersonaPicker';
import {
  VISUA_AI_CONCEPT_KEY,
  VISUA_AI_SUBJECT_KEY,
  VISUA_AI_TOPIC_KEY,
  VISUA_AI_USER_KEY,
  type VisuaAiUser,
} from '@/lib/auth';
import { type DifficultyLevel, type Persona } from '@/lib/types';
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
import {
  BIOLOGY_SUGGESTION_CHIPS,
  BIOLOGY_SUGGESTION_TO_PROMPT,
  displayBiologyTopicForUserConcept,
  biologyPromptForUserConcept,
} from '@/lib/biologyPrompts';
import {
  CS_SUGGESTION_CHIPS,
  CS_SUGGESTION_TO_PROMPT,
  displayCsTopicForUserConcept,
  csPromptForUserConcept,
} from '@/lib/csPrompts';
import { detectSubjectScope } from '@/lib/subjectScope';
import type { Blueprint } from '@/lib/types';

type Subject = 'math' | 'physics' | 'biology' | 'cs';
import {
  type LessonHistoryItem,
  clearLessons,
  clearReplay,
  getLessons,
  removeLesson,
  setReplay,
} from '@/lib/lessonHistory';
import StreakBadge from '@/components/StreakBadge';

/** Image upload constraints — kept in sync with /api/generate-from-image. */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

function describeImageValidation(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    return 'That file type is not supported. Use PNG, JPEG, WEBP, or GIF.';
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return 'That image is larger than 10 MB. Please upload a smaller photo.';
  }
  if (file.size === 0) {
    return 'That file is empty.';
  }
  return null;
}

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
  subject: Subject;
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

const GREEN_CHALK_DUST: [number, number, number][] = [
  [40, 140, 80],   // deep green
  [60, 180, 120],  // medium green
  [30, 110, 140],  // teal
  [100, 200, 160], // light cyan-green
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
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel>('college');
  const [showDifficultyPicker, setShowDifficultyPicker] = useState(false);
  const [persona, setPersona] = useState<Persona>('default');

  // --- Image upload state ---
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  // Track nested dragenter/dragleave events so overlay doesn't flicker.
  const dragCounterRef = useRef(0);

  // Revoke the preview object URL when we replace it or unmount — avoids leaks.
  useEffect(() => {
    return () => {
      if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    };
  }, [uploadPreview]);

  const subject: Subject = useMemo(() => {
    const q = searchParams.get('subject');
    if (q === 'math' || q === 'physics' || q === 'biology' || q === 'cs') return q;
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(VISUA_AI_SUBJECT_KEY);
      if (stored === 'math' || stored === 'physics' || stored === 'biology' || stored === 'cs') return stored as Subject;
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

  // Hydrate persisted persona after mount (SSR-safe).
  useEffect(() => {
    setPersona(readStoredPersona());
  }, []);

  const chips =
    subject === 'physics'
      ? PHYSICS_SUGGESTION_CHIPS
      : subject === 'biology'
        ? BIOLOGY_SUGGESTION_CHIPS
        : subject === 'cs'
          ? CS_SUGGESTION_CHIPS
          : SUGGESTION_CHIPS;
  const promptMap: Record<string, string> =
    subject === 'physics'
      ? PHYSICS_SUGGESTION_TO_PROMPT
      : subject === 'biology'
        ? BIOLOGY_SUGGESTION_TO_PROMPT
        : subject === 'cs'
          ? CS_SUGGESTION_TO_PROMPT
          : SUGGESTION_TO_PROMPT;
  const genericPrompt =
    subject === 'physics'
      ? physicsPromptForUserConcept
      : subject === 'biology'
        ? biologyPromptForUserConcept
        : subject === 'cs'
          ? csPromptForUserConcept
          : promptForUserConcept;
  const displayTopic =
    subject === 'physics'
      ? displayPhysicsTopicForUserConcept
      : subject === 'biology'
        ? displayBiologyTopicForUserConcept
        : subject === 'cs'
          ? displayCsTopicForUserConcept
          : displayTopicForUserConcept;

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

      // Load difficulty level from localStorage
      const savedLevel = localStorage.getItem('visua_ai_difficulty');
      if (savedLevel === 'kid' || savedLevel === 'student' || savedLevel === 'college' ||
          savedLevel === 'grad' || savedLevel === 'researcher') {
        setDifficultyLevel(savedLevel as DifficultyLevel);
      }
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
    // Any prior replay stash is for a different (or the same) lesson; drop it
    // so a freshly-typed concept regenerates rather than picking up a stale
    // cached blueprint.
    clearReplay();
    localStorage.setItem(VISUA_AI_CONCEPT_KEY, prompt);
    localStorage.setItem(VISUA_AI_TOPIC_KEY, topic);
    localStorage.setItem('visua_ai_difficulty', difficultyLevel);
    setIsTransitioning(true);
    window.setTimeout(() => router.push('/canvas'), 380);
  };

  const replayLesson = (item: LessonHistoryItem) => {
    if (isTransitioning) return;
    if (!item.blueprint) {
      // Legacy history entry without a cached blueprint — fall back to a
      // normal generate. Marked as non-replayable at the UI layer.
      startLesson(item.topic, item.concept);
      return;
    }
    // Stash the cached blueprint so /canvas skips the Anthropic call.
    // NOTE: setReplay must run BEFORE startLesson — startLesson calls
    // clearReplay() and would otherwise wipe our fresh stash.
    const prompt = item.concept.trim();
    const topic = (item.topic.trim() || displayTopic(prompt)).slice(0, 120);
    if (!prompt || isTransitioning) return;
    setReplay(prompt, item.blueprint);
    localStorage.setItem(VISUA_AI_CONCEPT_KEY, prompt);
    localStorage.setItem(VISUA_AI_TOPIC_KEY, topic);
    setIsTransitioning(true);
    window.setTimeout(() => router.push('/canvas'), 380);
  };

  /**
   * Upload an image, send it to /api/generate-from-image, then hand the
   * returned blueprint off to /canvas using the same localStorage protocol the
   * typed-concept path uses (set replay so /canvas doesn't re-call /api).
   */
  const uploadImage = useCallback(
    async (file: File) => {
      if (isTransitioning || isUploading) return;
      const validation = describeImageValidation(file);
      if (validation) {
        setUploadError(validation);
        return;
      }
      setUploadError(null);

      // Show a thumbnail in the thread while we wait.
      if (uploadPreview) URL.revokeObjectURL(uploadPreview);
      const previewUrl = URL.createObjectURL(file);
      setUploadPreview(previewUrl);
      setIsUploading(true);

      try {
        const form = new FormData();
        form.append('image', file);
        form.append('subject', subject);
        const hint = concept.trim();
        if (hint) form.append('concept', hint);

        const res = await fetch('/api/generate-from-image', {
          method: 'POST',
          body: form,
        });

        if (!res.ok) {
          let message = `Upload failed (${res.status})`;
          try {
            const body = (await res.json()) as { error?: string };
            if (typeof body?.error === 'string' && body.error.trim()) {
              message = body.error.trim();
            }
          } catch {
            /* body wasn't JSON; keep default */
          }
          throw new Error(message);
        }

        const data = (await res.json()) as { blueprint?: Blueprint; error?: string };
        if (!data.blueprint) {
          throw new Error(data.error ?? 'No blueprint returned.');
        }

        const topic = (data.blueprint.title || 'Image lesson').slice(0, 120);
        // Persist a minimal concept string for downstream screens (history,
        // follow-up questions) that read it from localStorage.
        const storedConcept = hint
          ? `Image upload — ${hint}`
          : `Image upload — ${topic}`;
        // Hand off exactly like the typed-concept path: stash the replay
        // so /canvas renders without hitting /api/generate again. The stash
        // is keyed by concept so /canvas knows it belongs to this lesson.
        setReplay(storedConcept, data.blueprint);
        startLesson(topic, storedConcept);
      } catch (err) {
        const message = err instanceof Error && err.message ? err.message : 'Upload failed.';
        setUploadError(message);
        setIsUploading(false);
        // Leave the thumbnail visible so the user sees which upload failed.
      }
    },
    // startLesson is stable within the render (closure over router) — no need to memoise.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [concept, isTransitioning, isUploading, subject, uploadPreview],
  );

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset the input so re-selecting the same file still fires change.
    e.target.value = '';
    if (file) void uploadImage(file);
  };

  const onPickImage = () => {
    if (isTransitioning || isUploading) return;
    setUploadError(null);
    fileInputRef.current?.click();
  };

  const clearUpload = () => {
    if (uploadPreview) URL.revokeObjectURL(uploadPreview);
    setUploadPreview(null);
    setUploadError(null);
  };

  // --- Drag and drop ---
  const onDragEnter = (e: DragEvent<HTMLElement>) => {
    if (isTransitioning || isUploading) return;
    if (!Array.from(e.dataTransfer.types ?? []).includes('Files')) return;
    e.preventDefault();
    dragCounterRef.current += 1;
    setIsDragActive(true);
  };

  const onDragOver = (e: DragEvent<HTMLElement>) => {
    if (isTransitioning || isUploading) return;
    if (!Array.from(e.dataTransfer.types ?? []).includes('Files')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const onDragLeave = (e: DragEvent<HTMLElement>) => {
    if (isTransitioning || isUploading) return;
    e.preventDefault();
    dragCounterRef.current = Math.max(0, dragCounterRef.current - 1);
    if (dragCounterRef.current === 0) setIsDragActive(false);
  };

  const onDrop = (e: DragEvent<HTMLElement>) => {
    if (isTransitioning || isUploading) return;
    e.preventDefault();
    dragCounterRef.current = 0;
    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void uploadImage(file);
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
      } ${isDragActive ? 'is-drag-active' : ''}`}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Drop-zone overlay — appears when the user drags an image over the page */}
      {isDragActive ? (
        <div className="chat-dropzone-overlay" aria-hidden>
          <div className="chat-dropzone-card">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
            <p>Drop your image here</p>
            <p className="chat-dropzone-sub">PNG, JPEG, WEBP, or GIF — up to 10 MB</p>
          </div>
        </div>
      ) : null}

      {/* Ambient warm chalk dust drifting up — subtle, low count */}
      <ChalkParticles
        count={22}
        colors={
          subject === 'physics'
            ? LILAC_CHALK_DUST
            : subject === 'cs'
              ? GREEN_CHALK_DUST
              : WARM_CHALK_DUST
        }
        className="chat-ambient"
      />

      {/* Static decorative doodles in margins — swap with subject */}
      {subject === 'physics' || subject === 'biology' ? (
        <PhysicsDoodles />
      ) : (
        <ChatDoodles />
      )}


      <motion.header
        className="chat-session-nav"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="chat-session-nav-left">
          <span className="chat-session-logo">Visua AI</span>
          <span className="chat-subject-pill" aria-label={`Current subject: ${subject}`}>
            {subject === 'physics'
              ? 'Physics'
              : subject === 'biology'
                ? 'Biology'
                : subject === 'cs'
                  ? 'CS'
                  : 'Math'}
          </span>
          <button
            type="button"
            className="difficulty-level-pill"
            onClick={() => setShowDifficultyPicker(!showDifficultyPicker)}
            aria-label="Change explanation difficulty level"
            title="Change explanation difficulty level"
          >
            <span>Level: {difficultyLevel.charAt(0).toUpperCase() + difficultyLevel.slice(1)}</span>
          </button>
          <PersonaPicker value={persona} onChange={setPersona} compact />
        </div>
        <div className="chat-session-nav-right">
          <StreakBadge />
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
                      ? "I'm ready when you are. Ask about any topic — free-body diagrams, projectile motion, energy, waves, or something you're stuck on in class. You can also upload a photo of a problem."
                      : subject === 'biology'
                        ? "I'm ready when you are. Ask about any biology topic — action potentials, the Krebs cycle, Punnett squares, or something you're stuck on in class. You can also upload a photo."
                        : subject === 'cs'
                          ? "I'm ready when you are. Ask about any algorithm or data structure — bubble sort, BFS, recursion trees, hash tables, binary search, or anything you want to visualize. You can also upload a photo."
                          : "I'm ready when you are. Ask about any topic — unit circle, derivatives, area puzzles, or something you're stuck on in class. You can also upload a photo of a problem."
                  }
                  startDelayMs={650}
                  charMs={14}
                />
              </div>
            </motion.div>

            {uploadPreview ? (
              <motion.div
                className="chat-user-row chat-user-row--image"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className="user-bubble chat-bubble chat-image-bubble">
                  {/* Native img is intentional — previewUrl is a local object URL
                      that next/image's loader cannot stream or optimize. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={uploadPreview}
                    alt="Uploaded problem"
                    className="chat-image-thumb"
                  />
                  <div className="chat-image-meta">
                    {isUploading ? (
                      <span className="chat-image-status">
                        <span className="chat-image-spinner" aria-hidden />
                        Reading your image…
                      </span>
                    ) : (
                      <span className="chat-image-status">Image attached</span>
                    )}
                    {!isUploading ? (
                      <button
                        type="button"
                        className="chat-image-remove"
                        onClick={clearUpload}
                        aria-label="Remove uploaded image"
                      >
                        ×
                      </button>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            ) : null}

            {uploadError ? (
              <div className="chat-error-row" role="alert" aria-live="polite">
                <div className="chat-error-bubble">
                  <strong>Couldn&apos;t use that image.</strong>
                  <span>{uploadError}</span>
                </div>
              </div>
            ) : null}
          </div>

          <p className="prompt-label">What do you want to understand?</p>

          {showDifficultyPicker ? (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="difficulty-picker-wrapper"
            >
              <DifficultySlider
                initialLevel={difficultyLevel}
                onChangeLevel={(level) => {
                  setDifficultyLevel(level);
                  try {
                    localStorage.setItem('visua_ai_difficulty', level);
                  } catch {
                    // ignore
                  }
                }}
              />
            </motion.div>
          ) : null}

          {scopeBanner ? (
            <div
              className="scope-banner"
              role="alert"
              aria-live="polite"
            >
              <div className="scope-banner-body">
                <p className="scope-banner-title">
                  That sounds like a{' '}
                  <strong>
                    {scopeBanner.likelySubject === 'math'
                      ? 'math'
                      : scopeBanner.likelySubject === 'physics'
                        ? 'physics'
                        : scopeBanner.likelySubject === 'biology'
                          ? 'biology'
                          : 'CS'}
                  </strong>{' '}
                  topic.
                </p>
                <p className="scope-banner-text">
                  You&apos;re currently in the{' '}
                  {subject === 'physics'
                    ? 'Physics'
                    : subject === 'biology'
                      ? 'Biology'
                      : subject === 'cs'
                        ? 'CS'
                        : 'Math'}{' '}
                  workspace. Want to switch?
                </p>
              </div>
              <div className="scope-banner-actions">
                <button type="button" className="scope-banner-primary" onClick={switchSubjectAndStart}>
                  Switch to{' '}
                  {scopeBanner.likelySubject === 'math'
                    ? 'Math'
                    : scopeBanner.likelySubject === 'physics'
                      ? 'Physics'
                      : scopeBanner.likelySubject === 'biology'
                        ? 'Biology'
                        : 'CS'}{' '}
                  →
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
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="chat-file-input"
              onChange={onFileInputChange}
              tabIndex={-1}
              aria-hidden
            />
            <button
              type="button"
              className="chat-attach-btn"
              onClick={onPickImage}
              disabled={isTransitioning || isUploading}
              aria-label="Upload an image of a problem"
              title="Upload an image (PNG, JPEG, WEBP, GIF — up to 10 MB)"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 17.98 8.9l-8.58 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
            <div className="prompt-form-input-wrapper">
              <input
                type="text"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                disabled={isTransitioning || isUploading}
                placeholder={
                  subject === 'physics'
                    ? 'e.g. Why does a projectile travel in a parabola?'
                    : subject === 'biology'
                      ? 'e.g. Walk me through the Krebs cycle'
                      : subject === 'cs'
                        ? 'e.g. How does quicksort partition an array?'
                        : 'e.g. Explain the unit circle intuitively'
                }
                className="prompt-input"
                aria-label="Concept input"
              />
              <VoiceInputButton
                onTranscript={(text) => setConcept(text)}
                disabled={isTransitioning || isUploading}
              />
            </div>
            <motion.button
              type="submit"
              disabled={isTransitioning || isUploading || !concept.trim()}
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
