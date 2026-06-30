// Communication Messaging Engine.
//
//   Communication Workspace -> Messaging Service -> Channel Adapter -> Provider
//
// Workspace hanya berbicara dengan Messaging Service (lewat modul ini atau route
// /api/communication/messages/send). Hanya adapter yang boleh menjangkau
// provider (Evolution, Meta, ...). Menambah kanal = adapter baru + gateway baru,
// didaftarkan di adapters/registry.ts dan messaging/gateway-registry.ts.

export * from "@/lib/communication/messaging";
export * from "@/lib/communication/adapters";
export * from "@/lib/communication/drafts/draft-storage";
export * from "@/lib/communication/composer";
