import {
  isDemoCompanySize,
  isDemoIndustry,
  isDemoMainChallenge,
} from "@/lib/demo/constants";

export type DemoRequestInput = {
  fullName: string;
  workEmail: string;
  companyName: string;
  phone: string;
  industry: string;
  companySize: string;
  mainChallenge: string;
  message: string;
  honeypot: string;
};

export type DemoRequestValidationResult =
  | { ok: true; data: DemoRequestInput }
  | { ok: false; errorCode: DemoRequestErrorCode };

export type DemoRequestErrorCode =
  | "missing_fields"
  | "invalid_email"
  | "invalid_phone"
  | "invalid_industry"
  | "invalid_company_size"
  | "invalid_main_challenge";

function getTrimmed(value: string | undefined) {
  return value?.trim() ?? "";
}

export function isValidWorkEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

export function validateDemoRequestInput(raw: {
  fullName?: string;
  workEmail?: string;
  companyName?: string;
  phone?: string;
  industry?: string;
  companySize?: string;
  mainChallenge?: string;
  message?: string;
  honeypot?: string;
}): DemoRequestValidationResult {
  const fullName = getTrimmed(raw.fullName);
  const workEmail = getTrimmed(raw.workEmail);
  const companyName = getTrimmed(raw.companyName);
  const phone = getTrimmed(raw.phone);
  const industry = getTrimmed(raw.industry);
  const companySize = getTrimmed(raw.companySize);
  const mainChallenge = getTrimmed(raw.mainChallenge);
  const message = getTrimmed(raw.message);
  const honeypot = getTrimmed(raw.honeypot);

  if (!fullName || !workEmail || !companyName || !phone || !industry) {
    return { ok: false, errorCode: "missing_fields" };
  }

  if (!isValidWorkEmail(workEmail)) {
    return { ok: false, errorCode: "invalid_email" };
  }

  if (!isValidPhone(phone)) {
    return { ok: false, errorCode: "invalid_phone" };
  }

  if (!isDemoIndustry(industry)) {
    return { ok: false, errorCode: "invalid_industry" };
  }

  if (companySize && !isDemoCompanySize(companySize)) {
    return { ok: false, errorCode: "invalid_company_size" };
  }

  if (mainChallenge && !isDemoMainChallenge(mainChallenge)) {
    return { ok: false, errorCode: "invalid_main_challenge" };
  }

  return {
    ok: true,
    data: {
      fullName,
      workEmail,
      companyName,
      phone,
      industry,
      companySize,
      mainChallenge,
      message,
      honeypot,
    },
  };
}

export function getDemoRequestErrorMessage(code: DemoRequestErrorCode) {
  switch (code) {
    case "missing_fields":
      return "Lengkapi nama, email kerja, perusahaan, telepon, dan industri.";
    case "invalid_email":
      return "Format email kerja tidak valid.";
    case "invalid_phone":
      return "Nomor telepon/WhatsApp tidak valid. Minimal 8 digit.";
    case "invalid_industry":
      return "Pilih industri yang valid.";
    case "invalid_company_size":
      return "Pilih ukuran perusahaan yang valid.";
    case "invalid_main_challenge":
      return "Pilih tantangan utama yang valid.";
    default:
      return "Terjadi kesalahan. Silakan coba lagi.";
  }
}
