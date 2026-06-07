import type {
  HealthResponse,
  RobotExpression,
  TextInteractionRequest,
  TextInteractionResponse,
} from "../types/robotEvents";

const DEFAULT_API_BASE_URL = "http://localhost:8080";

const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? DEFAULT_API_BASE_URL;

function normalizeExpression(value: unknown): RobotExpression {
  const allowed: RobotExpression[] = [
    "idle",
    "happy",
    "thinking",
    "listening",
    "speaking",
    "surprised",
    "confused",
    "error",
  ];
  return allowed.includes(value as RobotExpression) ? (value as RobotExpression) : "happy";
}

async function parseJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T;
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }
  return body;
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${apiBaseUrl}/v1/health/live`);
    const body = await parseJson<HealthResponse>(response);
    return body.status === "ok";
  } catch {
    return false;
  }
}

export async function sendTextInteraction(
  request: TextInteractionRequest
): Promise<TextInteractionResponse> {
  const response = await fetch(`${apiBaseUrl}/v1/interactions/text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_id: request.session_id,
      client_type: request.client_type,
      text: request.text,
      input_text: request.text,
      metadata: request.metadata,
    }),
  });
  const body = await parseJson<Record<string, unknown>>(response);

  const assistantText =
    typeof body.assistant_text === "string"
      ? body.assistant_text
      : typeof body.response_text === "string"
        ? body.response_text
        : "Recebi sua mensagem.";

  return {
    interaction_id:
      typeof body.interaction_id === "string" ? body.interaction_id : "interaction_local",
    session_id:
      typeof body.session_id === "string" ? body.session_id : request.session_id,
    status: typeof body.status === "string" ? body.status : "accepted",
    assistant_text: assistantText,
    expression: normalizeExpression(body.expression),
    intent: typeof body.intent === "string" ? body.intent : "chat",
    created_at: typeof body.created_at === "string" ? body.created_at : new Date().toISOString(),
  };
}
