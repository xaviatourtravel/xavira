export type WhatsAppConnectionState = "disconnected" | "connecting" | "connected";

export type WhatsAppInstanceStatus = {
  instanceName: string;
  state: WhatsAppConnectionState;
  phoneNumber: string | null;
  profileName: string | null;
  lastConnectedAt: string | null;
  connectionStatus: string | null;
};

export type WhatsAppConnectResult = {
  instanceName: string;
  state: WhatsAppConnectionState;
  qrBase64: string | null;
};

export type WhatsAppApiSuccess<T> = {
  ok: true;
} & T;

export type WhatsAppApiError = {
  ok: false;
  error: "service_unavailable" | "connect_failed" | "unauthorized" | "forbidden" | "unknown";
  message: string;
};

export type WhatsAppStatusResponse = WhatsAppApiSuccess<{
  status: WhatsAppConnectionState;
  instanceName: string;
  phoneNumber: string | null;
  profileName: string | null;
  lastConnectedAt: string | null;
  connectionStatus: string | null;
}>;

export type WhatsAppQrResponse = WhatsAppApiSuccess<{
  qrBase64: string | null;
  instanceName: string;
}>;

export type WhatsAppConnectResponse = WhatsAppApiSuccess<{
  status: WhatsAppConnectionState;
  qrBase64: string | null;
  instanceName: string;
}>;

export type WhatsAppDisconnectResponse = WhatsAppApiSuccess<{
  status: WhatsAppConnectionState;
  instanceName: string;
}>;
