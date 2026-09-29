import { useEffect, useRef, useState } from "react";

// Replay timing only: the engine has already decided every pick.
export const PICK_MS = 320;
export const TIEBREAK_MS = 900;

// Steps through `total` frames; frame i waits delayFor(i). `skip` jumps to the end.
export function useReplay(total, delayFor, skip, onDone) {
  const [frame, setFrame] = useState(0);
  const doneRef = useRef(false);
  useEffect(() => {
    if (frame >= total) {
      if (!doneRef.current) {
        doneRef.current = true;
        onDone?.();
      }
      return;
    }
    if (skip) {
      setFrame(total);
      return;
    }
    const t = setTimeout(() => setFrame((f) => f + 1), delayFor(frame));
    return () => clearTimeout(t);
    // delayFor and onDone are read on each frame; restarting on their identity would reset timers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frame, total, skip]);
  return frame;
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
