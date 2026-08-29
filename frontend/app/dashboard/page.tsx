import * as React from "react";
import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/dashboard";

export const metadata: Metadata = {
  title: "Dashboard — WatchParty",
  description: "Browse live watch rooms or create a synchronized session for your group.",
};

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/dashboard");
  }

  return <DashboardContent />;
}
