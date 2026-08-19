/**
 * The bOOker wordmark: the two O's are eyes, both looking down and to the
 * right. Sized in `em` so it scales with whatever type size it sits in, and
 * exposed to assistive tech as plain text.
 */
function Eye({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`inline-block h-[0.82em] w-[0.82em] align-baseline ${className}`}
      style={{ transform: "translateY(0.04em)" }}
      aria-hidden
    >
      <circle cx="10" cy="10" r="8.6" fill="var(--background)" stroke="currentColor" strokeWidth="2.2" />
      {/* Pupil pushed toward the lower right — the whole set shares one gaze. */}
      <circle cx="13" cy="13" r="3.9" fill="currentColor" />
      <circle cx="11.4" cy="11.4" r="1.15" fill="var(--background)" opacity="0.9" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline font-semibold tracking-tight ${className}`}>
      <span aria-hidden>b</span>
      <span className="mx-[0.06em] inline-flex gap-[0.08em] text-accent" aria-hidden>
        <Eye />
        <Eye />
      </span>
      <span aria-hidden>ker</span>
      <span className="sr-only">bOOker</span>
    </span>
  );
}
