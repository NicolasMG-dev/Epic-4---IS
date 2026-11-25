"use client";

import { useSyncExternalStore } from "react";
import type { VisualViewportBox } from "../types/visual-viewport-box.types";

function subscribe(onChange: () => void) {
  const viewport = window.visualViewport;
  window.addEventListener("resize", onChange);
  viewport?.addEventListener("resize", onChange);
  viewport?.addEventListener("scroll", onChange);
  return () => {
    window.removeEventListener("resize", onChange);
    viewport?.removeEventListener("resize", onChange);
    viewport?.removeEventListener("scroll", onChange);
  };
}

function getSnapshot() {
  const viewport = window.visualViewport;
  return viewport ? `${viewport.height}:${viewport.offsetTop}:${window.innerHeight}` : null;
}

function getServerSnapshot() {
  return null;
}

export function useVisualViewportBox(): VisualViewportBox | null {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!snapshot) return null;
  const [height, offsetTop, layoutHeight] = snapshot.split(":").map(Number);
  return { height, offsetTop, layoutHeight };
}
