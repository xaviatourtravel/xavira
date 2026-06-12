"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { CampaignSelect } from "@/components/campaigns/campaign-select";
import { LeadSourceSelect } from "@/components/leads/lead-source-select";
import { LeadTemperatureSelect } from "@/components/leads/lead-temperature-select";
import { buttonVariants } from "@/components/ui/button";
import { isAdminOrOwner } from "@/lib/auth/permissions";
import { getTodayLeadDateValue, toLeadDateInputValue } from "@/lib/leads/lead-date";
import type {
  LeadFormOptions,
  LeadFormValues,
} from "@/lib/leads/lead-form-types";
import type { Profile } from "@/types/app-types";
import { cn } from "@/lib/utils";

const inputClassName = "mt-1 w-full rounded-md border px-3 py-2 text-sm";

type LeadFormProps = {
  mode: "create" | "edit";
  action: (formData: FormData) => void | Promise<void>;
  profile: Profile;
  options: LeadFormOptions;
  values?: LeadFormValues;
  leadId?: string;
  returnTo?: string;
  onCancel?: () => void;
  cancelHref?: string;
  className?: string;
  footer?: ReactNode;
};

function toDateInputValue(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  return value.slice(0, 10);
}

export function LeadForm({
  mode,
  action,
  profile,
  options,
  values,
  leadId,
  returnTo,
  onCancel,
  cancelHref,
  className,
  footer,
}: LeadFormProps) {
  const isCreate = mode === "create";
  const canAssignOthers = isAdminOrOwner(profile);
  const defaultAssignedTo = isCreate
    ? canAssignOthers
      ? (values?.assigned_to ?? "")
      : profile.id
    : (values?.assigned_to ?? "");

  const formClassName = cn(
    isCreate ? "space-y-5 rounded-lg border p-6" : "space-y-5",
    className,
  );

  return (
    <form action={action} className={formClassName}>
      {leadId && <input type="hidden" name="lead_id" value={leadId} />}
      {returnTo && <input type="hidden" name="return_to" value={returnTo} />}

      <div>
        <label className="text-sm font-medium">Nama Lengkap *</label>
        <input
          name="full_name"
          required
          defaultValue={values?.full_name ?? ""}
          className={inputClassName}
          placeholder="Contoh: Ahmad Fauzi"
        />
      </div>

      <div>
        <label className="text-sm font-medium">No WhatsApp</label>
        <input
          name="whatsapp_number"
          defaultValue={values?.whatsapp_number ?? ""}
          className={inputClassName}
          placeholder="Contoh: 6281212345678"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Email</label>
        <input
          name="email"
          type="email"
          defaultValue={values?.email ?? ""}
          className={inputClassName}
          placeholder="nama@email.com"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Tanggal Lead Masuk</label>
        <input
          name="lead_date"
          type="date"
          defaultValue={
            toLeadDateInputValue(values?.lead_date) ||
            (isCreate ? getTodayLeadDateValue() : "")
          }
          className={inputClassName}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Lead Source</label>
        <LeadSourceSelect
          defaultValue={values?.source}
          className={inputClassName}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Paket Diminati</label>
        <select
          name="package_interest"
          defaultValue={values?.package_interest ?? ""}
          className={inputClassName}
        >
          <option value="">Pilih Paket</option>
          {options.packages.map((pkg) => (
            <option key={pkg.id} value={pkg.name}>
              {pkg.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium">Lead Temperature</label>
        <LeadTemperatureSelect
          defaultValue={values?.lead_temperature}
          className={inputClassName}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Status</label>
        <select
          name="status"
          defaultValue={values?.status ?? (isCreate ? "new" : "")}
          className={inputClassName}
        >
          <option value="new">Baru</option>
          <option value="contacted">Dihubungi</option>
          <option value="qualified">Qualified</option>
          <option value="proposal_sent">Proposal Dikirim</option>
          <option value="negotiating">Negosiasi</option>
          <option value="won">Menang</option>
          <option value="lost">Lost</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-medium">Assigned User</label>
        {canAssignOthers ? (
          <select
            name="assigned_to"
            defaultValue={defaultAssignedTo}
            className={inputClassName}
          >
            <option value="">Belum di-assign</option>
            {options.orgProfiles.map((member) => (
              <option key={member.id} value={member.id}>
                {member.full_name || "Pengguna"}
              </option>
            ))}
          </select>
        ) : (
          <>
            <input type="hidden" name="assigned_to" value={profile.id} />
            <input
              readOnly
              value={
                options.orgProfiles.find((member) => member.id === profile.id)
                  ?.full_name || "Anda"
              }
              className={cn(inputClassName, "bg-muted/50")}
            />
          </>
        )}
      </div>

      <div>
        <label className="text-sm font-medium">Campaign</label>
        <CampaignSelect
          campaigns={options.campaigns}
          defaultValue={values?.campaign_id}
          className={inputClassName}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Budget (IDR)</label>
        <input
          name="budget_idr"
          type="number"
          min={0}
          step={1}
          defaultValue={values?.budget_idr ?? ""}
          className={inputClassName}
          placeholder="Contoh: 25000000"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Jumlah Peserta</label>
        <input
          name="party_size"
          type="number"
          min={1}
          step={1}
          defaultValue={values?.party_size ?? ""}
          className={inputClassName}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Tanggal Keberangkatan</label>
        <input
          name="travel_date_preference"
          type="date"
          defaultValue={toDateInputValue(values?.travel_date_preference)}
          className={inputClassName}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Catatan</label>
        <textarea
          name="notes"
          rows={4}
          defaultValue={values?.notes ?? ""}
          className={inputClassName}
          placeholder="Contoh: Tanya harga untuk 4 pax, rencana berangkat Oktober."
        />
      </div>

      {footer ?? (
        <div className="flex gap-3">
          <button type="submit" className={cn(buttonVariants())}>
            {isCreate ? "Simpan Lead" : "Simpan Perubahan"}
          </button>

          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Batal
            </button>
          ) : (
            cancelHref && (
              <Link
                href={cancelHref}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Batal
              </Link>
            )
          )}
        </div>
      )}
    </form>
  );
}
