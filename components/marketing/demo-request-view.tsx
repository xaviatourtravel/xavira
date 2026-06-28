import Link from "next/link";
import { CalendarCheck, CheckCircle2, Mail, MessageSquare } from "lucide-react";

import { submitDemoRequestAction } from "@/app/demo/actions";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNavbar } from "@/components/marketing/marketing-navbar";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DEMO_COMPANY_SIZE_OPTIONS,
  DEMO_INDUSTRY_OPTIONS,
  DEMO_MAIN_CHALLENGE_OPTIONS,
} from "@/lib/demo/constants";
import {
  getDemoRequestErrorMessage,
  type DemoRequestErrorCode,
} from "@/lib/demo/validate";
import { marketingContent } from "@/lib/marketing/content";
import { cn } from "@/lib/utils";

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const textareaClassName =
  "flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const NEXT_STEPS = [
  {
    icon: MessageSquare,
    title: "Tim meninjau kebutuhan Anda",
    description:
      "Kami mempelajari industri, ukuran tim, dan workflow operasional customer Anda.",
  },
  {
    icon: CalendarCheck,
    title: "Demo disesuaikan",
    description:
      "Sesi demo difokuskan pada communication, tasks, sales, dan workflow yang relevan.",
  },
  {
    icon: CheckCircle2,
    title: "Follow-up setelah demo",
    description:
      "Anda mendapat rekomendasi langkah implementasi yang realistis untuk tim Anda.",
  },
];

type DemoRequestViewProps = {
  error?: string;
  success?: string;
};

function getErrorMessage(error?: string) {
  if (!error) {
    return null;
  }

  const knownCodes: DemoRequestErrorCode[] = [
    "missing_fields",
    "invalid_email",
    "invalid_phone",
    "invalid_industry",
    "invalid_company_size",
    "invalid_main_challenge",
  ];

  if (knownCodes.includes(error as DemoRequestErrorCode)) {
    return getDemoRequestErrorMessage(error as DemoRequestErrorCode);
  }

  if (error === "submit_failed") {
    return "Permintaan demo belum dapat diproses. Silakan coba lagi atau hubungi kami langsung.";
  }

  return "Terjadi kesalahan. Silakan coba lagi.";
}

function DemoSuccessState() {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.22)] ring-1 ring-slate-200/70">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
        <CheckCircle2 className="h-6 w-6" />
      </div>
      <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
        Terima kasih. Tim Desklabs akan menghubungi Anda segera.
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        Permintaan demo Anda sudah kami terima. Tim kami akan menghubungi Anda
        melalui email atau WhatsApp sesuai data yang Anda kirimkan.
      </p>
      <div className="mt-6 space-y-2 text-sm text-slate-700">
        <p>
          Email:{" "}
          <a
            href={`mailto:${marketingContent.brand.email}`}
            className="font-medium text-emerald-700 hover:text-emerald-800"
          >
            {marketingContent.brand.email}
          </a>
        </p>
      </div>
      <Link
        href="/"
        className={cn(buttonVariants({ variant: "outline" }), "mt-8")}
      >
        Kembali ke beranda
      </Link>
    </div>
  );
}

export function DemoRequestView({ error, success }: DemoRequestViewProps) {
  const errorMessage = getErrorMessage(error);

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom,#ffffff,#f8fafc)] text-slate-950">
      <MarketingNavbar />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        {success ? (
          <div className="mx-auto max-w-2xl">
            <DemoSuccessState />
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-14">
            <div className="min-w-0">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-700">
                Demo Desklabs
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Jadwalkan Demo Desklabs
              </h1>
              <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
                Ceritakan kebutuhan bisnis Anda, dan tim kami akan membantu
                menunjukkan bagaimana Desklabs dapat digunakan untuk workflow
                operasional customer Anda.
              </p>

              <div className="mt-8 rounded-2xl bg-white/80 p-5 ring-1 ring-slate-200/70">
                <p className="text-sm leading-relaxed text-slate-600">
                  Demo tidak mengikat. Kami akan menyesuaikan demo berdasarkan
                  industri dan workflow bisnis Anda.
                </p>
              </div>

              <div className="mt-8 space-y-5">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Apa yang terjadi selanjutnya
                </h2>
                {NEXT_STEPS.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.title} className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{step.title}</p>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 flex items-center gap-2 text-sm text-slate-600">
                <Mail className="h-4 w-4 shrink-0" />
                <span>
                  Pertanyaan?{" "}
                  <a
                    href={`mailto:${marketingContent.brand.email}?subject=Demo Desklabs`}
                    className="font-medium text-emerald-700 hover:text-emerald-800"
                  >
                    {marketingContent.brand.email}
                  </a>
                </span>
              </div>
            </div>

            <div className="min-w-0">
              {errorMessage ? (
                <div
                  role="alert"
                  className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
                >
                  {errorMessage}
                </div>
              ) : null}

              <form
                action={submitDemoRequestAction}
                className="relative space-y-5 rounded-2xl bg-white p-6 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.22)] ring-1 ring-slate-200/70 sm:p-8"
              >
                <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden>
                  <label htmlFor="company_website">Company website</label>
                  <input
                    id="company_website"
                    name="company_website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="demo-full-name">Full Name *</Label>
                    <Input
                      id="demo-full-name"
                      name="full_name"
                      required
                      autoComplete="name"
                      placeholder="Nama lengkap"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="demo-work-email">Work Email *</Label>
                    <Input
                      id="demo-work-email"
                      name="work_email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="nama@perusahaan.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="demo-company-name">Company Name *</Label>
                    <Input
                      id="demo-company-name"
                      name="company_name"
                      required
                      autoComplete="organization"
                      placeholder="Nama perusahaan"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="demo-phone">Phone / WhatsApp *</Label>
                    <Input
                      id="demo-phone"
                      name="phone"
                      type="tel"
                      required
                      autoComplete="tel"
                      placeholder="+62 812 3456 7890"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="demo-industry">Industry *</Label>
                    <select
                      id="demo-industry"
                      name="industry"
                      required
                      defaultValue=""
                      className={selectClassName}
                    >
                      <option value="" disabled>
                        Pilih industri
                      </option>
                      {DEMO_INDUSTRY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="demo-company-size">Company Size</Label>
                    <select
                      id="demo-company-size"
                      name="company_size"
                      defaultValue=""
                      className={selectClassName}
                    >
                      <option value="">Pilih ukuran tim</option>
                      {DEMO_COMPANY_SIZE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="demo-main-challenge">Main Challenge</Label>
                    <select
                      id="demo-main-challenge"
                      name="main_challenge"
                      defaultValue=""
                      className={selectClassName}
                    >
                      <option value="">Pilih tantangan utama</option>
                      {DEMO_MAIN_CHALLENGE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="demo-message">Message / Notes</Label>
                    <textarea
                      id="demo-message"
                      name="message"
                      rows={4}
                      placeholder="Ceritakan channel komunikasi, proses follow up, dan workflow yang ingin dirapikan."
                      className={textareaClassName}
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-5">
                  <button
                    type="submit"
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "w-full bg-emerald-700 hover:bg-emerald-800",
                    )}
                  >
                    Jadwalkan Demo
                  </button>
                  <p className="mt-3 text-center text-xs leading-relaxed text-slate-500">
                    Dengan mengirim formulir, Anda setuju dihubungi terkait demo
                    produk Desklabs.
                  </p>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <MarketingFooter />
    </div>
  );
}
