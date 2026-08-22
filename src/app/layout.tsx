import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { DialogProvider } from "@/components/DialogProvider";
import { LocaleProvider } from "@/components/LocaleProvider";
import { SiteChrome } from "@/components/SiteChrome";
import { StaleBuildGuard } from "@/components/StaleBuildGuard";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "booker", template: "%s · booker" },
  description: "매뉴얼을 만들고 공개하는 가장 쉬운 방법",
  metadataBase: new URL("https://booker.sanghak.kr"),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <StaleBuildGuard />
        <LocaleProvider>
          <DialogProvider>
            <AuthProvider>
              <SiteChrome>{children}</SiteChrome>
            </AuthProvider>
          </DialogProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
