"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useT } from "./LocaleProvider";

/**
 * In-page replacements for window.alert / confirm / prompt.
 *
 * The native ones are unusable here for two reasons. They block the page, so an
 * embedded frame or an automated session freezes on them; and where they are
 * suppressed, an error reported through alert() vanishes — a failed publish
 * then looks like a button that does nothing. These render in the document, so
 * a message is always visible and a confirmation is always answerable.
 */
type Request =
  | { kind: "alert"; message: string; resolve: (value: null) => void }
  | { kind: "confirm"; message: string; resolve: (value: boolean) => void }
  | {
      kind: "prompt";
      message: string;
      initial: string;
      resolve: (value: string | null) => void;
    };

type Dialogs = {
  alert: (message: string) => Promise<null>;
  confirm: (message: string) => Promise<boolean>;
  prompt: (message: string, initial?: string) => Promise<string | null>;
};

const DialogContext = createContext<Dialogs>({
  alert: async () => null,
  confirm: async () => false,
  prompt: async () => null,
});

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<Request | null>(null);
  const [draft, setDraft] = useState("");
  const t = useT();

  const dialogs = useMemo<Dialogs>(
    () => ({
      alert: (message) =>
        new Promise<null>((resolve) => setRequest({ kind: "alert", message, resolve })),
      confirm: (message) =>
        new Promise<boolean>((resolve) => setRequest({ kind: "confirm", message, resolve })),
      prompt: (message, initial = "") =>
        new Promise<string | null>((resolve) => {
          setDraft(initial);
          setRequest({ kind: "prompt", message, initial, resolve });
        }),
    }),
    []
  );

  const settle = useCallback(
    (value: null | boolean | string) => {
      if (!request) return;
      setRequest(null);
      // Each kind resolves with its own type; the cast keeps that at one spot.
      (request.resolve as (v: unknown) => void)(value);
    },
    [request]
  );

  return (
    <DialogContext.Provider value={dialogs}>
      {children}

      {request && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            aria-label={t("common.close")}
            onClick={() => settle(request.kind === "confirm" ? false : null)}
            className="absolute inset-0 cursor-default bg-black/40"
          />

          <div className="relative w-full max-w-sm rounded-xl border border-border bg-background p-5 shadow-lg">
            <p className="text-sm leading-relaxed">{request.message}</p>

            {request.kind === "prompt" && (
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.nativeEvent.isComposing) return;
                  if (e.key === "Enter" || e.code === "Enter" || e.keyCode === 13) {
                    e.preventDefault();
                    settle(draft);
                  }
                }}
                className="mt-3 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            )}

            <div className="mt-5 flex justify-end gap-2">
              {request.kind !== "alert" && (
                <button
                  onClick={() => settle(request.kind === "confirm" ? false : null)}
                  className="rounded-md border border-border px-3 py-2 text-sm hover:bg-surface"
                >
                  {t("dialog.cancel")}
                </button>
              )}
              <button
                autoFocus={request.kind !== "prompt"}
                onClick={() => settle(request.kind === "prompt" ? draft : true)}
                className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground"
              >
                {t("dialog.ok")}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export const useDialogs = () => useContext(DialogContext);
