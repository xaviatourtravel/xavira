import {
  WHATSAPP_CONNECT_FAILED_MESSAGE,
  WHATSAPP_INSTANCE_DISCONNECTED_MESSAGE,
  WHATSAPP_INSTANCE_NAME,
  WHATSAPP_SERVICE_UNAVAILABLE_MESSAGE,
} from "@/lib/integrations/whatsapp/constants";
import {
  buildWhatsappRemoteJid,
  normalizeWhatsappPhoneDigits,
} from "@/lib/integrations/whatsapp/phone";
import type {
  WhatsAppConnectResult,
  WhatsAppConnectionState,
  WhatsAppInstanceStatus,
} from "@/lib/integrations/whatsapp/types";

type EvolutionConfig = {
  baseUrl: string;
  apiKey: string;
  instanceName: string;
};

type EvolutionFetchInstance = {
  id?: string;
  name?: string;
  instanceName?: string;
  connectionStatus?: string;
  state?: string;
  ownerJid?: string | null;
  number?: string | null;
  profileName?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
};

type EvolutionConnectResponse = {
  base64?: string | null;
  code?: string | null;
  pairingCode?: string | null;
  count?: number | null;
  qrcode?: {
    base64?: string | null;
    code?: string | null;
  } | null;
};

type EvolutionConnectionStateResponse = {
  instance?: {
    instanceName?: string;
    state?: string;
  };
};

export class EvolutionServiceUnavailableError extends Error {
  constructor(message = WHATSAPP_SERVICE_UNAVAILABLE_MESSAGE) {
    super(message);
    this.name = "EvolutionServiceUnavailableError";
  }
}

export type EvolutionErrorMeta = {
  endpoint?: string;
  status?: number;
  payload?: unknown;
};

export class EvolutionConnectError extends Error {
  readonly endpoint?: string;
  readonly status?: number;
  readonly payload?: unknown;

  constructor(
    message = WHATSAPP_CONNECT_FAILED_MESSAGE,
    meta?: EvolutionErrorMeta,
  ) {
    super(message);
    this.name = "EvolutionConnectError";
    this.endpoint = meta?.endpoint;
    this.status = meta?.status;
    this.payload = meta?.payload;
  }
}

function getEvolutionConfig(): EvolutionConfig {
  const baseUrl = process.env.EVOLUTION_API_URL?.trim();
  const apiKey = process.env.EVOLUTION_API_KEY?.trim();
  const instanceName =
    process.env.WHATSAPP_INSTANCE_NAME?.trim() || WHATSAPP_INSTANCE_NAME;

  if (!baseUrl || !apiKey) {
    throw new EvolutionServiceUnavailableError(
      "Konfigurasi WhatsApp belum lengkap. Tambahkan EVOLUTION_API_URL dan EVOLUTION_API_KEY.",
    );
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ""),
    apiKey,
    instanceName,
  };
}

function isNetworkFailure(error: unknown) {
  if (error instanceof TypeError) {
    return true;
  }

  if (error && typeof error === "object" && "cause" in error) {
    const cause = (error as { cause?: unknown }).cause;
    if (cause && typeof cause === "object" && "code" in cause) {
      const code = String((cause as { code?: string }).code ?? "");
      return ["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "ECONNRESET"].includes(
        code,
      );
    }
  }

  return false;
}

function getErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const record = payload as Record<string, unknown>;
  const response = record.response;

  if (typeof response === "string") {
    return response;
  }

  if (response && typeof response === "object") {
    const responseRecord = response as Record<string, unknown>;
    const message = responseRecord.message;

    if (typeof message === "string") {
      return message;
    }

    if (Array.isArray(message)) {
      return message.map(String).join(" ");
    }
  }

  if (typeof record.message === "string") {
    return record.message;
  }

  if (Array.isArray(record.message)) {
    return record.message.map(String).join(" ");
  }

  return "";
}

export type EvolutionRequestError = Error & {
  status?: number;
  payload?: unknown;
  endpoint?: string;
};

const WA_SEND_LOG = "[WA_SEND]";

function collectErrorText(message: string, payload?: unknown) {
  const parts = [message];

  if (typeof payload === "string") {
    parts.push(payload);
  } else if (payload != null) {
    try {
      parts.push(JSON.stringify(payload));
    } catch {
      parts.push(String(payload));
    }
  }

  return parts.join(" ").toLowerCase();
}

