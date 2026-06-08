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

export class AudioInteractionError extends Error {
  readonly detail?: string;
  readonly status: number;

  constructor(status: number, detail?: string) {
    super(`Audio interaction failed with status ${status}${detail ? `: ${detail}` : ""}`);
    this.name = "AudioInteractionError";
    this.status = status;
    this.detail = detail;
  }
}

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

function parseRawResponseBody(rawBody: string): Record<string, unknown> {
  if (!rawBody) {
    return {};
  }

  try {
    return JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return { detail: rawBody };
  }
}

async function uploadFormData(
  url: string,
  formData: FormData
): Promise<{ body: Record<string, unknown>; ok: boolean; status: number }> {
  if (Platform.OS === "web") {
    const response = await fetch(url, {
      method: "POST",
      body: formData,
    });

    return {
      body: parseRawResponseBody(await response.text()),
      ok: response.ok,
      status: response.status,
    };
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Accept", "application/json");
    xhr.onload = () => {
      resolve({
        body: parseRawResponseBody(xhr.responseText),
        ok: xhr.status >= 200 && xhr.status < 300,
        status: xhr.status,
      });
    };
    xhr.onerror = () => reject(new Error("Audio upload network request failed"));
    xhr.ontimeout = () => reject(new Error("Audio upload request timed out"));
    xhr.timeout = 60000;
    xhr.send(formData);
  });
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

  const response = await uploadFormData(
    `${getApiBaseUrl()}/v1/interactions/audio`,
    formData
  );

  if (!response.ok) {
    const detail =
      typeof response.body.detail === "string" ? response.body.detail : undefined;
    throw new AudioInteractionError(response.status, detail);
  }

  return parseInteractionResponse(response.body, request.session_id);
}
