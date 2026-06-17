import { CampaignSelect } from "@/components/campaigns/campaign-select";
import {
  CONTENT_PLATFORM_OPTIONS,
  CONTENT_STATUS_OPTIONS,
  CONTENT_TYPE_OPTIONS,
} from "@/lib/content/constants";

type ContentFormFieldsProps = {
  campaigns: ReadonlyArray<{ id: string; name: string }>;
  profiles: ReadonlyArray<{ id: string; full_name: string | null }>;
  showManualContentFields?: boolean;
  defaultValues?: {
    title?: string;
    platform?: string;
    contentType?: string;
    status?: string;
    campaignId?: string | null;
    assignedTo?: string | null;
    publishDate?: string | null;
    caption?: string | null;
    cta?: string | null;
    driveUrl?: string | null;
    notes?: string | null;
  };
};

const inputClassName = "mt-1 w-full rounded-md border px-3 py-2 text-sm";

export function ContentFormFields({
  campaigns,
  profiles,
  showManualContentFields = true,
  defaultValues,
}: ContentFormFieldsProps) {
  return (
    <>
      <div>
        <label className="text-sm font-medium">Title *</label>
        <input
          name="title"
          required
          defaultValue={defaultValues?.title ?? ""}
          className={inputClassName}
          placeholder="Contoh: Reels Promo Umroh Ramadhan"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium">Platform *</label>
          <select
            name="platform"
            required
            defaultValue={defaultValues?.platform ?? "instagram"}
            className={inputClassName}
          >
            {CONTENT_PLATFORM_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Content Type *</label>
          <select
            name="content_type"
            required
            defaultValue={defaultValues?.contentType ?? "social_post"}
            className={inputClassName}
          >
            {CONTENT_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Status</label>
        <select
          name="status"
          defaultValue={defaultValues?.status ?? "idea"}
          className={inputClassName}
        >
          {CONTENT_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium">Campaign</label>
        <CampaignSelect
          campaigns={campaigns}
          defaultValue={defaultValues?.campaignId ?? ""}
          className={inputClassName}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Assigned To</label>
        <select
          name="assigned_to"
          defaultValue={defaultValues?.assignedTo ?? ""}
          className={inputClassName}
        >
          <option value="">Belum ditugaskan</option>
          {profiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.full_name || "Pengguna"}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium">Publish Date</label>
        <input
          name="publish_date"
          type="date"
          defaultValue={defaultValues?.publishDate ?? ""}
          className={inputClassName}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Drive URL</label>
        <input
          name="drive_url"
          type="url"
          defaultValue={defaultValues?.driveUrl ?? ""}
          className={inputClassName}
          placeholder="https://drive.google.com/..."
        />
      </div>

      {showManualContentFields && (
        <>
          <div>
            <label className="text-sm font-medium">Caption</label>
            <textarea
              name="caption"
              rows={4}
              defaultValue={defaultValues?.caption ?? ""}
              className={inputClassName}
              placeholder="Draft caption untuk postingan."
            />
          </div>

          <div>
            <label className="text-sm font-medium">CTA</label>
            <input
              name="cta"
              defaultValue={defaultValues?.cta ?? ""}
              className={inputClassName}
              placeholder="Contoh: DM kami untuk info paket"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Notes</label>
            <textarea
              name="notes"
              rows={3}
              defaultValue={defaultValues?.notes ?? ""}
              className={inputClassName}
              placeholder="Catatan internal untuk tim media."
            />
          </div>
        </>
      )}
    </>
  );
}
