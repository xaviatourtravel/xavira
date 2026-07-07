import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildFaqImportContent,
  parseCombinedProductImportInput,
  parseFaqImportText,
  splitProductAndFaqImportText,
} from "@/modules/business-brain/lib/parse-faq-import-text";
import { parseProductImportText } from "@/modules/business-brain/lib/parse-product-import-text";

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

describe("parseFaqImportText", () => {
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

  it("detects 41 FAQ blocks from combined sample", () => {
    const parsed = parseFaqImportText(buildSampleWith41Faqs().split("\n\n").slice(1).join("\n\n"));
    assert.equal(parsed.faqs.length, 41);
    assert.equal(parsed.faqs[0]?.question, "Paket Japan Disneyland 8D6N ini paket apa?");
    assert.equal(parsed.faqs[40]?.question, "Bagaimana cara booking paket ini?");
  });

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
  it("splits product section from FAQ section", () => {
    const input = buildSampleWith41Faqs();
    const split = splitProductAndFaqImportText(input);

    assert.match(split.productText, /PRODUCT_NAME: Japan Disneyland 8D6N/);
    assert.match(split.faqText, /^FAQ 001/m);
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
