import type {
  HealthResponse,
  RobotExpression,
  TextInteractionImage,
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

function readString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function parseTextInteractionImage(
  value: unknown,
  fallbackCreatedAt: string
): TextInteractionImage | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const image = value as Record<string, unknown>;
  const imageUrl = readString(image.image_url);
  if (!imageUrl) {
    return null;
  }

  return {
    image_id: readString(image.image_id),
    image_url: imageUrl,
    content_type: readString(image.content_type, "image/*"),
    provider: readString(image.provider),
    model: readString(image.model),
    created_at: readString(image.created_at, fallbackCreatedAt),
    expires_at:
      typeof image.expires_at === "string" || image.expires_at === null
        ? image.expires_at
        : undefined,
  };
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
  const createdAt =
    typeof body.created_at === "string" ? body.created_at : new Date().toISOString();
  const image = parseTextInteractionImage(body.image, createdAt);

  return {
    interaction_id:
      typeof body.interaction_id === "string" ? body.interaction_id : "interaction_local",
    session_id:
      typeof body.session_id === "string" ? body.session_id : request.session_id,
    status: typeof body.status === "string" ? body.status : "accepted",
    assistant_text: assistantText,
    expression: normalizeExpression(body.expression),
    intent: typeof body.intent === "string" ? body.intent : "chat",
    image,
    created_at: createdAt,
  };
}
