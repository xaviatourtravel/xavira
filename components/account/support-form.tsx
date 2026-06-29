"use client";

import { useState } from "react";

import { AccountCard } from "@/components/account/account-card";
import { DesklabsButton } from "@/components/ui/desklabs-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const TOPIC_OPTIONS = [
  { value: "account", label: "Akun" },
  { value: "billing", label: "Billing" },
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Fitur" },
  { value: "integration", label: "Integrasi" },
  { value: "other", label: "Lainnya" },
] as const;

type SupportFormProps = {
  defaultName: string;
  defaultEmail: string;
};

export function SupportForm({ defaultName, defaultEmail }: SupportFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    await new Promise((resolve) => window.setTimeout(resolve, 600));

    setPending(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <AccountCard title="Pesan Terkirim">
        <p className="text-sm leading-relaxed text-slate-600">
          Terima kasih. Pesan Anda sudah kami terima.
        </p>
        <p className="mt-3 text-sm text-slate-500">
          Tim kami akan merespons melalui email dalam 1-2 hari kerja.
        </p>
      </AccountCard>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <AccountCard
        title="Kirim Pesan"
        description="Jelaskan kendala atau pertanyaan Anda. Tim Desklabs akan membantu."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="support_name">Nama</Label>
            <Input
              id="support_name"
              name="name"
              defaultValue={defaultName}
              required
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="support_email">Email</Label>
            <Input
              id="support_email"
              name="email"
              type="email"
              defaultValue={defaultEmail}
              required
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="support_topic">Topik</Label>
            <select
              id="support_topic"
              name="topic"
              required
              defaultValue="account"
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm"
            >
              {TOPIC_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="support_message">Pesan</Label>
            <textarea
              id="support_message"
              name="message"
              required
              rows={5}
              placeholder="Jelaskan kendala atau pertanyaan Anda..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm"
            />
          </div>
        </div>
      </AccountCard>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          Atau email langsung:{" "}
          <a
            href="mailto:support@desklabs.id"
            className="font-medium text-slate-900 underline-offset-2 hover:underline"
          >
            support@desklabs.id
          </a>
        </p>
        <DesklabsButton
          type="submit"
          loading={pending}
          loadingLabel="Memproses..."
          className="h-11 w-full sm:w-auto"
        >
          Kirim Pesan
        </DesklabsButton>
      </div>
    </form>
  );
}
