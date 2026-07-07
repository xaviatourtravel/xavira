import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  normalizeFaqFieldKey,
  resolveFaqFieldKey,
  resolveFaqMetadataKey,
} from "@/modules/business-brain/lib/faq-import-field-aliases";
import {
  buildFaqImportContent,
  parseCombinedProductImportInput,
  parseFaqImportText,
  splitProductAndFaqImportText,
} from "@/modules/business-brain/lib/parse-faq-import-text";
import { parseProductImportText } from "@/modules/business-brain/lib/parse-product-import-text";

const COMPACT_FAQ = [
  "FAQ_ID: FAQ-JPN-TOKYO-FUJI-BRUNEI-001",
  "PRODUCT_ID: JPN-TOKYO-FUJI-BRUNEI-6D4N-2026",
  "QUESTION: Paket Japan Tokyo - Fuji + Brunei ini paket apa?",
  "TRIGGER_PHRASES: paket ini apa; japan fuji brunei itu apa; ini tour apa; jelasin paket jepang ini",
  "ANSWER: Paket Japan Tokyo - Fuji + Brunei 6D4N adalah Muslim Friendly Tour...",
  "NEXT_STEP: Boleh info rencana berangkat berapa orang?",
].join("\n");

function buildSampleWith41Faqs() {
  const productSection = [
    "PRODUCT_NAME: Japan Disneyland 8D6N",
    "COUNTRY: Japan",
    "STARTING_PRICE_ADULT: Rp 25.000.000",
  ].join("\n");

  const faqBlocks = Array.from({ length: 41 }, (_, index) => {
    const number = String(index + 1).padStart(3, "0");
    const question =
      index === 0
        ? "Paket Japan Disneyland 8D6N ini paket apa?"
        : index === 40
          ? "Bagaimana cara booking paket ini?"
          : `Pertanyaan umum nomor ${index + 1}?`;

    return [
      `FAQ ${number}`,
      "QUESTION:",
      question,
      "TRIGGER PHRASES:",
      `trigger-${number}`,
      "ANSWER:",
      `Jawaban untuk FAQ ${number}.`,
      "NEXT STEP:",
      `Langkah ${number}`,
      "-----",
    ].join("\n");
  });

  return `${productSection}\n\n${faqBlocks.join("\n\n")}`;
}

describe("faq field normalization", () => {
  it("normalizes underscore, space, dash, and dot keys", () => {
    assert.equal(normalizeFaqFieldKey("TRIGGER_PHRASES"), "TRIGGER_PHRASES");
    assert.equal(normalizeFaqFieldKey("Trigger Phrases"), "TRIGGER_PHRASES");
    assert.equal(normalizeFaqFieldKey("trigger-phrases"), "TRIGGER_PHRASES");
    assert.equal(normalizeFaqFieldKey("trigger.phrases"), "TRIGGER_PHRASES");
    assert.equal(normalizeFaqFieldKey("NEXT_STEP"), "NEXT_STEP");
    assert.equal(normalizeFaqFieldKey("next-step"), "NEXT_STEP");
    assert.equal(normalizeFaqFieldKey("FAQ_ID"), "FAQ_ID");
    assert.equal(normalizeFaqFieldKey("faq-id"), "FAQ_ID");
  });

  it("resolves aliases for triggers and next step", () => {
    assert.equal(resolveFaqFieldKey("TRIGGERS"), "TRIGGER_PHRASES");
    assert.equal(resolveFaqFieldKey("TRIGGER"), "TRIGGER_PHRASES");
    assert.equal(resolveFaqFieldKey("FOLLOW UP"), "NEXT_STEP");
    assert.equal(resolveFaqFieldKey("Q"), "QUESTION");
    assert.equal(resolveFaqFieldKey("PERTANYAAN"), "QUESTION");
    assert.equal(resolveFaqFieldKey("JAWABAN"), "ANSWER");
    assert.equal(resolveFaqMetadataKey("FAQ ID"), "FAQ_ID");
    assert.equal(resolveFaqMetadataKey("product-id"), "PRODUCT_ID");
  });
});

describe("parseFaqImportText block format", () => {
  it("parses structured FAQ blocks with flexible field labels", () => {
    const parsed = parseFaqImportText(
      [
        "FAQ 001",
        "Q: Apa isi paket ini?",
        "Trigger Phrases: paket apa; isi paket",
        "Answer: Paket tour lengkap.",
        "Next Step: Hubungi sales.",
      ].join("\n"),
    );

    assert.equal(parsed.faqs.length, 1);
    assert.equal(parsed.faqs[0]?.question, "Apa isi paket ini?");
    assert.deepEqual(parsed.faqs[0]?.triggerPhrases, ["paket apa", "isi paket"]);
    assert.equal(parsed.faqs[0]?.answer, "Paket tour lengkap.");
    assert.equal(parsed.faqs[0]?.nextStep, "Hubungi sales.");
  });

  it("supports Indonesian aliases and multiline values", () => {
    const parsed = parseFaqImportText(
      [
        "FAQ 2",
        "Pertanyaan",
        "Apakah visa included?",
        "Frasa Pemicu = visa; dokumen",
        "Jawaban ->",
        "Visa sudah termasuk",
        "untuk passport reguler.",
        "Langkah Berikutnya => Submit passport",
      ].join("\n"),
    );

    assert.equal(parsed.faqs.length, 1);
    assert.equal(parsed.faqs[0]?.question, "Apakah visa included?");
    assert.match(parsed.faqs[0]?.answer ?? "", /Visa sudah termasuk/);
    assert.equal(parsed.faqs[0]?.nextStep, "Submit passport");
  });

  it("detects 41 FAQ blocks from block-format sample", () => {
    const parsed = parseFaqImportText(buildSampleWith41Faqs().split("\n\n").slice(1).join("\n\n"));
    assert.equal(parsed.faqs.length, 41);
    assert.equal(parsed.faqs[0]?.question, "Paket Japan Disneyland 8D6N ini paket apa?");
    assert.equal(parsed.faqs[40]?.question, "Bagaimana cara booking paket ini?");
  });
});

