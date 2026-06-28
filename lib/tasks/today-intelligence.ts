import type { WorkspaceTask } from "@/lib/tasks/types";

const TASK_ESTIMATE_MINUTES: Record<string, number> = {
  reply_conversation: 5,
  resolve_inbox_unread: 5,
  follow_up_customer: 10,
  confirm_payment: 15,
  send_payment_reminder: 10,
  request_passport: 8,
  complete_participant_data: 12,
  create_booking: 20,
  review_ai_suggestion: 5,
  custom: 10,
};

export function estimateTaskMinutes(task: WorkspaceTask): number {
  return TASK_ESTIMATE_MINUTES[task.taskType] ?? 10;
}

export function estimateTotalMinutes(tasks: WorkspaceTask[]): number {
  return tasks.reduce((sum, task) => sum + estimateTaskMinutes(task), 0);
}

export function formatEstimatedDuration(minutes: number): string {
  if (minutes < 60) {
    return `~${minutes} menit`;
  }

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (remainder === 0) {
    return `~${hours} jam`;
  }

  return `~${hours}j ${remainder}m`;
}

export function getTaskReason(task: WorkspaceTask): string {
  if (task.description?.trim()) {
    return task.description.trim();
  }

  switch (task.taskType) {
    case "reply_conversation":
      return "Customer menunggu balasan. Respons cepat meningkatkan kepercayaan.";
    case "follow_up_customer":
      return "Follow up terjadwal perlu diselesaikan agar deal tetap bergerak.";
    case "confirm_payment":
      return "Pembayaran perlu dikonfirmasi untuk melanjutkan operasional booking.";
    case "send_payment_reminder":
      return "Outstanding payment perlu ditindaklanjuti.";
    case "request_passport":
      return "Data peserta belum lengkap. Berisiko menunda keberangkatan.";
    case "complete_participant_data":
      return "Detail peserta perlu dilengkapi sebelum departure.";
    default:
      return "Item prioritas tinggi yang membutuhkan tindakan Anda hari ini.";
  }
}

export function getTaskBusinessImpact(task: WorkspaceTask): string {
  if (task.priority === "urgent") {
    if (task.taskType === "reply_conversation") {
      return "Mencegah kehilangan lead panas";
    }
    return "Dampak tinggi pada revenue hari ini";
  }

  switch (task.taskType) {
    case "reply_conversation":
    case "resolve_inbox_unread":
      return "Mempertahankan momentum percakapan";
    case "follow_up_customer":
      return "Menjaga deal tetap di pipeline";
    case "confirm_payment":
    case "send_payment_reminder":
      return "Mempercepat cash flow";
    case "request_passport":
    case "complete_participant_data":
      return "Menghindari delay operasional";
    default:
      return "Menjaga operasional customer tetap lancar";
  }
}

export type GreetingPeriod = "morning" | "afternoon" | "evening";

export function getGreetingPeriod(date = new Date()): GreetingPeriod {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: "Asia/Jakarta",
    }).format(date),
  );

  if (hour < 12) {
    return "morning";
  }

  if (hour < 17) {
    return "afternoon";
  }

  return "evening";
}

export function getGreetingLabel(period: GreetingPeriod): string {
  switch (period) {
    case "morning":
      return "Selamat pagi";
    case "afternoon":
      return "Selamat siang";
    case "evening":
      return "Selamat malam";
  }
}

export function buildMorningBrief(input: {
  tasks: WorkspaceTask[];
  unreadConversations: number;
  paymentsToConfirm: number;
  overdueTasks: number;
}): string {
  const { tasks, unreadConversations, paymentsToConfirm, overdueTasks } = input;

  if (tasks.length === 0) {
    return "Tidak ada urgensi besar saat ini. Gunakan waktu untuk review pipeline atau persiapkan follow up besok.";
  }

  const parts: string[] = [];

  if (unreadConversations > 0) {
    parts.push(
      `${unreadConversations} percakapan menunggu balasan`,
    );
  }

  if (paymentsToConfirm > 0) {
    parts.push(
      `${paymentsToConfirm} pembayaran perlu konfirmasi`,
    );
  }

  if (overdueTasks > 0) {
    parts.push(`${overdueTasks} task sudah melewati deadline`);
  }

  const topTask = tasks[0];
  const focus =
    topTask?.customerName != null
      ? `Mulai dari ${topTask.customerName}: ${topTask.title.toLowerCase()}.`
      : "Mulai dari aksi prioritas tertinggi di bawah.";

  if (parts.length === 0) {
    return `${tasks.length} pekerjaan terjadwal hari ini. ${focus}`;
  }

  return `Hari ini: ${parts.join(", ")}. ${focus}`;
}

