import { formatAutomaticFollowUpTitle } from "@/lib/leads/follow-up-task-display";

export type RecommendationPriority = "low" | "medium" | "high";

export type LeadNextBestAction = {
  title: string;
  text: string;
  priority: RecommendationPriority;
};

export type LeadNextBestActionInput = {
  status: string;
  updatedAt: string;
};

const RECOMMENDATION_FOLLOW_UP_TITLES: Record<string, string> = {
  new: "Follow up lead baru",
  contacted: "Kualifikasi kebutuhan",
  qualified: "Siapkan penawaran",
  proposal_sent: "Follow up proposal",
  negotiating: "Follow up negosiasi",
  won: "Cek proses booking",
  lost: "Evaluasi lost lead",
};

function isOlderThanDays(isoDate: string, days: number) {
  const updatedAt = new Date(isoDate).getTime();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return updatedAt < cutoff;
}

export function getLeadNextBestAction({
  status,
  updatedAt,
}: LeadNextBestActionInput): LeadNextBestAction {
  switch (status) {
    case "new":
      return {
        title: "Kontak Awal Lead",
        text: "Hubungi lead dalam 24 jam pertama.",
        priority: "high",
      };

    case "contacted":
      return {
        title: "Kualifikasi Lead",
        text: "Lakukan kualifikasi kebutuhan pelanggan.",
        priority: "medium",
      };

    case "qualified":
      return {
        title: "Siapkan Penawaran",
        text: "Siapkan penawaran atau itinerary.",
        priority: "medium",
      };

    case "proposal_sent":
      if (isOlderThanDays(updatedAt, 2)) {
        return {
          title: "Follow Up Proposal",
          text: "Proposal sudah dikirim. Disarankan follow up hari ini.",
          priority: "high",
        };
      }

      return {
        title: "Pantau Respons Proposal",
        text: "Pantau respons lead terhadap proposal yang sudah dikirim.",
        priority: "medium",
      };

    case "negotiating":
      if (isOlderThanDays(updatedAt, 3)) {
        return {
          title: "Negosiasi Perlu Perhatian",
          text: "Lead berada dalam tahap negosiasi cukup lama. Perlu tindakan segera.",
          priority: "high",
        };
      }

      return {
        title: "Lanjutkan Negosiasi",
        text: "Lanjutkan diskusi dan tawarkan opsi yang sesuai kebutuhan lead.",
        priority: "medium",
      };

    case "won":
      return {
        title: "Proses Booking",
        text: "Pastikan proses booking dan pembayaran berjalan lancar.",
        priority: "medium",
      };

    case "lost":
      return {
        title: "Evaluasi Lead Hilang",
        text: "Simpan insight dan evaluasi alasan kehilangan lead.",
        priority: "low",
      };

    default:
      return {
        title: "Tindak Lanjut Lead",
        text: "Perbarui status lead dan rencanakan langkah berikutnya.",
        priority: "low",
      };
  }
}

export function getRecommendationFollowUpTaskTitle(status: string) {
  const baseTitle =
    RECOMMENDATION_FOLLOW_UP_TITLES[status] ?? "Tindak lanjut lead";

  return formatAutomaticFollowUpTitle(baseTitle);
}

export function getRecommendationFollowUpDueDays(
  priority: RecommendationPriority,
) {
  switch (priority) {
    case "high":
      return 1;
    case "medium":
      return 2;
    default:
      return 3;
  }
}

export function formatRecommendationPriorityLabel(
  priority: RecommendationPriority,
) {
  switch (priority) {
    case "high":
      return "High";
    case "medium":
      return "Medium";
    default:
      return "Low";
  }
}

export function hasPendingRecommendedFollowUpTask(
  status: string,
  followUpTasks: ReadonlyArray<{ title: string; status: string }>,
) {
  const recommendedTitle = getRecommendationFollowUpTaskTitle(status);

  return followUpTasks.some(
    (task) => task.status === "pending" && task.title === recommendedTitle,
  );
}

export type RecommendationWhatsAppDraftInput = {
  status: string;
  fullName: string;
  packageInterest?: string | null;
};

function getWhatsAppPackageLabel(packageInterest?: string | null) {
  return packageInterest?.trim() || "paket perjalanan";
}

function getWhatsAppLeadName(fullName: string) {
  return fullName.trim() || "Kak";
}

export function getRecommendationWhatsAppDraft({
  status,
  fullName,
  packageInterest,
}: RecommendationWhatsAppDraftInput) {
  const name = getWhatsAppLeadName(fullName);
  const packageLabel = getWhatsAppPackageLabel(packageInterest);

  switch (status) {
    case "new":
      return `Assalamualaikum Kak ${name}, terima kasih sudah menghubungi Xavia Tour. Saya bantu informasikan paket yang Kakak minati ya.`;

    case "contacted":
      return `Assalamualaikum Kak ${name}, saya ingin memastikan kembali kebutuhan perjalanannya. Rencana berangkat berapa orang dan perkiraan bulan apa ya?`;

    case "qualified":
      return `Assalamualaikum Kak ${name}, berdasarkan kebutuhan Kakak, kami bisa bantu siapkan penawaran paket ${packageLabel}.`;

    case "proposal_sent":
      return `Assalamualaikum Kak ${name}, izin follow up penawaran paket ${packageLabel} yang sebelumnya sudah kami kirim. Apakah ada yang ingin ditanyakan?`;

    case "negotiating":
      return `Assalamualaikum Kak ${name}, izin follow up kembali terkait paket ${packageLabel}. Jika ada concern harga, jadwal, atau fasilitas, boleh kami bantu jelaskan.`;

    case "won":
      return `Assalamualaikum Kak ${name}, terima kasih sudah mempercayakan perjalanan bersama Xavia Tour. Kami bantu proses booking dan administrasinya ya.`;

    case "lost":
      return `Assalamualaikum Kak ${name}, terima kasih sebelumnya sudah berdiskusi dengan kami. Semoga ke depannya kami bisa bantu perjalanan Kakak di kesempatan berikutnya.`;

    default:
      return `Assalamualaikum Kak ${name}, terima kasih sudah menghubungi Xavia Tour. Saya bantu informasikan paket yang Kakak minati ya.`;
  }
}

export function getLeadWhatsAppPhone(
  whatsappNumber?: string | null,
  phone?: string | null,
) {
  const raw = whatsappNumber?.trim() || phone?.trim();

  if (!raw) {
    return null;
  }

  const cleaned = raw.replace(/\D/g, "");
  return cleaned || null;
}

export type RecommendationWhatsAppSendInput = RecommendationWhatsAppDraftInput & {
  whatsappNumber?: string | null;
  phone?: string | null;
};

export function getRecommendationWhatsAppSendUrl({
  status,
  fullName,
  packageInterest,
  whatsappNumber,
  phone,
}: RecommendationWhatsAppSendInput) {
  const cleanPhone = getLeadWhatsAppPhone(whatsappNumber, phone);

  if (!cleanPhone) {
    return null;
  }

  const message = getRecommendationWhatsAppDraft({
    status,
    fullName,
    packageInterest,
  });

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
