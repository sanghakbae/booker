"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  changePageSlug,
  deleteFeedback,
  deleteSpace,
  listFeedback,
  moveSpace,
  slugify,
  updateSpace,
} from "@/lib/db";
import { hasHangul } from "@/lib/romanize";
import type { MessageKey } from "@/lib/i18n";
import type { Feedback } from "@/lib/types";
import { useAuth } from "./AuthProvider";
import { EmptyState, Loading } from "./Loading";
import { useLocale, useT } from "./LocaleProvider";
import { MobileNav } from "./MobileNav";
import { PageOrderEditor } from "./PageOrderEditor";
import { Sidebar } from "./Sidebar";
import { useSpace } from "./SpaceProvider";

type Tab = "general" | "order" | "addresses" | "editors" | "feedback" | "danger";

const TABS: Array<{ id: Tab; key: MessageKey; ownerOnly?: boolean }> = [
  { id: "general", key: "settings.tabGeneral" },
  { id: "order", key: "settings.tabOrder" },
  { id: "addresses", key: "settings.tabAddresses" },
  { id: "editors", key: "settings.tabEditors", ownerOnly: true },
  { id: "feedback", key: "settings.tabFeedback" },
  { id: "danger", key: "settings.tabDanger", ownerOnly: true },
];

export function SpaceSettings() {
  const { space, loading, canEdit, isOwner, refresh } = useSpace();
  const { loading: authLoading } = useAuth();
  const router = useRouter();
  const t = useT();
  const [tab, setTab] = useState<Tab>("general");

  /**
   * Deep links such as /settings#order come from the editor. Read after mount:
   * deriving it during the first render disagreed with the prerendered HTML,
   * and the resulting hydration mismatch swallowed the first tab click.
   */
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (TABS.some((entry) => entry.id === hash)) setTab(hash as Tab);
  }, []);

  // Signing in is what grants access, so a verdict before auth settles is a
  // coin flip — it showed "you cannot view these settings" to the owner.
  if (loading || authLoading) return <Loading label={t("common.loading")} />;
  if (!space) return <EmptyState title={t("reader.spaceNotFound")} />;
  if (!canEdit) return <EmptyState title={t("settings.noPermission")} />;

  const visible = TABS.filter((t) => !t.ownerOnly || isOwner);

  return (
    <>
      <MobileNav currentTitle={t("manuals.settings")} />

      <div
        style={{ maxWidth: "var(--container-width)" }}
        className="mx-auto flex w-full flex-1 px-4"
      >
        <Sidebar />

        <main className="min-w-0 flex-1 py-10 md:px-10">
          <h1 className="text-2xl font-bold">{t("settings.title", { title: space.title })}</h1>

          {/* Wrapping rather than scrolling: a horizontally scrolled strip just
              looked like the last tab had been cut off. */}
          <div className="mt-6 flex flex-wrap gap-x-1 border-b border-border" role="tablist">
            {visible.map((tabItem) => (
              <button
                key={tabItem.id}
                role="tab"
                aria-selected={tab === tabItem.id}
                onClick={() => setTab(tabItem.id)}
                className={`border-b-2 px-3 py-2.5 text-sm ${
                  tab === tabItem.id
                    ? "border-accent font-medium text-accent"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                {t(tabItem.key)}
              </button>
            ))}
          </div>

          <div className="py-8" style={{ maxWidth: "var(--content-width)" }}>
            {tab === "general" && <GeneralTab onSaved={refresh} />}
            {tab === "order" && <PageOrderEditor />}
            {tab === "addresses" && <AddressesTab onSaved={refresh} />}
            {tab === "editors" && <EditorsTab onSaved={refresh} />}
            {tab === "feedback" && <FeedbackTab />}
            {tab === "danger" && (
              <DangerTab
                onDeleted={() => {
                  router.push("/");
                }}
              />
            )}
          </div>
        </main>
      </div>
    </>
  );
}

function GeneralTab({ onSaved }: { onSaved: () => Promise<void> }) {
  const { space } = useSpace();
  const router = useRouter();
  const t = useT();
  const [title, setTitle] = useState(space?.title ?? "");
  const [description, setDescription] = useState(space?.description ?? "");
  const [visibility, setVisibility] = useState(space?.visibility ?? "public");
  const [slug, setSlug] = useState(space?.slug ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  if (!space) return null;
  const nextSlug = slugify(slug);
  const slugChanged = nextSlug !== space.slug;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await updateSpace(space.id, { title: title.trim(), description: description.trim(), visibility });

      if (slugChanged) {
        // The document ID is the slug, so this rewrites every document.
        const ok = window.confirm(
          t("settings.slugWillChange", { from: space.slug, to: nextSlug })
        );
        if (!ok) {
          setBusy(false);
          return;
        }
        await moveSpace({ ...space, title: title.trim(), description: description.trim(), visibility }, nextSlug);
        router.replace(`/s/${nextSlug}/settings`);
        return;
      }

      await onSaved();
      setMessage(t("settings.savedMessage"));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <Field label={t("new.name")}>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2"
        />
      </Field>

      <Field
        label={t("new.slug")}
        hint={
          slugChanged
            ? t("settings.slugWillChange", { from: space.slug, to: nextSlug })
            : `booker.sanghak.kr/s/${space.slug}`
        }
      >
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2"
        />
      </Field>

      <Field label={t("new.description")}>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2"
        />
      </Field>

      <Field label={t("new.visibility")}>
        <div className="flex flex-wrap gap-4 text-sm">
          {(["public", "private"] as const).map((v) => (
            <label key={v} className="flex items-center gap-2">
              <input type="radio" checked={visibility === v} onChange={() => setVisibility(v)} />
              {v === "public" ? t("new.publicLabel") : t("settings.privateLabel")}
            </label>
          ))}
        </div>
      </Field>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {message && <p className="text-sm text-emerald-600">{message}</p>}

      <button
        type="submit"
        disabled={busy || !title.trim()}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-40"
      >
        {busy ? t("common.saving") : t("common.save")}
      </button>
    </form>
  );
}

/**
 * Moves Korean addresses to romanized ones, so a manual does not end up with
 * two address styles side by side. Every move keeps the old address as an
 * alias, so links already shared keep working.
 */
function AddressesTab({ onSaved }: { onSaved: () => Promise<void> }) {
  const { space, pages } = useSpace();
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);

  if (!space) return null;

  const stale = pages.filter((page) => hasHangul(page.slug));

  const run = async () => {
    setBusy(true);
    try {
      const taken = new Set(pages.map((page) => page.slug));
      for (const page of stale) {
        const base = slugify(page.title);
        let next = base;
        for (let n = 2; taken.has(next); n++) next = `${base}-${n}`;
        taken.delete(page.slug);
        taken.add(next);
        await changePageSlug(space.id, page, next);
      }
      await onSaved();
      setDone(stale.length);
    } catch (err) {
      window.alert((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-medium">{t("settings.addressCleanupTitle")}</h2>
        <p className="mt-2 text-sm text-muted">{t("settings.addressCleanupBody")}</p>
      </div>

      {stale.length === 0 ? (
        <p className="text-sm text-muted">
          {done > 0 ? t("settings.addressCleanupDone", { n: done }) : t("settings.addressCleanupNone")}
        </p>
      ) : (
        <>
          <ul className="divide-y divide-border rounded-lg border border-border text-sm">
            {stale.map((page) => (
              <li key={page.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3">
                <span className="font-medium">{page.title}</span>
                <code className="rounded bg-surface px-1.5 py-0.5 text-xs">/{page.slug}</code>
                <span className="text-muted" aria-hidden>
                  →
                </span>
                <code className="rounded bg-surface px-1.5 py-0.5 text-xs text-accent">
                  /{slugify(page.title)}
                </code>
              </li>
            ))}
          </ul>

          <button
            onClick={run}
            disabled={busy}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-40"
          >
            {busy ? t("common.saving") : t("settings.addressCleanupRun", { n: stale.length })}
          </button>
        </>
      )}
    </div>
  );
}

function EditorsTab({ onSaved }: { onSaved: () => Promise<void> }) {
  const { space } = useSpace();
  const t = useT();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (!space) return null;
  const editors = space.editorEmails ?? [];

  const change = async (next: string[]) => {
    setBusy(true);
    setError("");
    try {
      await updateSpace(space.id, { editorEmails: next });
      await onSaved();
      setEmail("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim().toLowerCase();
    if (!value) return;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      setError(t("settings.invalidEmail"));
      return;
    }
    if (editors.includes(value)) {
      setError(t("settings.alreadyInvited"));
      return;
    }
    await change([...editors, value]);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        {t("settings.editorsNote")}
      </p>

      <form onSubmit={add} className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="editor@example.com"
          aria-label={t("settings.inviteEmail")}
          className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-2"
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-40"
        >
          {t("settings.invite")}
        </button>
      </form>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <ul className="divide-y divide-border rounded-lg border border-border">
        <li className="flex items-center justify-between px-4 py-3">
          <span className="text-sm">{t("common.owner")}</span>
          <span className="text-xs text-muted">{t("settings.allPermissions")}</span>
        </li>
        {editors.map((address) => (
          <li key={address} className="flex items-center justify-between gap-3 px-4 py-3">
            <span className="min-w-0 truncate text-sm">{address}</span>
            <button
              onClick={() => change(editors.filter((e) => e !== address))}
              disabled={busy}
              className="shrink-0 text-sm text-red-500 hover:underline"
            >
              {t("settings.remove")}
            </button>
          </li>
        ))}
        {editors.length === 0 && (
          <li className="px-4 py-3 text-sm text-muted">{t("settings.noEditors")}</li>
        )}
      </ul>
    </div>
  );
}

function FeedbackTab() {
  const { space } = useSpace();
  const { locale, t } = useLocale();
  const [items, setItems] = useState<Feedback[] | null>(null);

  useEffect(() => {
    if (!space) return;
    listFeedback(space.id)
      .then(setItems)
      .catch(() => setItems([]));
  }, [space]);

  if (!space) return null;
  if (items === null) return <p className="text-sm text-muted">{t("common.loading")}…</p>;
  if (items.length === 0) {
    return <p className="text-sm text-muted">{t("settings.noFeedback")}</p>;
  }

  const helpful = items.filter((i) => i.helpful).length;

  const remove = async (id: string) => {
    await deleteFeedback(space.id, id);
    setItems((prev) => prev?.filter((i) => i.id !== id) ?? null);
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">
        {t("settings.feedbackSummary", {
          total: items.length,
          helpful,
          percent: Math.round((helpful / items.length) * 100),
        })}
      </p>

      <ul className="divide-y divide-border rounded-lg border border-border">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3 px-4 py-3">
            <span className="shrink-0 text-lg" aria-hidden>
              {item.helpful ? "👍" : "👎"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{item.pageSlug}</p>
              {item.comment && <p className="mt-1 text-sm text-muted">{item.comment}</p>}
              <p className="mt-1 text-xs text-muted">
                {item.createdAt?.toDate?.().toLocaleString(locale) ?? ""}
              </p>
            </div>
            <button
              onClick={() => remove(item.id)}
              className="shrink-0 text-sm text-muted hover:text-red-500"
            >
              {t("common.delete")}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DangerTab({ onDeleted }: { onDeleted: () => void }) {
  const { space } = useSpace();
  const t = useT();
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);

  if (!space) return null;

  const remove = async () => {
    if (confirmText !== space.slug) return;
    setBusy(true);
    try {
      await deleteSpace(space.id);
      onDeleted();
    } catch (err) {
      window.alert(t("settings.deleteFailed", { message: (err as Error).message }));
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-red-500/40 p-5">
      <h2 className="font-medium text-red-500">{t("settings.dangerTitle")}</h2>
      <p className="mt-2 text-sm text-muted">
        {t("settings.dangerBody")}{" "}
        <code className="rounded bg-surface px-1">{space.slug}</code>
        {t("settings.dangerBodyTail")}
      </p>
      <input
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        aria-label={t("settings.confirmDelete")}
        className="mt-4 w-full rounded-md border border-input bg-background px-3 py-2"
      />
      <button
        onClick={remove}
        disabled={busy || confirmText !== space.slug}
        className="mt-4 rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
      >
        {busy ? t("common.deleting") : t("settings.permanentDelete")}
      </button>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
