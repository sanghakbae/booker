import { auth } from "./firebase";

const ENDPOINT =
  process.env.NEXT_PUBLIC_UPLOAD_ENDPOINT ?? "https://booker-uploads.totoriverce.workers.dev";

/**
 * Uploads through the Cloudflare Worker rather than straight to storage.
 * A static site cannot hold an R2 credential, so the Worker verifies the
 * caller's Firebase ID token and re-checks edit permission before writing.
 */
export async function uploadImage(file: File, spaceId: string): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error("로그인이 필요합니다.");

  const body = new FormData();
  body.append("file", file);
  body.append("spaceId", spaceId);

  const res = await fetch(`${ENDPOINT}/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${await user.getIdToken()}` },
    body,
  });

  const payload = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !payload.url) {
    throw new Error(payload.error ?? `업로드에 실패했습니다 (${res.status})`);
  }
  return payload.url;
}
