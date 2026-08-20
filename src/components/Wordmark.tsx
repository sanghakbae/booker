"use client";

import { useEffect, useRef } from "react";

/**
 * The bOOker wordmark: each capital O holds an eyeball, and the pupils follow
 * the pointer.
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

/** The pupil must stay inside the counter: counter radius 22.3 − pupil 11.5. */
const REACH = 9.5;
/** Where the eyes look when there is no pointer to follow. */
const REST = { x: REACH * Math.SQRT1_2, y: REACH * Math.SQRT1_2 };
/** Distance, in pixels, at which the eyes are looking as far as they can. */
const SATURATION = 420;
/** Fraction of the remaining distance covered each frame. */
const EASING = 0.18;

const EM = OUTER / 100; // 0.736em
const BASELINE_OFFSET = 0.358 - EM / 2; // puts the centre on the O's centre
const SIDE_BEARING = (0.763 - EM) / 2;

function Eye({ pupilRef }: { pupilRef: (node: SVGGElement | null) => void }) {
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
      {/* Drawn at the centre and moved by transform, so one offset drives both
          shapes. Pupil plus catchlight, because a bare dot reads as a radio
          button rather than an eye. */}
      <g ref={pupilRef} transform={`translate(${REST.x} ${REST.y})`}>
        <circle cx={CENTRE} cy={CENTRE} r={PUPIL_RADIUS} fill="var(--foreground)" />
        <circle
          cx={CENTRE - 3.9}
          cy={CENTRE - 3.9}
          r={4.2}
          fill="var(--background)"
          opacity="0.92"
        />
      </g>
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  const pupils = useRef<Array<SVGGElement | null>>([null, null]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Positions live outside React: a pointermove-driven re-render would be far
    // more work than writing one transform attribute per frame.
    const current = [{ ...REST }, { ...REST }];
    let target = { x: 0, y: 0 };
    let hasPointer = false;
    let frame = 0;

    const step = () => {
      frame = 0;
      let moving = false;

      pupils.current.forEach((node, index) => {
        if (!node) return;

        let wanted = REST;
        if (hasPointer) {
          const box = node.ownerSVGElement?.getBoundingClientRect();
          if (box) {
            const dx = target.x - (box.left + box.width / 2);
            const dy = target.y - (box.top + box.height / 2);
            const distance = Math.hypot(dx, dy);
            if (distance > 0.5) {
              const strength = (Math.min(distance, SATURATION) / SATURATION) * REACH;
              wanted = { x: (dx / distance) * strength, y: (dy / distance) * strength };
            }
          }
        }

        const eye = current[index];
        eye.x += (wanted.x - eye.x) * EASING;
        eye.y += (wanted.y - eye.y) * EASING;
        node.setAttribute("transform", `translate(${eye.x.toFixed(2)} ${eye.y.toFixed(2)})`);

        if (Math.abs(wanted.x - eye.x) > 0.02 || Math.abs(wanted.y - eye.y) > 0.02) {
          moving = true;
        }
      });

      // Stop once the eyes have settled; a pointer move starts the loop again.
      if (moving) frame = requestAnimationFrame(step);
    };

    const wake = () => {
      if (!frame) frame = requestAnimationFrame(step);
    };

    const onMove = (event: PointerEvent) => {
      // Touch and pen taps should not leave the eyes staring at a stale point.
      hasPointer = event.pointerType === "mouse";
      target = { x: event.clientX, y: event.clientY };
      wake();
    };

    const onLeave = () => {
      hasPointer = false;
      wake();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);
    // Scrolling moves the eyes relative to a stationary cursor.
    window.addEventListener("scroll", wake, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      window.removeEventListener("scroll", wake);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <span className={`font-semibold tracking-tight ${className}`}>
      <span aria-hidden>b</span>
      {/* The eyes carry the accent colour; the rest of the mark stays as text. */}
      <span className="text-accent" aria-hidden>
        <Eye pupilRef={(node) => (pupils.current[0] = node)} />
        <Eye pupilRef={(node) => (pupils.current[1] = node)} />
      </span>
      <span aria-hidden>ker</span>
      <span className="sr-only">bOOker</span>
    </span>
  );
}
