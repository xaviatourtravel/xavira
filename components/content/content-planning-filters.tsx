import {
  CONTENT_PLATFORM_OPTIONS,
  CONTENT_STATUS_OPTIONS,
} from "@/lib/content/constants";
import type { ContentPlanningFilters } from "@/lib/content/planning-view";

type ContentPlanningFiltersProps = {
  filters: ContentPlanningFilters;
  orgProfiles: ReadonlyArray<{ id: string; full_name: string | null }>;
};

export function ContentPlanningFiltersBar({
  filters,
  orgProfiles,
}: ContentPlanningFiltersProps) {
  return (
    <form
      method="get"
      action="/content"
      className="flex flex-wrap items-end gap-3 rounded-xl border p-4"
    >
      <input type="hidden" name="view" value={filters.view} />

      <div>
        <label htmlFor="content_filter_platform" className="text-xs font-medium">
          Platform
        </label>
        <select
          id="content_filter_platform"
          name="platform"
          defaultValue={filters.platform}
          className="mt-1 block rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Semua Platform</option>
          {CONTENT_PLATFORM_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="content_filter_status" className="text-xs font-medium">
          Status
        </label>
        <select
          id="content_filter_status"
          name="status"
          defaultValue={filters.status}
          className="mt-1 block rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Semua Status</option>
          {CONTENT_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="content_filter_assigned" className="text-xs font-medium">
          Assigned To
        </label>
        <select
          id="content_filter_assigned"
          name="assigned"
          defaultValue={filters.assigned}
          className="mt-1 block rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Semua Assignee</option>
          <option value="unassigned">Belum ditugaskan</option>
          <option value="me">Assigned to Me</option>
          {orgProfiles.map((profile) => (
            <option key={profile.id} value={profile.id}>
              {profile.full_name || "Pengguna"}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="rounded-md border bg-background px-4 py-2 text-sm font-medium"
      >
        Filter
      </button>

      <a href={`/content?view=${filters.view}`} className="text-sm text-muted-foreground hover:text-foreground">
        Reset
      </a>
    </form>
  );
}