export function isEvolutionDisconnectedError(
  message: string,
  payload?: unknown,
): boolean {
  const haystack = collectErrorText(message, payload);

  return (
    haystack.includes("connection closed") ||
    haystack.includes("session closed") ||
    haystack.includes("connection lost") ||
    haystack.includes("not connected") ||
    haystack.includes("instance disconnected") ||
    haystack.includes("is disconnected") ||
    haystack.includes("disconnected instance") ||
    haystack.includes("no open session") ||
    haystack.includes("socket closed")
  );
}

export type WhatsAppSendFailureLogContext = {
  workspaceId?: string;
  conversationId?: string;
  instanceName?: string | null;
  recipientPhone?: string;
  evolutionEndpoint?: string;
  error: unknown;
};

export function getEvolutionErrorDetails(error: unknown) {
  if (error instanceof EvolutionConnectError) {
    return {
      evolutionEndpoint: error.endpoint,
      evolutionStatus: error.status,
      evolutionResponseBody: error.payload,
      evolutionErrorMessage: error.message,
      disconnected: true,
    };
  }

  if (error instanceof Error && "status" in error) {
    const requestError = error as EvolutionRequestError;
    const disconnected = isEvolutionDisconnectedError(
      requestError.message,
      requestError.payload,
    );

    return {
      evolutionEndpoint: requestError.endpoint,
      evolutionStatus: requestError.status,
      evolutionResponseBody: requestError.payload,
      evolutionErrorMessage: requestError.message,
      disconnected,
    };
  }

  if (error instanceof Error && "code" in error) {
    const code = String((error as { code?: string }).code ?? "");
    const disconnected =
      code === "instance_disconnected" ||
      isEvolutionDisconnectedError(error.message);

    return {
      evolutionErrorMessage: error.message,
      disconnected,
    };
  }

  if (error instanceof Error) {
    return {
      evolutionErrorMessage: error.message,
      disconnected: isEvolutionDisconnectedError(error.message),
    };
  }

  return {
    evolutionErrorMessage: String(error),
    disconnected: false,
  };
}

export function logWhatsAppSendFailure(context: WhatsAppSendFailureLogContext) {
  const evolution = getEvolutionErrorDetails(context.error);

  console.error(`${WA_SEND_LOG} send failed`, {
    workspaceId: context.workspaceId,
    conversationId: context.conversationId,
    instanceName: context.instanceName,
    recipientPhone: context.recipientPhone,
    evolutionEndpoint: context.evolutionEndpoint ?? evolution.evolutionEndpoint,
    evolutionStatus: evolution.evolutionStatus,
    evolutionResponseBody: evolution.evolutionResponseBody,
    evolutionErrorMessage: evolution.evolutionErrorMessage,
    disconnected: evolution.disconnected,
  });
}

function isInstanceAlreadyExistsError(status: number, payload: unknown) {
  if (status !== 403 && status !== 409 && status !== 400) {
    return false;
  }

  const message = getErrorMessage(payload).toLowerCase();
  return (
    message.includes("already") ||
    message.includes("exist") ||
    message.includes("in use") ||
    message.includes("sudah")
  );
}

async function evolutionRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const { baseUrl, apiKey } = getEvolutionConfig();
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  let response: Response;

  try {
    response = await fetch(url, {
      ...init,
      headers: {
        apikey: apiKey,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      cache: "no-store",
    });
  } catch (error) {
    if (isNetworkFailure(error)) {
      throw new EvolutionServiceUnavailableError();
    }

    throw error;
  }

  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = { message: text };
    }
  }

  if (!response.ok) {
    if (isNetworkFailure(payload)) {
      throw new EvolutionServiceUnavailableError();
    }

    const message = getErrorMessage(payload) || response.statusText || text;

    if (isEvolutionDisconnectedError(message, payload)) {
      throw new EvolutionConnectError(WHATSAPP_INSTANCE_DISCONNECTED_MESSAGE, {
        endpoint: path,
        status: response.status,
        payload,
      });
    }

    const error = new Error(message) as EvolutionRequestError;
    error.status = response.status;
    error.payload = payload;
    error.endpoint = path;
    throw error;
  }

  return (payload ?? {}) as T;
}

