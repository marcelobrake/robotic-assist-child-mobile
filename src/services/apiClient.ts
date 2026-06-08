import type {
  HealthResponse,
  RobotExpression,
  TextInteractionAudio,
  TextInteractionImage,
  TextInteractionRequest,
  TextInteractionResponse,
} from "../types/robotEvents";

const DEFAULT_API_BASE_URL = "http://localhost:8080";

const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? DEFAULT_API_BASE_URL;

export function getApiBaseUrl(): string {
  return apiBaseUrl;
}

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

function readNullableString(value: unknown): string | null | undefined {
  if (typeof value === "string" || value === null) {
    return value;
  }
  return undefined;
}

function readNullableNumber(value: unknown): number | null | undefined {
  if (typeof value === "number" || value === null) {
    return value;
  }
  return undefined;
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

function parseTextInteractionAudio(
  value: unknown,
  fallbackCreatedAt: string
): TextInteractionAudio | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const audio = value as Record<string, unknown>;
  const audioUrl = readString(audio.audio_url);
  if (!audioUrl) {
    return null;
  }

  return {
    audio_id: readString(audio.audio_id),
    audio_url: audioUrl,
    content_type: readString(audio.content_type, "audio/*"),
    duration_ms: readNullableNumber(audio.duration_ms),
    provider: readString(audio.provider),
    model: readNullableString(audio.model),
    created_at: readString(audio.created_at, fallbackCreatedAt),
    expires_at: readNullableString(audio.expires_at),
  };
}

async function parseJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T;
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }
  return body;
}

export function parseInteractionResponse(
  body: Record<string, unknown>,
  fallbackSessionId: string,
  assistantTextFallback = ""
): TextInteractionResponse {
  const assistantText =
    typeof body.assistant_text === "string"
      ? body.assistant_text
      : typeof body.response_text === "string"
        ? body.response_text
        : assistantTextFallback;
  const createdAt =
    typeof body.created_at === "string" ? body.created_at : new Date().toISOString();
  const image = parseTextInteractionImage(body.image, createdAt);
  const audio = parseTextInteractionAudio(body.audio, createdAt);

  return {
    interaction_id:
      typeof body.interaction_id === "string" ? body.interaction_id : "interaction_local",
    session_id:
      typeof body.session_id === "string" ? body.session_id : fallbackSessionId,
    status: typeof body.status === "string" ? body.status : "accepted",
    input_text: typeof body.input_text === "string" ? body.input_text : "",
    assistant_text: assistantText,
    expression: normalizeExpression(body.expression),
    intent: typeof body.intent === "string" ? body.intent : "chat",
    image,
    audio,
    created_at: createdAt,
  };
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/v1/health/live`);
    const body = await parseJson<HealthResponse>(response);
    return body.status === "ok";
  } catch {
    return false;
  }
}

export async function sendTextInteraction(
  request: TextInteractionRequest
): Promise<TextInteractionResponse> {
  const response = await fetch(`${getApiBaseUrl()}/v1/interactions/text`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session_id: request.session_id,
      client_type: request.client_type,
      generate_audio: request.generate_audio ?? true,
      text: request.text,
      input_text: request.text,
      metadata: request.metadata,
    }),
  });
  const body = await parseJson<Record<string, unknown>>(response);

  return parseInteractionResponse(body, request.session_id, "Recebi sua mensagem.");
}
