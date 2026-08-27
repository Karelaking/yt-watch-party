"use client";

import * as React from "react";
import { useAuth } from "@clerk/nextjs";
import type { Socket } from "socket.io-client";
import {
  getSocket,
  disconnectSocket,
  type ServerToClientEvents,
  type ClientToServerEvents,
} from "@/lib/socket-client";

export type WatchPartySocket = Socket<ServerToClientEvents, ClientToServerEvents>;

interface SocketContextValue {
  socket: WatchPartySocket | null;
  isConnected: boolean;
  token: string | null;
  getToken: () => Promise<string | null>;
}

const SocketContext = React.createContext<SocketContextValue>({
  socket: null,
  isConnected: false,
  token: null,
  getToken: async () => null,
});

export function SocketProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const { isSignedIn, getToken: clerkGetToken } = useAuth();
  const [socket, setSocket] = React.useState<WatchPartySocket | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);
  const [token, setToken] = React.useState<string | null>(null);

  const fetchToken = React.useCallback(async () => {
    try {
      if (!isSignedIn) return null;
      const t = await clerkGetToken();
      return t;
    } catch (err) {
      console.error("[SocketProvider] Failed to get Clerk token:", err);
      return null;
    }
  }, [isSignedIn, clerkGetToken]);

  React.useEffect(() => {
    let isMounted = true;

    if (!isSignedIn) {
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
      setToken(null);
      return;
    }

    async function initSocket() {
      const currentToken = await fetchToken();
      if (!isMounted) return;

      if (!currentToken) {
        disconnectSocket();
        setSocket(null);
        setIsConnected(false);
        setToken(null);
        return;
      }

      setToken(currentToken);
      const s = getSocket(currentToken, fetchToken);
      setSocket(s);

      const onConnect = () => {
        if (isMounted) setIsConnected(true);
      };
      const onDisconnect = () => {
        if (isMounted) setIsConnected(false);
      };

      if (s.connected) {
        setIsConnected(true);
      }

      s.on("connect", onConnect);
      s.on("disconnect", onDisconnect);

      return () => {
        s.off("connect", onConnect);
        s.off("disconnect", onDisconnect);
      };
    }

    const cleanupPromise = initSocket();

    return () => {
      isMounted = false;
      cleanupPromise.then((cleanup) => {
        if (cleanup) cleanup();
      });
    };
  }, [isSignedIn, fetchToken]);

  const value = React.useMemo(
    () => ({
      socket,
      isConnected,
      token,
      getToken: fetchToken,
    }),
    [socket, isConnected, token, fetchToken]
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocket(): SocketContextValue {
  return React.useContext(SocketContext);
}
