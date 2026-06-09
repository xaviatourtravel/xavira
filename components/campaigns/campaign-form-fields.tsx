import { CampaignSourceSelect } from "@/components/campaigns/campaign-source-select";
import { CAMPAIGN_STATUS_OPTIONS } from "@/lib/campaigns/constants";

type CampaignFormFieldsProps = {
  defaultValues?: {
    name?: string;
    source?: string;
    status?: string;
    startDate?: string | null;
    endDate?: string | null;
    budget?: number | null;
    notes?: string | null;
  };
};

const inputClassName = "mt-1 w-full rounded-md border px-3 py-2 text-sm";

export function CampaignFormFields({ defaultValues }: CampaignFormFieldsProps) {
  return (
    <>
      <div>
        <label className="text-sm font-medium">Nama Campaign *</label>
        <input
          name="name"
          required
          defaultValue={defaultValues?.name ?? ""}
          className={inputClassName}
          placeholder="Contoh: Promo Ramadhan Meta Ads"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Source</label>
        <CampaignSourceSelect
          defaultValue={defaultValues?.source ?? "other"}
          className={inputClassName}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Status</label>
        <select
          name="status"
          defaultValue={defaultValues?.status ?? "active"}
          className={inputClassName}
        >
          {CAMPAIGN_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Tanggal Mulai</label>
          <input
            name="start_date"
            type="date"
            defaultValue={defaultValues?.startDate ?? ""}
            className={inputClassName}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Tanggal Selesai</label>
          <input
            name="end_date"
            type="date"
            defaultValue={defaultValues?.endDate ?? ""}
            className={inputClassName}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Budget</label>
        <input
          name="budget"
          type="number"
          min="0"
          step="1"
          defaultValue={
            defaultValues?.budget != null ? String(defaultValues.budget) : "0"
          }
          className={inputClassName}
          placeholder="0"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Catatan</label>
        <textarea
          name="notes"
          rows={4}
          defaultValue={defaultValues?.notes ?? ""}
          className={inputClassName}
          placeholder="Contoh: Target CPL di bawah Rp50.000 untuk paket Umroh reguler."
        />
      </div>
    </>
  );
}
