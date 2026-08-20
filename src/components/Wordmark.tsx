/**
 * The bOOker wordmark: each capital O holds an eyeball, both looking down and
 * to the right.
 *
 * The O is drawn rather than typeset. Overlaying a pupil on the real glyph
 * means guessing where the baseline sits inside the line box, which drifts with
 * line-height; drawing the ring puts the letter and the eye in one coordinate
 * system. The measurements come from Geist SemiBold's own capital O, so it
 * still matches the surrounding letters:
 *
 *   outer diameter 0.736em · stroke 0.145em · counter 0.446em
 *   centre 0.358em above the baseline · advance 0.763em
 *
 * Units below are hundredths of an em.
 */
const OUTER = 73.6;
const STROKE = 14.5;
const CENTRE = OUTER / 2;
const RING_RADIUS = (OUTER - STROKE) / 2;

const PUPIL_RADIUS = 11.5;
/**
 * How far the pupil sits toward the lower right. The diagonal offset has to
 * stay inside the counter: GAZE × √2 < (counter radius 22.3 − pupil 11.5).
 */
const GAZE = 6.5;

const EM = OUTER / 100; // 0.736em
const BASELINE_OFFSET = 0.358 - EM / 2; // puts the centre on the O's centre
const SIDE_BEARING = (0.763 - EM) / 2;

function EyeO() {
  return (
    <svg
      viewBox={`0 0 ${OUTER} ${OUTER}`}
      width={`${EM}em`}
      height={`${EM}em`}
      style={{
        verticalAlign: `${BASELINE_OFFSET}em`,
        marginInline: `${SIDE_BEARING}em`,
      }}
      className="inline-block"
      aria-hidden
    >
      {/* The letter itself. */}
      <circle
        cx={CENTRE}
        cy={CENTRE}
        r={RING_RADIUS}
        fill="none"
        stroke="currentColor"
        strokeWidth={STROKE}
      />
      {/* Pupil and catchlight inside the counter. Two shapes, not one dot —
          a bare dot reads as a radio button rather than an eye. */}
      <circle
        cx={CENTRE + GAZE}
        cy={CENTRE + GAZE}
        r={PUPIL_RADIUS}
        fill="var(--foreground)"
      />
      <circle
        cx={CENTRE + GAZE - 3.9}
        cy={CENTRE + GAZE - 3.9}
        r={4.2}
        fill="var(--background)"
        opacity="0.92"
      />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-semibold tracking-tight ${className}`}>
      <span aria-hidden>b</span>
      {/* The eyes carry the accent colour; the rest of the mark stays as text. */}
      <span className="text-accent" aria-hidden>
        <EyeO />
        <EyeO />
      </span>
      <span aria-hidden>ker</span>
      <span className="sr-only">bOOker</span>
    </span>
  );
}
