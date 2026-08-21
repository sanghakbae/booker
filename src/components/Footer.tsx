import Link from "next/link";

export function Footer() {
  return (
    /* Deliberately not pinned to the bottom of the window: mt-auto added
       whatever slack the viewport had left, so the gap above the footer grew
       with window height instead of staying at the spacing we set. */
    <footer className="border-t border-border">
      <div
        style={{ maxWidth: "var(--container-width)" }}
        className="mx-auto flex w-full flex-wrap items-center gap-x-6 gap-y-2 px-4 py-6 text-sm text-muted"
      >
        <span>© {new Date().getFullYear()} booker</span>
        <Link href="/privacy" className="hover:text-foreground">
          개인정보처리방침
        </Link>
        <Link href="/s/guide/시작하기" className="hover:text-foreground">
          사용 설명서
        </Link>
        <span className="ml-auto">문의 totoriverce@gmail.com</span>
      </div>
    </footer>
  );
}
