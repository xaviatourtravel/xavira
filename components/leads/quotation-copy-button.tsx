"use client";

export function QuotationCopyButton({
  text,
}: {
  text: string;
}) {
  async function copyText() {
    await navigator.clipboard.writeText(text);
    alert("Penawaran berhasil disalin.");
  }

  return (
    <button
      type="button"
      onClick={copyText}
      className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white"
    >
      Copy Penawaran
    </button>
  );
}