import { extractErrorMessage } from "@/lib/errors/get-user-friendly-error-message";

export function logServerError(scope: string, error: unknown) {
  const message = extractErrorMessage(error);
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: string }).code ?? "")
      : undefined;

  console.error(`[${scope}]`, {
    message,
    code,
    error,
  });
}
