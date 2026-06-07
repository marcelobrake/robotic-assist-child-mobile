const DEFAULT_WS_BASE_URL = "ws://localhost:8080";

export const wsBaseUrl =
  process.env.EXPO_PUBLIC_WS_BASE_URL?.replace(/\/$/, "") ?? DEFAULT_WS_BASE_URL;

export function buildSessionWebSocketUrl(sessionId: string): string {
  return `${wsBaseUrl}/v1/ws/sessions/${encodeURIComponent(sessionId)}`;
}
