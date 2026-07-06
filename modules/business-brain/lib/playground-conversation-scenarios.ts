export type PlaygroundConversationScenario = {
  id: string;
  label: string;
  messages: string[];
};

export const PLAYGROUND_CONVERSATION_SCENARIOS: PlaygroundConversationScenario[] = [
  {
    id: "general-inquiry",
    label: "General Inquiry",
    messages: ["Halo Kak, mau tanya-tanya dulu soal paket liburan."],
  },
  {
    id: "package-recommendation",
    label: "Package Recommendation",
    messages: [
      "Halo Kak, ada paket Jepang buat Oktober?",
      "Budget sekitar 25 juta.",
    ],
  },
  {
    id: "pricing",
    label: "Pricing",
    messages: ["Halo Kak, harga paket Umrah 9 hari berapa ya?"],
  },
  {
    id: "itinerary-request",
    label: "Itinerary Request",
    messages: ["Halo Kak, boleh lihat itinerary Jepang 8 hari?"],
  },
  {
    id: "halal-food",
    label: "Halal Food",
    messages: ["Halo Kak, makanannya halal kan untuk paket Turki?"],
  },
  {
    id: "payment",
    label: "Payment",
    messages: ["Halo Kak, pembayarannya bisa cicilan nggak?"],
  },
  {
    id: "refund",
    label: "Refund",
    messages: ["Halo Kak, kalau batal booking refund-nya gimana?"],
  },
  {
    id: "complaint",
    label: "Complaint",
    messages: ["Kak, saya kecewa pelayanannya kemarin slow banget."],
  },
  {
    id: "private-trip",
    label: "Private Trip",
    messages: ["Halo Kak, bisa request private trip Jepang untuk 2 orang?"],
  },
  {
    id: "family-trip",
    label: "Family Trip",
    messages: [
      "Halo Kak, mau liburan keluarga dengan anak 5 tahun, ada rekomendasi?",
      "Anaknya 2, suami istri jadi total 4 orang.",
    ],
  },
  {
    id: "umrah",
    label: "Umrah",
    messages: [
      "Halo Kak, ada jadwal Umrah bulan November?",
      "Untuk 4 orang, seat masih ada?",
    ],
  },
];

export function getPlaygroundConversationScenario(id: string) {
  return PLAYGROUND_CONVERSATION_SCENARIOS.find((scenario) => scenario.id === id) ?? null;
}
