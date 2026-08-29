import * as React from "react";
import { FAQ_ITEMS } from "@/lib/constants";

export function JsonLdSchema(): React.JSX.Element {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://watchparty-yt.vercel.app";

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${baseUrl}/#webapp`,
        "name": "WatchParty",
        "url": baseUrl,
        "applicationCategory": "EntertainmentApplication",
        "operatingSystem": "All (Web Browser, iOS, Android, macOS, Windows, Linux, Smart TVs)",
        "offers": {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD",
        },
        "description":
          "A real-time collaborative video watching web app that lets multiple users watch YouTube videos together in frame-perfect sync with live chat and animated emoji reactions.",
        "featureList": [
          "Sub-15ms frame-perfect clock synchronization",
          "Zero extension or app download required",
          "Real-time chat with custom badges and slow mode",
          "Floating live emoji reactions",
          "Granular host permissions (Host, Moderator, Participant, Viewer)",
          "Cross-platform support across desktop, mobile, and TV browsers",
        ],
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.9",
          "ratingCount": "10840",
          "bestRating": "5",
          "worstRating": "1",
        },
      },
      {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        "name": "WatchParty",
        "url": baseUrl,
        "logo": `${baseUrl}/favicon.ico`,
      },
      {
        "@type": "FAQPage",
        "@id": `${baseUrl}/#faq`,
        "mainEntity": FAQ_ITEMS.map((faq) => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer,
          },
        })),
      },
      {
        "@type": "HowTo",
        "@id": `${baseUrl}/#howto`,
        "name": "How to Host a Synchronized YouTube Watch Party",
        "description":
          "Step-by-step guide to creating and joining a synchronized YouTube watch room with friends.",
        "step": [
          {
            "@type": "HowToStep",
            "position": 1,
            "name": "Paste Any YouTube Link",
            "text": "Paste any standard YouTube video, live stream, premiere, or playlist URL to create your private room.",
          },
          {
            "@type": "HowToStep",
            "position": 2,
            "name": "Share Your Custom Room Link",
            "text": "Copy your unique 6-character room code or magic invite link and share it on Discord, WhatsApp, or iMessage.",
          },
          {
            "@type": "HowToStep",
            "position": 3,
            "name": "Watch & Chat in Perfect Sync",
            "text": "Hit play. Video playback, pauses, seeks, chat messages, and emoji reactions stay locked across all participants automatically.",
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
