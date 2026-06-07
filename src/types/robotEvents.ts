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

export type TextInteractionResponse = {
  interaction_id: string;
  session_id: string;
  status: string;
  assistant_text: string;
  expression: RobotExpression;
  intent: string;
  image: TextInteractionImage | null;
  created_at: string;
};

export type RobotStateEvent = {
  type: "state";
  session_id: string;
  value: RobotExpression;
  created_at: string;
};
