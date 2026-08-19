"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { EditView } from "./EditView";
import { Loading } from "./Loading";
import { NewDoc } from "./NewDoc";
import { Reader } from "./Reader";
import { SpaceIndex } from "./SpaceIndex";
import { SpaceProvider } from "./SpaceProvider";

type Route =
  | { kind: "space"; space: string }
  | { kind: "page"; space: string; page: string }
  | { kind: "edit"; space: string; page: string }
  | { kind: "new"; space: string }
  | { kind: "unknown" };

const subscribeNever = () => () => {};

// getSnapshot must return a stable reference — a fresh object every call would
// make React loop forever. The path does not change while 404.html is mounted.
let cached: { path: string; route: Route } | null = null;

function currentRoute(): Route {
  const path = window.location.pathname;
  if (cached?.path !== path) cached = { path, route: parse(path) };
  return cached.route;
}

/** /s/space/page/edit → segments after the leading "s". */
function parse(pathname: string): Route {
  const parts = pathname.split("/").filter(Boolean).map(decodeURIComponent);
  if (parts[0] !== "s" || !parts[1]) return { kind: "unknown" };
  const space = parts[1];
  if (!parts[2]) return { kind: "space", space };
  if (parts[2] === "new") return { kind: "new", space };
  if (parts[3] === "edit") return { kind: "edit", space, page: parts[2] };
  return { kind: "page", space, page: parts[2] };
}

/**
 * GitHub Pages serves 404.html for any path it has no file for — which is every
 * manual published since the last build. This reads the URL and renders the same
 * screens client-side, so a new document is reachable before a rebuild.
 */
export function ClientFallback() {
  // 404.html is prerendered with no URL of its own; the route is only knowable
  // in the browser, so the server snapshot is null and the client reads location.
  const route = useSyncExternalStore(
    subscribeNever,
    currentRoute,
    () => null
  );

  if (!route) return <Loading />;

  if (route.kind === "unknown") {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">페이지를 찾을 수 없습니다</h1>
        <p className="mt-3 text-muted">주소를 다시 확인해 주세요.</p>
        <Link href="/" className="mt-6 inline-block text-accent">
          홈으로
        </Link>
      </main>
    );
  }

  return (
    <SpaceProvider slug={route.space}>
      {route.kind === "space" && <SpaceIndex />}
      {route.kind === "new" && <NewDoc />}
      {route.kind === "page" && <Reader slug={route.page} />}
      {route.kind === "edit" && <EditView slug={route.page} />}
    </SpaceProvider>
  );
}
