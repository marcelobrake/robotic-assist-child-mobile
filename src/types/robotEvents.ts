export type RobotExpression =
  | "idle"
  | "happy"
  | "thinking"
  | "listening"
  | "speaking"
  | "surprised"
  | "confused"
  | "error";

export type HealthResponse = {
  status: string;
  checks?: Record<string, string>;
};

export type TextInteractionRequest = {
  text: string;
  session_id: string;
  client_type: "mobile";
  generate_audio?: boolean;
  metadata: {
    device_id: string;
    locale: "pt-BR";
  };
};

export type TextInteractionImage = {
  image_id: string;
  image_url: string;
  content_type: string;
  provider: string;
  model: string;
  created_at: string;
  expires_at?: string | null;
};

export type TextInteractionAudio = {
  audio_id: string;
  audio_url: string;
  content_type: string;
  duration_ms?: number | null;
  provider: string;
  model?: string | null;
  created_at: string;
  expires_at?: string | null;
};

export type TextInteractionResponse = {
  interaction_id: string;
  session_id: string;
  status: string;
  input_text: string;
  assistant_text: string;
  expression: RobotExpression;
  intent: string;
  image: TextInteractionImage | null;
  audio: TextInteractionAudio | null;
  created_at: string;
};

export type RobotStateEvent = {
  type: "state";
  session_id: string;
  value: RobotExpression;
  created_at: string;
};
