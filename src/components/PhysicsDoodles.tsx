/**
 * Decorative physics glyphs positioned in the chat page margins.
 * Mirrors the layout of ChatDoodles but swaps math icons for physics ones so
 * the physics workspace doesn't show integrals/unit-circle imagery.
 */
export default function PhysicsDoodles() {
  return (
    <>
      {/* Force vector with label — top left */}
      <svg className="chat-doodle chat-doodle--tl" viewBox="0 0 64 64" fill="none" aria-hidden>
        <path
          d="M10 48 L50 18"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M50 18 L44 20 M50 18 L48 24"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10 48 L14 48"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      {/* Transverse wave — top right */}
      <svg className="chat-doodle chat-doodle--tr" viewBox="0 0 80 40" fill="none" aria-hidden>
        <path
          d="M4 20 Q14 4 24 20 T44 20 T64 20 T76 20"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M4 32 L76 32"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeDasharray="3 4"
          strokeLinecap="round"
        />
      </svg>

      {/* Spring / SHM — middle left */}
      <svg className="chat-doodle chat-doodle--ml" viewBox="0 0 60 60" fill="none" aria-hidden>
        <path
          d="M8 30 L14 30 M14 30 Q20 14 26 30 T38 30 T50 30 L56 30"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect
          x="4"
          y="22"
          width="4"
          height="16"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
        />
      </svg>

      {/* Circular motion with centripetal arrow — middle right */}
      <svg className="chat-doodle chat-doodle--mr" viewBox="0 0 80 80" fill="none" aria-hidden>
        <circle cx="40" cy="40" r="28" stroke="currentColor" strokeWidth="2.2" />
        <circle cx="40" cy="12" r="3" fill="currentColor" />
        <path
          d="M40 12 L40 36"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M40 36 L36 30 M40 36 L44 30"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {/* Projectile parabola — bottom left */}
      <svg className="chat-doodle chat-doodle--bl" viewBox="0 0 60 40" fill="none" aria-hidden>
        <path
          d="M4 36 Q30 -4 56 36"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M4 36 L56 36"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeDasharray="3 4"
          strokeLinecap="round"
        />
      </svg>
    </>
  );
}
