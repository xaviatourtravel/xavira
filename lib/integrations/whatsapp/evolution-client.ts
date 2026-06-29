import {
  WHATSAPP_CONNECT_FAILED_MESSAGE,
  WHATSAPP_INSTANCE_NAME,
  WHATSAPP_SERVICE_UNAVAILABLE_MESSAGE,
} from "@/lib/integrations/whatsapp/constants";
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

export class EvolutionConnectError extends Error {
  constructor(message = WHATSAPP_CONNECT_FAILED_MESSAGE) {
    super(message);
    this.name = "EvolutionConnectError";
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

type EvolutionRequestError = Error & {
  status?: number;
  payload?: unknown;
};

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

    const message = getErrorMessage(payload) || response.statusText;
    const error = new Error(message) as EvolutionRequestError;
    error.status = response.status;
    error.payload = payload;
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

export {
  EvolutionServiceUnavailableError as WhatsAppServiceUnavailableError,
  EvolutionConnectError as WhatsAppConnectError,
};
