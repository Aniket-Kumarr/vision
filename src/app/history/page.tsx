'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import ChalkParticles from '@/components/ChalkParticles';
import {
  getLessons,
  type LessonHistoryItem,
  setReplay,
  getCurrentStreak,
  subjectForLesson,
} from '@/lib/lessonHistory';
import { VISUA_AI_CONCEPT_KEY, VISUA_AI_SUBJECT_KEY, VISUA_AI_TOPIC_KEY, VISUA_AI_USER_KEY, type VisuaAiUser } from '@/lib/auth';

const WARM_CHALK_DUST: [number, number, number][] = [
  [192, 90, 40],
  [37, 96, 96],
  [122, 90, 66],
  [180, 140, 70],
];

function formatDate(ts: number): string {
  const date = new Date(ts);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const checkDate = new Date(ts);
  checkDate.setHours(0, 0, 0, 0);

  if (checkDate.getTime() === today.getTime()) {
    return 'Today';
  } else if (checkDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  }
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

function relativeTime(ts: number): string {
  const d = (Date.now() - ts) / 1000;
  if (d < 60) return 'just now';
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  if (d < 604800) return `${Math.floor(d / 86400)}d ago`;
  return 'older';
}

interface GroupedLessons {
  [dateStr: string]: LessonHistoryItem[];
}

export default function HistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<VisuaAiUser | null>(null);
  const [lessons, setLessons] = useState<LessonHistoryItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(VISUA_AI_USER_KEY) ?? localStorage.getItem('mathcanvas_user');
      if (!raw) {
        router.replace('/');
        return;
      }
      setUser(JSON.parse(raw) as VisuaAiUser);
    } catch {
      router.replace('/');
    }
  }, [router]);

  useEffect(() => {
    setLessons(getLessons());
    setStreak(getCurrentStreak());
    setHydrated(true);
  }, []);

  const groupedLessons = useMemo(() => {
    const grouped: GroupedLessons = {};
    lessons.forEach((lesson) => {
      const date = new Date(lesson.createdAt);
      const dateStr = date.toISOString().split('T')[0];
      if (!grouped[dateStr]) {
        grouped[dateStr] = [];
      }
      grouped[dateStr].push(lesson);
    });
    return grouped;
  }, [lessons]);

  const sortedDates = useMemo(() => {
    return Object.keys(groupedLessons).sort((a, b) => b.localeCompare(a)); // newest first
  }, [groupedLessons]);

  const handleReplay = (lesson: LessonHistoryItem) => {
    try {
      const concept = lesson.concept;
      const topic = lesson.topic;
      const subject = subjectForLesson(lesson);
      localStorage.setItem(VISUA_AI_CONCEPT_KEY, concept);
      localStorage.setItem(VISUA_AI_TOPIC_KEY, topic);
      localStorage.setItem(VISUA_AI_SUBJECT_KEY, subject);
      setReplay(lesson.blueprint);
    } catch {
      /* ignore storage errors */
    }
    router.push('/canvas');
  };

  const handleBackToWelcome = () => {
    router.push('/welcome');
  };

  if (!user || !hydrated) {
    return (
      <main className="chat-session-page">
        <div className="chat-session-inner" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
          <p className="small-muted">Loading…</p>
        </div>
      </main>
    );
  }

  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <main className="chat-session-page history-page">
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
        </div>
      </motion.header>

      <div className="history-inner">
        {lessons.length === 0 ? (
          // Empty state
          <motion.section
            className="history-empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div style={{ textAlign: 'center', maxWidth: 420 }}>
              <p
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontSize: 36,
                  fontWeight: 600,
                  color: 'rgba(245,240,232,0.85)',
                  marginBottom: 12,
                  lineHeight: 1.2,
                }}
              >
                No lessons yet
              </p>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 14,
                  color: 'rgba(245,240,232,0.55)',
                  marginBottom: 28,
                  lineHeight: 1.5,
                }}
              >
                Start learning to build your streak and see your lessons here.
              </p>
              <button
                type="button"
                onClick={handleBackToWelcome}
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'rgba(245,240,232,0.85)',
                  background: 'rgba(245,240,232,0.12)',
                  border: '1px solid rgba(245,240,232,0.2)',
                  padding: '10px 24px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(245,240,232,0.2)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(245,240,232,0.12)';
                }}
              >
                Start learning →
              </button>
            </div>
          </motion.section>
        ) : (
          // History with streak
          <>
            <motion.section
              className="history-header"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
                <h1
                  style={{
                    fontFamily: "'Caveat', cursive",
                    fontSize: 42,
                    fontWeight: 600,
                    color: 'rgba(245,240,232,0.85)',
                    margin: 0,
                  }}
                >
                  Your lessons
                </h1>
                {streak > 0 && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 16px',
                      borderRadius: 20,
                      background: 'rgba(245,140,40,0.15)',
                      border: '1px solid rgba(245,140,40,0.3)',
                    }}
                  >
                    <span style={{ fontSize: 20 }}>🔥</span>
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 16,
                        fontWeight: 700,
                        color: 'rgba(245,140,40,0.95)',
                      }}
                    >
                      {streak} day{streak !== 1 ? 's' : ''} streak!
                    </span>
                  </div>
                )}
              </div>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 13,
                  color: 'rgba(245,240,232,0.55)',
                  margin: '12px 0 0',
                }}
              >
                {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'} completed
              </p>
            </motion.section>

            <motion.div
              className="history-list"
              initial="hidden"
              animate="show"
              variants={{
                hidden: {},
                show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
              }}
            >
              {sortedDates.map((dateStr, dateIdx) => {
                const dayLessons = groupedLessons[dateStr];
                const firstLessonTs = dayLessons[0].createdAt;
                const formattedDate = formatDate(firstLessonTs);

                return (
                  <motion.div
                    key={dateStr}
                    className="history-day-group"
                    variants={{
                      hidden: { opacity: 0, y: 8 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
                    }}
                  >
                    <h3
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'rgba(245,240,232,0.45)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        margin: '24px 0 12px',
                        paddingTop: dateIdx > 0 ? 12 : 0,
                        borderTop: dateIdx > 0 ? '1px solid rgba(245,240,232,0.08)' : 'none',
                      }}
                    >
                      {formattedDate}
                    </h3>
                    <ul
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                        margin: 0,
                        padding: 0,
                        listStyle: 'none',
                      }}
                    >
                      {dayLessons.map((lesson) => (
                        <li key={lesson.id}>
                          <motion.div
                            className="history-lesson-card"
                            whileHover={{ y: -2 }}
                            transition={{ duration: 0.2 }}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: 16,
                              padding: '14px 16px',
                              borderRadius: 10,
                              background: 'rgba(245,240,232,0.06)',
                              border: '1px solid rgba(245,240,232,0.12)',
                              transition: 'all 0.2s ease',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLElement).style.background = 'rgba(245,240,232,0.1)';
                              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,240,232,0.2)';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLElement).style.background = 'rgba(245,240,232,0.06)';
                              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,240,232,0.12)';
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p
                                style={{
                                  fontFamily: "'Caveat', cursive",
                                  fontSize: 18,
                                  fontWeight: 600,
                                  color: 'rgba(245,240,232,0.85)',
                                  margin: '0 0 4px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {lesson.topic}
                              </p>
                              <p
                                style={{
                                  fontFamily: "'Inter', sans-serif",
                                  fontSize: 12,
                                  color: 'rgba(245,240,232,0.5)',
                                  margin: 0,
                                  display: 'flex',
                                  gap: 12,
                                  alignItems: 'center',
                                }}
                              >
                                <span>{subjectForLesson(lesson)}</span>
                                <span>•</span>
                                <span>{formatTime(lesson.createdAt)}</span>
                                <span>•</span>
                                <span>{relativeTime(lesson.createdAt)}</span>
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleReplay(lesson)}
                              style={{
                                fontFamily: "'Inter', sans-serif",
                                fontSize: 13,
                                fontWeight: 600,
                                color: 'rgba(245,240,232,0.75)',
                                background: 'rgba(245,240,232,0.08)',
                                border: '1px solid rgba(245,240,232,0.2)',
                                padding: '7px 14px',
                                borderRadius: 6,
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.2s ease',
                              }}
                              onMouseEnter={(e) => {
                                (e.currentTarget as HTMLElement).style.background = 'rgba(245,240,232,0.15)';
                                (e.currentTarget as HTMLElement).style.color = 'rgba(245,240,232,0.95)';
                              }}
                              onMouseLeave={(e) => {
                                (e.currentTarget as HTMLElement).style.background = 'rgba(245,240,232,0.08)';
                                (e.currentTarget as HTMLElement).style.color = 'rgba(245,240,232,0.75)';
                              }}
                            >
                              Replay
                            </button>
                          </motion.div>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                );
              })}
            </motion.div>
          </>
        )}

        <motion.button
          type="button"
          onClick={handleBackToWelcome}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          style={{
            marginTop: 40,
            fontFamily: "'Inter', sans-serif",
            fontSize: 14,
            color: 'rgba(245,240,232,0.55)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            textDecoration: 'underline',
            transition: 'color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'rgba(245,240,232,0.85)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'rgba(245,240,232,0.55)';
          }}
        >
          ← Back to welcome
        </motion.button>
      </div>

      <style>{`
        .history-page {
          display: flex;
          flex-direction: column;
          padding-top: 80px;
          padding-bottom: 60px;
        }
        .history-inner {
          flex: 1;
          max-width: 600px;
          margin: 0 auto;
          width: 100%;
          padding: 0 20px;
        }
        .history-empty {
          margin-top: 80px;
        }
        .history-header {
          margin-bottom: 32px;
        }
        .history-list {
          margin-top: 20px;
        }
        .history-day-group {
          /* styles applied inline */
        }
      `}</style>
    </main>
  );
}
