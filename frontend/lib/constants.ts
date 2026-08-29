export const EMOJI_REACTIONS = ["🔥", "🍿", "❤️", "👏", "🚀", "😂", "🎉"] as const;

export const PLAYBACK_RATES = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0] as const;

export const DEFAULT_FALLBACK_VIDEO_URL = "https://www.youtube.com/watch?v=jfKfPfyJRdk";
export const DEFAULT_FALLBACK_VIDEO_ID = "jfKfPfyJRdk";

export const FAQ_ITEMS = [
  {
    question: "Do all participants need a YouTube account or browser extension?",
    answer:
      "No! WatchParty runs 100% directly in any modern browser without requiring browser extensions, plugins, or software installations. Just send your room link and everyone can start watching in sync immediately.",
  },
  {
    question: "How does WatchParty maintain sub-15ms frame-perfect sync?",
    answer:
      "Our WebSocket and Redis-backed clock synchronization system continuously calibrates round-trip network latency every 500ms, keeping everyone's playback within 15 milliseconds of each other with zero drift.",
  },
  {
    question: "Can I control who can pause, seek, or change YouTube videos?",
    answer:
      "Yes! As room host, you have full Role-Based Access Control (RBAC). Choose between Host-Only playback control, Open DJ mode (where anyone can queue/pause), or Voting mode for democratic playlist changes.",
  },
  {
    question: "Does WatchParty work on mobile phones and tablets?",
    answer:
      "Yes! WatchParty is fully responsive and optimized for Safari on iOS (iPhone/iPad), Chrome on Android, desktop browsers (Mac, Windows, Linux), and smart TVs without installing an app.",
  },
  {
    question: "Is WatchParty free to use?",
    answer:
      "Yes, WatchParty is 100% free with unlimited watch rooms, supporting up to 50 simultaneous viewers per room with instant chat and live emoji reactions.",
  },
  {
    question: "Can we watch YouTube livestreams and playlists together?",
    answer:
      "Yes! You can paste URLs for standard YouTube videos, YouTube Music, premiere videos, and public YouTube livestreams for synchronized co-watching.",
  },
] as const;

export interface TestimonialItem {
  id: string;
  quote: string;
  name: string;
  role: string;
  initials: string;
  avatarBg: string;
}

export const TESTIMONIALS: TestimonialItem[] = [
  {
    id: "testimonial-1",
    quote:
      "My long-distance girlfriend and I used to count down '3, 2, 1, play' and always end up out of sync. WatchParty completely fixed that. It feels like we are on the same couch.",
    name: "Julian Davis",
    role: "Movie Enthusiast",
    initials: "JD",
    avatarBg: "bg-zinc-900",
  },
  {
    id: "testimonial-2",
    quote:
      "We host weekly anime watch parties for our 400-member Discord server. Zero lag, no one had to install plugins, and the chat reactions are hilarious.",
    name: "Kavita Rao",
    role: "Discord Community Lead",
    initials: "KR",
    avatarBg: "bg-indigo-600",
  },
  {
    id: "testimonial-3",
    quote:
      "The cleanest SaaS design I've seen in a watch party tool. Everything is snappy, minimal, and does exactly what you want without bloat.",
    name: "Marcus Thorne",
    role: "Tech Reviewer",
    initials: "MT",
    avatarBg: "bg-emerald-600",
  },
];

export interface StatMetricItem {
  value: number;
  decimals?: number;
  suffix: string;
  label: string;
  sublabel: string;
}

export const STATS_METRICS: StatMetricItem[] = [
  {
    value: 10840,
    decimals: 0,
    suffix: "+",
    label: "Watch Parties Hosted",
    sublabel: "Across 94 countries",
  },
  {
    value: 58200,
    decimals: 0,
    suffix: "+",
    label: "Active Party Viewers",
    sublabel: "Monthly stream sessions",
  },
  {
    value: 1420000,
    decimals: 0,
    suffix: "+",
    label: "Minutes Synced",
    sublabel: "Zero frame desync",
  },
  {
    value: 99.9,
    decimals: 1,
    suffix: "%",
    label: "Sync Reliability",
    sublabel: "Sub-15ms accuracy",
  },
];
