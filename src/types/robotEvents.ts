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

export type TextInteractionResponse = {
  interaction_id: string;
  session_id: string;
  status: string;
  assistant_text: string;
  expression: RobotExpression;
  intent: string;
  created_at: string;
};

export type RobotStateEvent = {
  type: "state";
  session_id: string;
  value: RobotExpression;
  created_at: string;
};
