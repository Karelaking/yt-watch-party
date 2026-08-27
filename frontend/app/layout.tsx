import * as React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProviderWrapper } from "@/components/providers/clerk-provider-wrapper";
import { GsapProvider } from "@/components/providers/gsap-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "WatchParty — Watch YouTube Together in Real-Time Sync",
  description:
    "Create watch parties, sync YouTube videos with frame-perfect precision, chat with friends, and share creative moments seamlessly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased scroll-smooth`}
    >

      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-background text-foreground bg-dot-pattern selection:bg-zinc-900 selection:text-white"
      >
        <ClerkProviderWrapper>
          <GsapProvider>{children}</GsapProvider>
        </ClerkProviderWrapper>
      </body>
    </html>
  );
}