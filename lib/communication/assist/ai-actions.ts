// Aksi AI ringan dan deterministik (tanpa LLM / tanpa API berbayar).
//
// CATATAN ARSITEKTUR: setiap fungsi murni dan sinkron sehingga cepat dan dapat
// diprediksi. Ketika AI sungguhan tersedia, ganti isi fungsi ini tanpa mengubah
// tanda tangannya, sehingga UI tidak perlu berubah.

const INFORMAL_TO_FORMAL: Record<string, string> = {
  gak: "tidak",
  ga: "tidak",
  nggak: "tidak",
  ngga: "tidak",
  tdk: "tidak",
  udah: "sudah",
  udh: "sudah",
  blm: "belum",
  yg: "yang",
  dgn: "dengan",
  dr: "dari",
  utk: "untuk",
  klo: "kalau",
  kalo: "kalau",
  aja: "saja",
  gmn: "bagaimana",
  bgt: "sekali",
  trus: "terus",
  mksh: "terima kasih",
  makasih: "terima kasih",
  thx: "terima kasih",
  oke: "baik",
  ok: "baik",
};

function capitalizeSentences(text: string): string {
  return text.replace(/(^\s*|[.!?]\s+)([a-zà-ÿ])/g, (_match, prefix, letter) => {
    return `${prefix}${letter.toUpperCase()}`;
  });
}

/**
 * Merapikan tulisan secara deterministik: mengganti singkatan informal,
 * merapikan spasi, mengapitalkan awal kalimat, dan menutup dengan tanda baca.
 */
export function improveWriting(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return trimmed;
  }

  const collapsed = trimmed.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n");

  const replaced = collapsed.replace(/\b([A-Za-z]+)\b/g, (word) => {
    const lower = word.toLowerCase();
    const formal = INFORMAL_TO_FORMAL[lower];
    if (!formal) {
      return word;
    }
    // Pertahankan kapitalisasi awal.
    return word[0] === word[0]?.toUpperCase()
      ? formal.charAt(0).toUpperCase() + formal.slice(1)
      : formal;
  });

  const capitalized = capitalizeSentences(replaced);

  return /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
}

const ID_TO_EN: Record<string, string> = {
  halo: "hello",
  hai: "hi",
  kak: "",
  kakak: "",
  pak: "sir",
  bu: "maam",
  terima: "thank",
  kasih: "you",
  sudah: "already",
  belum: "not yet",
  baik: "okay",
  iya: "yes",
  ya: "yes",
  tidak: "no",
  saya: "I",
  kami: "we",
  kita: "we",
  anda: "you",
  mau: "want",
  ingin: "want",
  bisa: "can",
  tolong: "please",
  bantu: "help",
  bantuan: "help",
  harga: "price",
  paket: "package",
  pesan: "order",
  booking: "booking",
  daftar: "register",
  tersedia: "available",
  jadwal: "schedule",
  keberangkatan: "departure",
  hotel: "hotel",
  kamar: "room",
  pesawat: "flight",
  halal: "halal",
  makanan: "food",
  pembayaran: "payment",
  bayar: "pay",
  dp: "down payment",
  untuk: "for",
  dengan: "with",
  dan: "and",
  atau: "or",
  ke: "to",
  dari: "from",
  di: "in",
  ini: "this",
  itu: "that",
  apakah: "is",
  bagaimana: "how",
  kapan: "when",
  berapa: "how much",
  detail: "detail",
  itinerary: "itinerary",
  silakan: "please",
  hubungi: "contact",
};

/**
 * Terjemahan ID -> EN sederhana (kata per kata, deterministik). Cukup untuk
 * pratinjau cepat; ganti dengan terjemahan sungguhan saat AI tersedia.
 */
export function translateToEnglish(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    return trimmed;
  }

  const translated = trimmed.replace(/\b([A-Za-zà-ÿ]+)\b/g, (word) => {
    const lower = word.toLowerCase();
    const match = ID_TO_EN[lower];
    if (match === undefined) {
      return word;
    }
    return match;
  });

  return translated.replace(/\s{2,}/g, " ").trim();
}
