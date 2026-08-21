"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";
import { Header } from "./Header";

/**
 * A manual reached by its public link should read as that manual's own site,
 * not as a page inside booker. So the product chrome stops at the manual
 * boundary: everything under /s/ supplies its own header and footer, scoped to
 * the manual (see the space layout).
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const isManual = usePathname().startsWith("/s/");

  if (isManual) return <>{children}</>;

  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}
