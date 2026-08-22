"use client";

import { useSyncExternalStore } from "react";

const subscribeNever = () => () => {};

/**
 * True when the page is running inside an iframe.
 *
 * Used to drop sticky positioning while embedded. Sticky and fixed elements
 * inside an iframe are a long-standing source of paint bugs on iOS and in
 * WKWebView — the frame can stay unpainted until something forces a repaint,
 * which is exactly the reported "blank until you scroll". A manual in a modal
 * scrolls as one short document anyway, so a sticky header buys little there.
 */
export function useEmbedded() {
  return useSyncExternalStore(
    subscribeNever,
    () => window.self !== window.top,
    () => false
  );
}
