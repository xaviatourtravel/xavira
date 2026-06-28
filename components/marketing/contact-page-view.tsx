import Link from "next/link";
import { ArrowRight, CheckCircle2, Mail } from "lucide-react";

import { submitContactMessageAction } from "@/app/contact/actions";
import { MarketingFooter } from "@/components/marketing/marketing-footer";
import { MarketingNavbar } from "@/components/marketing/marketing-navbar";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CONTACT_INQUIRY_CHANNELS,
  CONTACT_TOPIC_OPTIONS,
} from "@/lib/contact/constants";
import {
  getContactMessageErrorMessage,
  type ContactMessageErrorCode,
} from "@/lib/contact/validate";
import { marketingContent } from "@/lib/marketing/content";
import { cn } from "@/lib/utils";

const selectClassName =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const textareaClassName =
  "flex min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type ContactPageViewProps = {
  error?: string;
  success?: string;
};

function getErrorMessage(error?: string) {
  if (!error) {
    return null;
  }

  const knownCodes: ContactMessageErrorCode[] = [
    "missing_fields",
    "invalid_email",
    "invalid_topic",
    "message_too_short",
  ];

  if (knownCodes.includes(error as ContactMessageErrorCode)) {
    return getContactMessageErrorMessage(error as ContactMessageErrorCode);
  }

  if (error === "submit_failed") {
    return "Pesan belum dapat dikirim. Silakan coba lagi atau email kami langsung.";
  }

  return "Terjadi kesalahan. Silakan coba lagi.";
}

function ContactSuccessState() {
  return (
    <div className="rounded-2xl bg-white p-8 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.22)] ring-1 ring-slate-200/70">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
        <CheckCircle2 className="h-6 w-6" />
      </div>
      <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
        Terima kasih. Pesan Anda sudah kami terima.
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">
        Tim Desklabs akan meninjau pesan Anda dan menghubungi kembali melalui
        email sesuai topik yang Anda pilih.
      </p>
      <p className="mt-4 text-sm text-slate-700">
        Email:{" "}
        <a
          href={`mailto:${marketingContent.brand.email}`}
          className="font-medium text-emerald-700 hover:text-emerald-800"
        >
          {marketingContent.brand.email}
        </a>
      </p>
      <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "mt-8")}>
        Kembali ke beranda
      </Link>
    </div>
  );
}

export function ContactPageView({ error, success }: ContactPageViewProps) {
  const errorMessage = getErrorMessage(error);

  return (
    <div className="min-h-screen bg-[linear-gradient(to_bottom,#ffffff,#f8fafc)] text-slate-950">
      <MarketingNavbar />

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        {success ? (
          <div className="mx-auto max-w-2xl">
            <ContactSuccessState />
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-14">
            <div className="min-w-0">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-emerald-700">
                Contact
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Hubungi Desklabs
              </h1>
              <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
                Punya pertanyaan tentang platform, demo, kerja sama, atau dukungan?
                Tim Desklabs siap membantu.
              </p>

              <div className="mt-8 space-y-4">
                {CONTACT_INQUIRY_CHANNELS.map((channel) => (
                  <article
                    key={channel.id}
                    className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/70"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-sm font-semibold text-slate-950">
                          {channel.title}
                        </h2>
                        <a
                          href={`mailto:${channel.email}`}
                          className="mt-1 inline-block text-sm font-medium text-emerald-700 hover:text-emerald-800"
                        >
                          {channel.email}
                        </a>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                          {channel.description}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
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
                action={submitContactMessageAction}
                className="relative space-y-5 rounded-2xl bg-white p-6 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.22)] ring-1 ring-slate-200/70 sm:p-8"
              >
                <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden>
                  <label htmlFor="contact-company-website">Company website</label>
                  <input
                    id="contact-company-website"
                    name="company_website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Kirim pesan</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Isi formulir di bawah dan tim kami akan merespons secepatnya.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="contact-name">Name *</Label>
                    <Input
                      id="contact-name"
                      name="full_name"
                      required
                      autoComplete="name"
                      placeholder="Nama Anda"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact-email">Email *</Label>
                    <Input
                      id="contact-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="nama@perusahaan.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact-company">Company</Label>
                    <Input
                      id="contact-company"
                      name="company_name"
                      autoComplete="organization"
                      placeholder="Nama perusahaan"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="contact-topic">Topic *</Label>
                    <select
                      id="contact-topic"
                      name="topic"
                      required
                      defaultValue=""
                      className={selectClassName}
                    >
                      <option value="" disabled>
                        Pilih topik
                      </option>
                      {CONTACT_TOPIC_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="contact-message">Message *</Label>
                    <textarea
                      id="contact-message"
                      name="message"
                      required
                      rows={5}
                      placeholder="Tulis pertanyaan atau kebutuhan Anda."
                      className={textareaClassName}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "w-full bg-emerald-700 hover:bg-emerald-800",
                  )}
                >
                  Kirim Pesan
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </button>
              </form>
            </div>
          </div>
        )}
      </main>

      <MarketingFooter />
    </div>
  );
}
