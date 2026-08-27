import * as React from "react";
import type { Metadata } from "next";
import { DashboardContent } from "@/components/dashboard";

export const metadata: Metadata = {
  title: "Dashboard — WatchParty",
  description: "Browse live watch rooms or create a synchronized session for your group.",
};

export default function DashboardPage(): React.JSX.Element {
  return <DashboardContent />;
}
