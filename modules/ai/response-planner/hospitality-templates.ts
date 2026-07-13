import type { CatalogResult } from "@/modules/ai/response-planner/types";
import {
  canonicalizeCountryQuery,
  getCountryDisplayName,
  getDestinationDisplayName,
  inferCountryFromDestination,
} from "@/modules/ai/response-planner/product-geography";
import { formatCatalogList, formatPriceList } from "@/modules/ai/response-planner/resolve-catalog";

export function buildFirstGreetingTemplate(input: {
  daypart: string;
  companyName: string | null;
  language?: "id" | "en";
}): string {
  if (input.language === "en") {
    return input.companyName
      ? `Hello! Thanks for contacting ${input.companyName}. How can we help today?`
      : "Hello! How can we help today?";
  }

  if (input.companyName) {
    return `Halo Kak, selamat ${input.daypart}. Terima kasih sudah menghubungi ${input.companyName}. Ada yang bisa kami bantu hari ini?`;
  }

  return `Halo Kak, selamat ${input.daypart}. Ada yang bisa kami bantu hari ini?`;
}

export function buildGeneralCatalogTemplate(catalogList: string): string {
  return `Tentu, Kak. Saat ini kami memiliki beberapa pilihan yang bisa dipertimbangkan:\n${catalogList}\n\nKakak paling tertarik dengan yang mana?`;
}

export function buildDestinationCatalogTemplate(destination: string, catalogList: string): string {
  return `Siap, Kak. Untuk ${destination}, berikut pilihan yang tersedia:\n${catalogList}\n\nKakak rencananya ingin berangkat kapan?`;
}

export function buildDestinationAckCatalogTemplate(destination: string, catalogList: string): string {
  return `Wah, ${destination} memang menarik, Kak. Saat ini ada beberapa pilihan yang bisa dipertimbangkan:\n${catalogList}\n\nKakak rencananya ingin berangkat bulan apa?`;
}

export function buildCountryCatalogTemplate(country: string, catalogList: string): string {
  return `Siap, Kak. Untuk ${country}, saat ini kami memiliki beberapa pilihan:\n${catalogList}\n\nKakak paling tertarik ke destinasi yang mana?`;
}

export function buildPriceCatalogTemplate(priceList: string): string {
  return `Untuk pilihan tadi, berikut harga yang tercatat saat ini:\n${priceList}\n\nKakak ingin saya jelaskan paket yang mana lebih dulu?`;
}

export function buildNoExactDestinationTemplate(
  destination: string,
  country: string,
  alternativeList: string,
): string {
  const destinationLabel = getDestinationDisplayName(destination);
  const countryLabel = getCountryDisplayName(
    canonicalizeCountryQuery(country) ?? inferCountryFromDestination(destination) ?? country,
  );
  return `Saat ini saya belum menemukan paket aktif khusus ${destinationLabel}. Namun, kami memiliki beberapa pilihan ${countryLabel} lainnya:\n${alternativeList}\n\nKakak tertarik melihat salah satunya?`;
}

export function buildNoMatchCatalogTemplate(label: string): string {
  return `Maaf Kak, saat ini saya belum menemukan paket aktif untuk ${label} pada data kami. Saya teruskan ke tim sales agar bisa dibantu lebih lanjut.`;
}

export function buildSelectedProductScheduleTemplate(input: {
  productName: string;
  periodLabel: string;
  verifiedDates: string;
  verifiedPrice: string | null;
}): string {
  const pricePart = input.verifiedPrice ? ` Harga mulai ${input.verifiedPrice}.` : "";
  return `Untuk ${input.productName}, keberangkatan ${input.periodLabel} tersedia pada ${input.verifiedDates}.${pricePart} Kakak lebih cocok tanggal yang mana?`;
}

export function buildSelectedProductScheduleMissingTemplate(input: {
  productName: string;
  periodLabel: string;
}): string {
  return `Untuk ${input.productName}, saya belum menemukan jadwal keberangkatan ${input.periodLabel} pada data aktif kami, Kak. Saya teruskan ke tim sales untuk memastikan jadwal terbarunya.`;
}

export function buildCatalogDirectAnswer(input: {
  requestType: string;
  queryType: string;
  queryValue: string | null;
  results: CatalogResult[];
  exactResults?: CatalogResult[];
  alternativeResults?: CatalogResult[];
  moreAvailable: boolean;
}): { template: string; followUp: string } {
  const exactResults = input.exactResults ?? input.results.filter((item) => item.matchType === "exact");
  const alternativeResults =
    input.alternativeResults ?? input.results.filter((item) => item.matchType === "same_country_alternative");

  if (exactResults.length > 0) {
    const catalogList = formatCatalogList(exactResults);
    const destinationLabel = getDestinationDisplayName(input.queryValue ?? "destinasi ini");
    const countryLabel = getCountryDisplayName(
      canonicalizeCountryQuery(input.queryValue ?? "") ??
        inferCountryFromDestination(input.queryValue ?? "") ??
        input.queryValue ??
        "negara ini",
    );

    if (input.requestType === "CATALOG_DISCOVERY" || input.queryType === "general") {
      const followUp = input.moreAvailable
        ? "Masih ada pilihan lain juga. Kakak paling tertarik dengan yang mana?"
        : "Kakak paling tertarik dengan yang mana?";
      return {
        template: buildGeneralCatalogTemplate(catalogList),
        followUp,
      };
    }

    if (input.queryType === "country") {
      return {
        template: buildCountryCatalogTemplate(countryLabel, catalogList),
        followUp: "Kakak paling tertarik ke destinasi yang mana?",
      };
    }

    if (exactResults.length === 1) {
      const item = exactResults[0];
      const singleLine = [item.displayName, item.duration, item.priceLabel].filter(Boolean).join(" — ");
      return {
        template: `Siap, Kak. Saat ini ada pilihan ${destinationLabel}: ${singleLine}.`,
        followUp: "Kakak rencananya ingin berangkat bulan apa?",
      };
    }

    return {
      template: buildDestinationAckCatalogTemplate(destinationLabel, catalogList),
      followUp: "Kakak rencananya ingin berangkat bulan apa?",
    };
  }

  if (alternativeResults.length > 0) {
    const alternativeList = formatCatalogList(alternativeResults);
    const destinationLabel = getDestinationDisplayName(input.queryValue ?? "destinasi ini");
    const countryLabel = getCountryDisplayName(
      inferCountryFromDestination(input.queryValue ?? "") ?? input.queryValue ?? "negara ini",
    );
    return {
      template: buildNoExactDestinationTemplate(destinationLabel, countryLabel, alternativeList),
      followUp: "Kakak tertarik melihat salah satunya?",
    };
  }

  const label = getCountryDisplayName(
    canonicalizeCountryQuery(input.queryValue ?? "") ?? input.queryValue ?? "permintaan tersebut",
  );
  return {
    template: buildNoMatchCatalogTemplate(label),
    followUp: "Ada destinasi lain yang ingin Kakak cek?",
  };
}

export function buildMultiProductPriceTemplate(results: CatalogResult[]): string {
  const priceList = formatPriceList(results.filter((item) => item.priceLabel));
  return buildPriceCatalogTemplate(priceList);
}
