import * as React from "react";
import type { Metadata } from "next";
import { RoomContent } from "@/components/room";

interface RoomPageProps {
  params: Promise<{
    roomId: string;
  }>;
}

export async function generateMetadata({
  params,
}: RoomPageProps): Promise<Metadata> {
  const { roomId } = await params;
  return {
    title: `Watch Room #${roomId} — WatchParty`,
    description: `Join watch room ${roomId} to stream and sync YouTube videos together in real-time.`,
  };
}

export default async function WatchRoomPage({
  params,
}: RoomPageProps): Promise<React.JSX.Element> {
  const { roomId } = await params;
  return <RoomContent roomId={roomId} />;
}