function mapConnectionState(value: string | null | undefined): WhatsAppConnectionState {
  const normalized = value?.trim().toLowerCase() ?? "";

  if (normalized === "open" || normalized === "connected") {
    return "connected";
  }

  if (
    normalized === "connecting" ||
    normalized === "pairing" ||
    normalized === "qrcode"
  ) {
    return "connecting";
  }

  return "disconnected";
}

function extractPhoneNumber(instance: EvolutionFetchInstance | null | undefined) {
  if (!instance) {
    return null;
  }

  if (instance.number?.trim()) {
    return instance.number.trim();
  }

  const ownerJid = instance.ownerJid?.trim();
  if (!ownerJid) {
    return null;
  }

  const digits = ownerJid.split("@")[0]?.replace(/\D/g, "");
  return digits || null;
}

function normalizeQrBase64(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("data:image")) {
    return trimmed;
  }

  return `data:image/png;base64,${trimmed}`;
}

function extractQrBase64(payload: EvolutionConnectResponse | null | undefined) {
  if (!payload) {
    return null;
  }

  return (
    normalizeQrBase64(payload.base64) ??
    normalizeQrBase64(payload.qrcode?.base64) ??
    null
  );
}

async function fetchInstanceRecord(instanceName: string) {
  try {
    const instances = await evolutionRequest<
      EvolutionFetchInstance[] | EvolutionFetchInstance
    >(`/instance/fetchInstances?instanceName=${encodeURIComponent(instanceName)}`);

    if (Array.isArray(instances)) {
      return instances[0] ?? null;
    }

    return instances ?? null;
  } catch (error) {
    if (error instanceof Error && "status" in error && error.status === 404) {
      return null;
    }

    throw error;
  }
}