export function buildDailyObjective(input: {
  tasks: WorkspaceTask[];
  unreadConversations: number;
  paymentsToConfirm: number;
}): string {
  const goals: string[] = [];

  if (input.unreadConversations > 0) {
    goals.push(
      `balas ${Math.min(input.unreadConversations, 5)} percakapan`,
    );
  }

  const paymentTasks = input.tasks.filter(
    (task) =>
      task.taskType === "confirm_payment" ||
      task.taskType === "send_payment_reminder",
  ).length;

  if (paymentTasks > 0 || input.paymentsToConfirm > 0) {
    goals.push("konfirmasi pembayaran outstanding");
  }

  const followUps = input.tasks.filter(
    (task) => task.taskType === "follow_up_customer",
  ).length;

  if (followUps > 0) {
    goals.push("selesaikan follow up customer");
  }

  if (goals.length === 0) {
    return "Selesaikan antrian prioritas dan jaga inbox tetap responsif.";
  }

  return `Target hari ini: ${goals.join(" dan ")}.`;
}

export type DailyInsightTemplate = {
  id: string;
  condition: (ctx: InsightContext) => boolean;
  message: string;
  actionLabel: string;
  actionHref: string;
};

export type InsightContext = {
  unreadConversations: number;
  overdueTasks: number;
  paymentsToConfirm: number;
  openTasks: number;
  knowledgeCount: number;
};

export const DAILY_INSIGHT_TEMPLATES: DailyInsightTemplate[] = [
  {
    id: "inbox-first",
    condition: (ctx) => ctx.unreadConversations >= 3,
    message:
      "Balas percakapan unread sebelum jam 11:00. Response time cepat meningkatkan conversion hingga 2×.",
    actionLabel: "Buka Inbox",
    actionHref: "/inbox",
  },
  {
    id: "payment-focus",
    condition: (ctx) => ctx.paymentsToConfirm >= 2,
    message:
      "Prioritaskan konfirmasi pembayaran pagi ini. Outstanding yang tertunda sering menghambat closing berikutnya.",
    actionLabel: "Lihat Bookings",
    actionHref: "/bookings",
  },
  {
    id: "overdue-recovery",
    condition: (ctx) => ctx.overdueTasks >= 1,
    message:
      "Ada task yang overdue. Selesaikan satu per satu sebelum menambah pekerjaan baru. Fokus mengalahkan multitasking.",
    actionLabel: "Lihat antrian",
    actionHref: "#priority-queue",
  },
  {
    id: "knowledge-gap",
    condition: (ctx) => ctx.knowledgeCount === 0,
    message:
      "Knowledge hub masih kosong. Tambahkan SOP balasan umum agar tim bisa merespons lebih konsisten.",
    actionLabel: "Buat artikel",
    actionHref: "/knowledge/new",
  },
  {
    id: "steady-day",
    condition: () => true,
    message:
      "Pagi yang baik untuk review pipeline. Luangkan 10 menit mengecek lead yang belum di-follow up minggu ini.",
    actionLabel: "Buka Leads",
    actionHref: "/leads",
  },
];

export function pickDailyInsight(
  ctx: InsightContext,
  date = new Date(),
): DailyInsightTemplate {
  const daySeed = Number(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date).replace(/-/g, ""),
  );

  const matching = DAILY_INSIGHT_TEMPLATES.filter((template) =>
    template.condition(ctx),
  );

  const pool = matching.length > 0 ? matching : [DAILY_INSIGHT_TEMPLATES.at(-1)!];
  return pool[daySeed % pool.length]!;
}

export const PRIORITY_QUEUE_GROUPS = {
  communication: {
    id: "communication",
    label: "Communication",
    description: "Percakapan dan follow up customer",
    taskTypes: [
      "reply_conversation",
      "resolve_inbox_unread",
      "follow_up_customer",
    ],
  },
  payments: {
    id: "payments",
    label: "Payments",
    description: "Konfirmasi dan penagihan pembayaran",
    taskTypes: ["confirm_payment", "send_payment_reminder"],
  },
  operations: {
    id: "operations",
    label: "Operations",
    description: "Booking, peserta, dan operasional",
    taskTypes: [
      "request_passport",
      "complete_participant_data",
      "create_booking",
      "review_ai_suggestion",
      "custom",
    ],
  },
} as const;

export function groupTasksForQueue(tasks: WorkspaceTask[]) {
  const assigned = new Set<string>();
  const groups = Object.values(PRIORITY_QUEUE_GROUPS).map((group) => {
    const groupTasks = tasks.filter((task) => {
      if (assigned.has(task.id)) {
        return false;
      }

      if ((group.taskTypes as readonly string[]).includes(task.taskType)) {
        assigned.add(task.id);
        return true;
      }

      return false;
    });

    return {
      ...group,
      tasks: groupTasks,
    };
  });

  const unassigned = tasks.filter((task) => !assigned.has(task.id));
  if (unassigned.length > 0) {
    const operationsGroup = groups.find((group) => group.id === "operations");
    if (operationsGroup) {
      operationsGroup.tasks.push(...unassigned);
    }
  }

  return groups;
}
