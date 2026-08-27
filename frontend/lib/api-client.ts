/**
 * Typed, authenticated REST API client for the WatchParty backend.
 * All requests automatically attach the Clerk Bearer token when provided.
 */

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function resolveApiBase(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return envUrl.replace(/\/+$/, "");
  }
  // Dev fallback: reach the backend on the same host that served this page,
  // so LAN devices work without hardcoding localhost.
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }
  return "http://localhost:3001";
}

const rawBase = resolveApiBase();
const BASE_URL = rawBase.endsWith("/api/v1") ? rawBase : `${rawBase}/api/v1`;


async function request<T>(
  method: string,
  path: string,
  token?: string | null,
  body?: unknown
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let message = res.statusText || `Request failed with status ${res.status}`;
    try {
      const json = (await res.json()) as any;
      if (json?.error) {
        if (typeof json.error === "string") {
          message = json.error;
        } else if (typeof json.error.message === "string") {
          message = json.error.message;
        } else {
          message = JSON.stringify(json.error);
        }
      } else if (json?.message) {
        message = typeof json.message === "string" ? json.message : JSON.stringify(json.message);
      }
    } catch {
      // ignore JSON parse failures
    }
    throw new ApiError(res.status, message);
  }


  // 204 No Content — return empty
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export const apiClient = {
  get<T>(path: string, token?: string | null): Promise<T> {
    return request<T>("GET", path, token);
  },
  post<T>(path: string, body: unknown, token?: string | null): Promise<T> {
    return request<T>("POST", path, token, body);
  },
  patch<T>(path: string, body: unknown, token?: string | null): Promise<T> {
    return request<T>("PATCH", path, token, body);
  },
  delete<T>(path: string, token?: string | null): Promise<T> {
    return request<T>("DELETE", path, token);
  },
};