async function fetchConnectionState(instanceName: string) {
  try {
    const payload = await evolutionRequest<EvolutionConnectionStateResponse>(
      `/instance/connectionState/${encodeURIComponent(instanceName)}`,
    );

    return payload.instance?.state ?? null;
  } catch (error) {
    if (error instanceof Error && "status" in error && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function ensureWhatsAppInstance(instanceName = getEvolutionConfig().instanceName) {
  try {
    await evolutionRequest("/instance/create", {
      method: "POST",
      body: JSON.stringify({
        instanceName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS",
      }),
    });
  } catch (error) {
    const apiError = error as EvolutionRequestError;

    if (
      apiError instanceof Error &&
      typeof apiError.status === "number" &&
      isInstanceAlreadyExistsError(apiError.status, apiError.payload)
    ) {
      return;
    }

    if (error instanceof EvolutionServiceUnavailableError) {
      throw error;
    }

    throw new EvolutionConnectError();
  }
}

export async function fetchWhatsAppQr(
  instanceName = getEvolutionConfig().instanceName,
) {
  const payload = await evolutionRequest<EvolutionConnectResponse>(
    `/instance/connect/${encodeURIComponent(instanceName)}`,
  );

  return extractQrBase64(payload);
}

export async function getWhatsAppInstanceStatus(
  instanceName = getEvolutionConfig().instanceName,
): Promise<WhatsAppInstanceStatus> {
  const [instance, connectionState] = await Promise.all([
    fetchInstanceRecord(instanceName),
    fetchConnectionState(instanceName),
  ]);

  const rawStatus =
    connectionState ??
    instance?.connectionStatus ??
    instance?.state ??
    null;

  const state = mapConnectionState(rawStatus);

  return {
    instanceName,
    state,
    phoneNumber: extractPhoneNumber(instance),
    profileName: instance?.profileName?.trim() || null,
    lastConnectedAt: instance?.updatedAt ?? instance?.createdAt ?? null,
    connectionStatus: rawStatus,
  };
}

export async function connectWhatsAppInstance(
  instanceName = getEvolutionConfig().instanceName,
): Promise<WhatsAppConnectResult> {
  await ensureWhatsAppInstance(instanceName);

  const qrBase64 = await fetchWhatsAppQr(instanceName);
  const status = await getWhatsAppInstanceStatus(instanceName);

  return {
    instanceName,
    state: status.state === "connected" ? "connected" : "connecting",
    qrBase64,
  };
}

export async function disconnectWhatsAppInstance(
  instanceName = getEvolutionConfig().instanceName,
) {
  try {
    await evolutionRequest(`/instance/logout/${encodeURIComponent(instanceName)}`, {
      method: "DELETE",
    });
  } catch (error) {
    if (error instanceof Error && "status" in error && error.status === 404) {
      return getWhatsAppInstanceStatus(instanceName);
    }

    if (error instanceof EvolutionServiceUnavailableError) {
      throw error;
    }

    throw new EvolutionConnectError();
  }

  return getWhatsAppInstanceStatus(instanceName);
}

export function getWhatsAppInstanceName() {
  return getEvolutionConfig().instanceName;
}

export async function sendWhatsAppTextMessage(
  phoneNumber: string,
  text: string,
  instanceName = getEvolutionConfig().instanceName,
) {
  const normalizedNumber = normalizeWhatsappPhoneDigits(phoneNumber);

  if (!normalizedNumber) {
    throw new Error("Nomor WhatsApp tidak valid.");
  }

  const endpoint = `/message/sendText/${encodeURIComponent(instanceName)}`;

  try {
    const payload = await evolutionRequest<{ key?: { id?: string } }>(
      endpoint,
      {
        method: "POST",
        body: JSON.stringify({
          number: normalizedNumber,
          text,
        }),
      },
    );

    return {
      messageId: payload.key?.id?.trim() || null,
    };
  } catch (error) {
    if (
      error instanceof Error &&
      "status" in error &&
      !(error instanceof EvolutionConnectError) &&
      isEvolutionDisconnectedError(error.message, (error as EvolutionRequestError).payload)
    ) {
      throw new EvolutionConnectError(WHATSAPP_INSTANCE_DISCONNECTED_MESSAGE, {
        endpoint,
        status: (error as EvolutionRequestError).status,
        payload: (error as EvolutionRequestError).payload,
      });
    }

    throw error;
  }
}

const WA_AVATAR_SYNC_LOG = "[WA_AVATAR_SYNC]";

function logWaAvatarSync(
  message: string,
  data?: Record<string, unknown>,
) {
  if (data) {
    console.log(`${WA_AVATAR_SYNC_LOG} ${message}`, data);
  } else {
    console.log(`${WA_AVATAR_SYNC_LOG} ${message}`);
  }
}

function getPayloadTopLevelKeys(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return [];
  }

  return Object.keys(payload as Record<string, unknown>);
}

export type FetchWhatsAppProfilePictureInput = {
  phoneNumber: string;
  instanceName?: string;
};

export type FetchWhatsAppProfilePictureResult = {
  profilePictureUrl: string | null;
  /** True when Evolution responded; false on config/transport errors. */
  reachedApi: boolean;
  normalizedPhone?: string;
  source?: "fetchProfilePictureUrl" | "findContacts" | null;
};

function extractProfilePictureUrlFromPayload(payload: unknown): string | null {
  if (payload == null) {
    return null;
  }

  if (typeof payload === "string") {
    const trimmed = payload.trim();
    return trimmed.startsWith("http") ? trimmed : null;
  }

  if (typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;

  for (const key of [
    "profilePictureUrl",
    "profilePicUrl",
    "profilePicture",
    "picture",
    "url",
    "imgUrl",
  ]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  for (const nestedKey of ["data", "response", "result", "profile"]) {
    if (nestedKey in record) {
      const nested = extractProfilePictureUrlFromPayload(record[nestedKey]);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
}

function extractContactsFromFindContactsPayload(payload: unknown) {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.value)) {
      return record.value;
    }
    if (Array.isArray(record.contacts)) {
      return record.contacts;
    }
  }

  return [];
}

async function fetchProfilePictureFromEvolutionContacts(
  instanceName: string,
  normalizedNumber: string,
) {
  const endpoint = `/chat/findContacts/${encodeURIComponent(instanceName)}`;
  const remoteJid = buildWhatsappRemoteJid(normalizedNumber);

  logWaAvatarSync("fallback findContacts request", {
    instanceName,
    normalizedPhone: normalizedNumber,
    remoteJid,
    endpoint,
  });

  const payload = await evolutionRequest<unknown>(endpoint, {
    method: "POST",
    body: JSON.stringify({
      where: {
        remoteJid,
      },
    }),
  });

  logWaAvatarSync("fallback findContacts response", {
    responseKeys: getPayloadTopLevelKeys(payload),
    contactCount: extractContactsFromFindContactsPayload(payload).length,
  });

  for (const contact of extractContactsFromFindContactsPayload(payload)) {
    const url = extractProfilePictureUrlFromPayload(contact);
    if (url) {
      return url;
    }
  }

  return null;
}

/**
 * Evolution API v2.3.7 — POST /chat/fetchProfilePictureUrl/{instanceName}
 * Falls back to POST /chat/findContacts when primary endpoint returns null.
 * Safe for UI: never throws; returns null when unavailable.
 */
export async function fetchWhatsAppProfilePictureUrlResult(
  input: FetchWhatsAppProfilePictureInput,
): Promise<FetchWhatsAppProfilePictureResult> {
  const { instanceName: defaultInstanceName, baseUrl } = getEvolutionConfig();
  const instanceName = input.instanceName?.trim() || defaultInstanceName;
  const normalizedNumber = normalizeWhatsappPhoneDigits(input.phoneNumber);
  const primaryEndpoint = `/chat/fetchProfilePictureUrl/${encodeURIComponent(instanceName)}`;

  logWaAvatarSync("start", {
    instanceName,
    normalizedPhone: normalizedNumber,
    inputPhone: input.phoneNumber,
    endpoint: primaryEndpoint,
    baseUrl,
  });

  if (!normalizedNumber) {
    logWaAvatarSync("invalid phone after normalization", {
      inputPhone: input.phoneNumber,
    });
    return {
      profilePictureUrl: null,
      reachedApi: false,
      normalizedPhone: normalizedNumber,
      source: null,
    };
  }

  try {
    const payload = await evolutionRequest<unknown>(primaryEndpoint, {
      method: "POST",
      body: JSON.stringify({
        number: normalizedNumber,
      }),
    });

    const responseKeys = getPayloadTopLevelKeys(payload);
    let profilePictureUrl = extractProfilePictureUrlFromPayload(payload);
    let source: FetchWhatsAppProfilePictureResult["source"] =
      "fetchProfilePictureUrl";

    logWaAvatarSync("primary response", {
      responseStatus: 200,
      responseKeys,
      profilePictureUrlFound: Boolean(profilePictureUrl),
      profilePictureUrl: profilePictureUrl ?? null,
    });

    if (!profilePictureUrl) {
      try {
        profilePictureUrl = await fetchProfilePictureFromEvolutionContacts(
          instanceName,
          normalizedNumber,
        );
        source = profilePictureUrl ? "findContacts" : "fetchProfilePictureUrl";
      } catch (fallbackError) {
        logWaAvatarSync("fallback findContacts failed", {
          error:
            fallbackError instanceof Error
              ? fallbackError.message
              : String(fallbackError),
        });
      }
    }

    logWaAvatarSync("result", {
      instanceName,
      normalizedPhone: normalizedNumber,
      profilePictureUrlFound: Boolean(profilePictureUrl),
      profilePictureUrl: profilePictureUrl ?? null,
      source,
    });

    return {
      profilePictureUrl,
      reachedApi: true,
      normalizedPhone: normalizedNumber,
      source,
    };
  } catch (error) {
    const evolutionError = error as EvolutionRequestError;
    logWaAvatarSync("fetch failed", {
      instanceName,
      normalizedPhone: normalizedNumber,
      endpoint: primaryEndpoint,
      responseStatus: evolutionError.status ?? null,
      responseKeys: getPayloadTopLevelKeys(evolutionError.payload),
      error: error instanceof Error ? error.message : String(error),
    });

    return {
      profilePictureUrl: null,
      reachedApi: false,
      normalizedPhone: normalizedNumber,
      source: null,
    };
  }
}

export async function fetchWhatsAppProfilePictureUrl(
  input: FetchWhatsAppProfilePictureInput,
): Promise<string | null> {
  const result = await fetchWhatsAppProfilePictureUrlResult(input);
  return result.profilePictureUrl;
}

export {
  EvolutionServiceUnavailableError as WhatsAppServiceUnavailableError,
  EvolutionConnectError as WhatsAppConnectError,
};