describe("parseFaqImportText compact format", () => {
  it("parses compact key-value FAQ with inline values", () => {
    const parsed = parseFaqImportText(COMPACT_FAQ);

    assert.equal(parsed.faqs.length, 1);
    assert.equal(parsed.faqs[0]?.importedFaqId, "FAQ-JPN-TOKYO-FUJI-BRUNEI-001");
    assert.equal(parsed.faqs[0]?.productId, "JPN-TOKYO-FUJI-BRUNEI-6D4N-2026");
    assert.equal(
      parsed.faqs[0]?.question,
      "Paket Japan Tokyo - Fuji + Brunei ini paket apa?",
    );
    assert.deepEqual(parsed.faqs[0]?.triggerPhrases, [
      "paket ini apa",
      "japan fuji brunei itu apa",
      "ini tour apa",
      "jelasin paket jepang ini",
    ]);
    assert.equal(
      parsed.faqs[0]?.answer,
      "Paket Japan Tokyo - Fuji + Brunei 6D4N adalah Muslim Friendly Tour...",
    );
    assert.equal(parsed.faqs[0]?.nextStep, "Boleh info rencana berangkat berapa orang?");
  });

  it("splits trigger phrases by semicolon and comma", () => {
    const parsed = parseFaqImportText(
      [
        "QUESTION: Test?",
        "TRIGGER PHRASES: alpha; beta, gamma",
        "ANSWER: Done.",
      ].join("\n"),
    );

    assert.deepEqual(parsed.faqs[0]?.triggerPhrases, ["alpha", "beta", "gamma"]);
  });

  it("starts a new FAQ at FAQ_ID and completed QUESTION boundaries", () => {
    const parsed = parseFaqImportText(
      [
        "FAQ_ID: FAQ-001",
        "QUESTION: First?",
        "ANSWER: First answer.",
        "FAQ_ID: FAQ-002",
        "QUESTION: Second?",
        "ANSWER: Second answer.",
      ].join("\n"),
    );

    assert.equal(parsed.faqs.length, 2);
    assert.equal(parsed.faqs[0]?.importedFaqId, "FAQ-001");
    assert.equal(parsed.faqs[1]?.importedFaqId, "FAQ-002");
  });

  it("warns when FAQ productId differs from current product", () => {
    const parsed = parseFaqImportText(COMPACT_FAQ, {
      currentProductId: "OTHER-PRODUCT",
    });

    assert.equal(parsed.faqs.length, 1);
    assert.match(parsed.warnings.join(","), /product_id_mismatch:JPN-TOKYO-FUJI-BRUNEI-6D4N-2026/);
  });
});

describe("parseFaqImportText content builder", () => {
  it("combines answer and next step for knowledge content", () => {
    const content = buildFaqImportContent({
      answer: "Jawaban utama.",
      nextStep: "Kirim data passport.",
      triggerPhrases: ["passport"],
    });

    assert.match(content, /Jawaban utama\./);
    assert.match(content, /Next step:\nKirim data passport\./);
    assert.match(content, /Trigger phrases: passport/);
  });
});

describe("combined product and FAQ import", () => {
  it("splits product section from FAQ section using FAQ headers and FAQ_ID", () => {
    const blockSample = buildSampleWith41Faqs();
    const split = splitProductAndFaqImportText(blockSample);

    assert.match(split.productText, /PRODUCT_NAME: Japan Disneyland 8D6N/);
    assert.match(split.faqText, /^FAQ 001/m);

    const compactSplit = splitProductAndFaqImportText(
      ["PRODUCT_NAME: Sample", COMPACT_FAQ].join("\n\n"),
    );
    assert.match(compactSplit.productText, /PRODUCT_NAME: Sample/);
    assert.match(compactSplit.faqText, /^FAQ_ID:/);
  });

  it("keeps product fields and excludes FAQ labels from additional fields", () => {
    const input = buildSampleWith41Faqs();
    const combined = parseCombinedProductImportInput(input);
    const product = parseProductImportText(input);

    assert.equal(product.name, "Japan Disneyland 8D6N");
    assert.equal(product.country, "Japan");
    assert.equal(product.additionalFields.length, 0);
    assert.equal(combined.faqImport.faqs.length, 41);
  });
});
