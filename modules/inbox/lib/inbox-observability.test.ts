import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { inboxEn, inboxId } from "@/lib/i18n/inbox-dictionary";
import {
  createInboxDiagnosticId,
  extractSafeErrorFields,
  isValidConversationIdShape,
  logInboxFailure,
  sanitizeErrorMessage,
  sanitizeLogPayload,
} from "@/modules/inbox/lib/inbox-observability";

describe("INBOX-001 observability helpers", () => {
  it("creates searchable diagnostic IDs", () => {
    const id = createInboxDiagnosticId(1_725_000_000_000);
    assert.match(id, /^INB-[0-9A-F]{6}$/);
  });

  it("rejects malformed conversation IDs without treating them as valid UUIDs", () => {
    assert.equal(isValidConversationIdShape("not-a-uuid"), false);
    assert.equal(isValidConversationIdShape(""), false);
    assert.equal(isValidConversationIdShape("123"), false);
    assert.equal(
      isValidConversationIdShape("11111111-1111-4111-8111-111111111111"),
      true,
    );
  });

  it("sanitizes emails, phones, and tokens from error messages", () => {
    const cleaned = sanitizeErrorMessage(
      "failed for user@example.com phone +6281234567890 token Bearer abc.def.ghi",
    );
    assert.equal(cleaned.includes("user@example.com"), false);
    assert.equal(cleaned.includes("+6281234567890"), false);
    assert.equal(cleaned.includes("Bearer abc.def.ghi"), false);
    assert.match(cleaned, /redacted/);
  });

  it("logger payload redacts sensitive keys and never keeps message bodies", () => {
    const sanitized = sanitizeLogPayload({
      conversationId: "11111111-1111-4111-8111-111111111111",
      message_text: "secret customer message",
      phone: "+628111",
      access_token: "tok_123",
      stage: "load_messages",
    });
    assert.equal(sanitized.message_text, "[redacted]");
    assert.equal(sanitized.phone, "[redacted]");
    assert.equal(sanitized.access_token, "[redacted]");
    assert.equal(sanitized.stage, "load_messages");
    assert.equal(
      sanitized.conversationId,
      "11111111-1111-4111-8111-111111111111",
    );
  });

  it("extractSafeErrorFields never returns raw email in message", () => {
    const fields = extractSafeErrorFields(new Error("db boom for user@x.com"));
    assert.equal(fields.errorName, "Error");
    assert.equal(fields.message.includes("user@x.com"), false);
  });

  it("logInboxFailure returns event without stacking sensitive keys", () => {
    const originalError = console.error;
    const lines: unknown[] = [];
    console.error = (...args: unknown[]) => {
      lines.push(args);
    };
    try {
      const event = logInboxFailure({
        operation: "load_conversation",
        stage: "load_messages",
        diagnosticId: "INB-TEST01",
        conversationId: "11111111-1111-4111-8111-111111111111",
        organizationId: "22222222-2222-4222-8222-222222222222",
        error: new Error("relation does not exist"),
      });
      assert.equal(event.scope, "inbox");
      assert.equal(event.diagnosticId, "INB-TEST01");
      assert.equal(event.message.includes("relation does not exist"), true);
      assert.equal(lines.length, 1);
      const logged = JSON.stringify(lines[0]);
      assert.equal(logged.includes("message_text"), false);
      assert.equal(logged.includes("access_token"), false);
    } finally {
      console.error = originalError;
    }
  });

  it("graceful UI copy must not rely on raw database error strings", () => {
    assert.equal(inboxEn.conversationLoadFailed.includes("relation"), false);
    assert.equal(inboxId.conversationLoadFailed, "Percakapan tidak dapat dimuat");
    assert.match(inboxId.conversationLoadFailedDesc, /kendala/i);
    assert.equal(inboxEn.conversationNotFound.includes("organization"), false);
  });
});
