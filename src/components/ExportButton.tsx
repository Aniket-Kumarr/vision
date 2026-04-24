'use client';

import { useRef, useEffect, useState } from 'react';
import type { ExportFormat, ExportStatus } from '@/hooks/useExport';

interface ExportButtonProps {
  status: ExportStatus;
  format: ExportFormat | null;
  progress: number;
  onExport: (fmt: ExportFormat) => void;
  onCancel: () => void;
  disabled?: boolean;
}

export default function ExportButton({
  status,
  format,
  progress,
  onExport,
  onCancel,
  disabled = false,
}: ExportButtonProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close the dropdown when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const isRecording = status === 'recording' || status === 'encoding';

  if (isRecording) {
    const pct = Math.round(progress * 100);
    const label = status === 'encoding' ? 'Encoding…' : `REC ${format?.toUpperCase()} ${pct}%`;
    return (
      <div className="export-recording-pill" aria-live="polite">
        <span className="export-rec-dot" aria-hidden />
        <span className="export-rec-label">{label}</span>
        <button
          type="button"
          className="export-cancel-btn"
          onClick={onCancel}
          aria-label="Cancel export recording"
        >
          ✕
        </button>
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className="export-done-pill" aria-live="polite">
        <span>Download ready</span>
      </div>
    );
  }

  return (
    <div ref={wrapRef} className="export-wrap">
      <button
        type="button"
        className="export-trigger-btn"
        onClick={() => !disabled && setMenuOpen((v) => !v)}
        aria-label="Export lesson"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        disabled={disabled}
        title="Export lesson as GIF or WebM"
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          width="16"
          height="16"
        >
          {/* Download arrow */}
          <path d="M10 3 L10 13" />
          <path d="M6 9 L10 13 L14 9" />
          <path d="M3 16 L17 16" />
        </svg>
        Export
      </button>

      {menuOpen && (
        <div className="export-menu" role="menu" aria-label="Export options">
          <button
            type="button"
            role="menuitem"
            className="export-menu-item"
            onClick={() => {
              setMenuOpen(false);
              onExport('gif');
            }}
          >
            <span className="export-menu-icon">🎞</span>
            <span>
              <span className="export-menu-title">Record GIF</span>
              <span className="export-menu-sub">Animated image, works in Anki &amp; Notion</span>
            </span>
          </button>
          <button
            type="button"
            role="menuitem"
            className="export-menu-item"
            onClick={() => {
              setMenuOpen(false);
              onExport('webm');
            }}
          >
            <span className="export-menu-icon">🎬</span>
            <span>
              <span className="export-menu-title">Record WebM</span>
              <span className="export-menu-sub">Compact video, best quality</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
