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

import { JsonLdSchema } from "@/components/seo/json-ld";

const siteUrl =
  process.env.NEXT_PUBLIC_APP_URL || "https://watchparty-yt.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "WatchParty — Watch YouTube Together in Real-Time Sync (No Extension)",
    template: "%s | WatchParty",
  },
  description:
    "Host synchronized YouTube watch parties with friends in real-time. Sub-15ms frame-perfect sync, live interactive chat, floating emoji reactions, and host controls. Zero downloads or extensions required.",
  keywords: [
    "YouTube Watch Party",
    "Watch YouTube Together",
    "Sync YouTube Videos",
    "Watch Together Online",
    "Long Distance Movie Night",
    "Synchronized Video Player",
    "Watch2Gether Alternative",
    "Teleparty Alternative No Extension",
    "Real-time Video Sync",
    "Watch Party App",
  ],
  authors: [{ name: "WatchParty Team" }],
  creator: "WatchParty",
  publisher: "WatchParty",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "WatchParty",
    title: "WatchParty — Watch YouTube Together in Frame-Perfect Sync",
    description:
      "Create instant watch party rooms. Watch YouTube videos perfectly synchronized with friends across mobile, desktop, and smart TVs with real-time chat and emoji reactions.",
  },
  twitter: {
    card: "summary_large_image",
    title: "WatchParty — Watch YouTube Together in Real-Time Sync",
    description:
      "Host instant YouTube watch parties with zero extensions. Frame-perfect playback, live chat, and reactions.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
  category: "entertainment",
};

import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AppCommandMenu } from "@/components/app-command-menu";

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
      <head>
        <JsonLdSchema />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-background text-foreground bg-dot-pattern selection:bg-zinc-900 selection:text-white"
      >
        <ThemeProvider>
          <ClerkProviderWrapper>
            <GsapProvider>{children}</GsapProvider>
          </ClerkProviderWrapper>
          <AppCommandMenu />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}