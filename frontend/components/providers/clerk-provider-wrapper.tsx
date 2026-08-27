"use client";

import * as React from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { SocketProvider } from "./socket-provider";

export function ClerkProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <ClerkProvider appearance={{ theme: shadcn }}>
      <SocketProvider>{children}</SocketProvider>
    </ClerkProvider>
  );
}
