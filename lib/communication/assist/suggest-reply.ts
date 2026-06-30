// Saran balasan berbasis aturan (deterministik, tanpa LLM).
//
// CATATAN ARSITEKTUR: fungsi ini sengaja dibuat sederhana dan sinkron agar cepat
// dan dapat diprediksi. Saat AI sungguhan tersedia, ganti isi `suggestReply`
// dengan pemanggilan model sambil mempertahankan tanda tangan fungsi yang sama.

export type ReplySuggestion = {
  id: string;
  label: string;
  text: string;
};

function normalize(text: string | null | undefined): string {
  return (text ?? "").toLowerCase();
}

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

/**
 * Menghasilkan satu saran balasan dari konteks pesan terakhir pelanggan.
 * Selalu mengembalikan saran (default: tindak lanjut yang sopan).
 */
export function suggestReply(lastCustomerMessage: string | null): ReplySuggestion {
  const message = normalize(lastCustomerMessage);

  if (includesAny(message, ["harga", "price", "biaya", "tarif", "berapa"])) {
    return {
      id: "pricing",
      label: "Jawab harga",
      text: "Untuk harganya, saya kirimkan detail paket beserta itinerary lengkapnya ya Kak. Boleh saya tahu tanggal keberangkatan dan jumlah pesertanya?",
    };
  }

  if (includesAny(message, ["booking", "daftar", "pesan", "book", "reservasi"])) {
    return {
      id: "booking",
      label: "Bantu booking",
      text: "Baik Kak, seat masih tersedia. Untuk proses booking, saya bantu siapkan datanya ya. Boleh saya tahu nama lengkap dan jumlah peserta?",
    };
  }

  if (includesAny(message, ["halal", "makanan", "makan", "kuliner", "syariah", "syariat"])) {
    return {
      id: "halal",
      label: "Info halal",
      text: "Tenang Kak, untuk konsumsi kami pilih restoran yang sudah diseleksi sesuai syariat Islam (halal). Jadi Kakak bisa menikmati perjalanan dengan nyaman.",
    };
  }

  return {
    id: "follow_up",
    label: "Tindak lanjut",
    text: "Halo Kak, apakah ada yang bisa saya bantu lebih lanjut? Dengan senang hati saya bantu sampai Kakak menemukan paket yang paling cocok.",
  };
}
