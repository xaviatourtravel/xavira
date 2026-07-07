export const leadsUiEn = {
  leadSourceMetaAds: "Meta Ads",
  leadSourceInstagram: "Instagram",
  leadSourceTiktok: "TikTok",
  leadSourceWebsite: "Website",
  leadSourceWhatsapp: "WhatsApp",
  leadSourceReferral: "Referral",
  leadSourceRepeatCustomer: "Repeat Customer",
  leadSourceWalkIn: "Walk In",
  leadSourceOther: "Other",
  leadSourceLegacySuffix: "Legacy",
} as const;

export const leadsUiId = {
  leadSourceMetaAds: "Meta Ads",
  leadSourceInstagram: "Instagram",
  leadSourceTiktok: "TikTok",
  leadSourceWebsite: "Website",
  leadSourceWhatsapp: "WhatsApp",
  leadSourceReferral: "Referral",
  leadSourceRepeatCustomer: "Pelanggan Repeat",
  leadSourceWalkIn: "Walk In",
  leadSourceOther: "Lainnya",
  leadSourceLegacySuffix: "Legacy",
} as const;

export type LeadsUiKey = keyof typeof leadsUiEn;

export type LeadsUiDictionary = Record<LeadsUiKey, string>;
