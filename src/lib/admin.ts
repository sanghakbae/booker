/**
 * The site operator's account. Enforcement lives in the Firestore rules; this
 * is only so the interface can show the operator view. Read-only by design —
 * the operator can see what has been published here but not edit it.
 */
export const ADMIN_EMAIL = "totoriverce@gmail.com";

export function isAdmin(email: string | null | undefined) {
  return !!email && email.toLowerCase() === ADMIN_EMAIL;
}
