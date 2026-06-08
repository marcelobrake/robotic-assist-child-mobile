import { Platform } from "react-native";

import { getApiBaseUrl, parseInteractionResponse } from "./apiClient";
import type { TextInteractionResponse } from "../types/robotEvents";

const AUDIO_FORM_FIELD_NAME = "audio_file";

type AudioInteractionRequest = {
  audio_content_type: string;
  audio_file_extension: string;
  audio_uri: string;
  client_type: "mobile";
  generate_audio: true;
  listener_mode: boolean;
  metadata: {
    device_id: string;
    locale: "pt-BR";
  };
  session_id: string;
};

async function appendAudioFile(
  formData: FormData,
  audioUri: string,
  contentType: string,
  fileExtension: string
) {
  const fileName = `cubinho-voice-${Date.now()}.${fileExtension}`;

  if (Platform.OS === "web") {
    const response = await fetch(audioUri);
    const blob = await response.blob();
    const typedBlob =
      blob.type === contentType ? blob : blob.slice(0, blob.size, contentType);
    formData.append(AUDIO_FORM_FIELD_NAME, typedBlob, fileName);
    return;
  }

  formData.append(
    AUDIO_FORM_FIELD_NAME,
    {
      name: fileName,
      type: contentType,
      uri: audioUri,
    } as unknown as Blob
  );
}

async function parseResponseBody(response: Response): Promise<Record<string, unknown>> {
  const rawBody = await response.text();
  if (!rawBody) {
    return {};
  }

  try {
    return JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return { detail: rawBody };
  }
}

export async function sendAudioInteraction(
  request: AudioInteractionRequest
): Promise<TextInteractionResponse> {
  const formData = new FormData();
  formData.append("session_id", request.session_id);
  formData.append("client_type", request.client_type);
  formData.append("device_id", request.metadata.device_id);
  formData.append("generate_audio", String(request.generate_audio));
  formData.append("listener_mode", String(request.listener_mode));
  formData.append("metadata", JSON.stringify(request.metadata));
  await appendAudioFile(
    formData,
    request.audio_uri,
    request.audio_content_type,
    request.audio_file_extension
  );

  const response = await fetch(`${getApiBaseUrl()}/v1/interactions/audio`, {
    method: "POST",
    body: formData,
  });
  const body = await parseResponseBody(response);

  if (!response.ok) {
    const detail =
      typeof body.detail === "string" ? `: ${body.detail}` : "";
    throw new Error(`Audio interaction failed with status ${response.status}${detail}`);
  }

  return parseInteractionResponse(body, request.session_id);
}
