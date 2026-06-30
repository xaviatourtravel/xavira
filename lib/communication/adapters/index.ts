export type {
  AdapterAttachmentInput,
  AdapterAttachmentResult,
  AdapterPresenceInput,
  AdapterReadInput,
  AdapterRetryInput,
  ChannelAdapter,
} from "@/lib/communication/adapters/types";
export {
  getChannelAdapter,
  hasChannelAdapter,
} from "@/lib/communication/adapters/registry";
export { whatsAppAdapter } from "@/lib/communication/adapters/whatsapp-adapter";
