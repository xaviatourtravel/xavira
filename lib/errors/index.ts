import {
  getUserFriendlyErrorMessage,
  extractErrorMessage,
} from "@/lib/errors/get-user-friendly-error-message";
import { logServerError } from "@/lib/errors/log-server-error";

export { extractErrorMessage, getUserFriendlyErrorMessage, logServerError };

export function formatActionError(error: unknown, scope?: string): string {
  if (scope) {
    logServerError(scope, error);
  }

  return getUserFriendlyErrorMessage(error);
}

export function encodeActionError(error: unknown, scope?: string): string {
  return encodeURIComponent(formatActionError(error, scope));
}
