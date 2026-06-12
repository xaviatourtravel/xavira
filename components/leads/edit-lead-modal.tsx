"use client";

import { useEffect, useState, useTransition } from "react";

import { getLeadForEditForm, updateLead } from "@/app/(dashboard)/leads/[id]/actions";
import { LeadForm } from "@/components/leads/lead-form";
import type {
  LeadFormOptions,
  LeadFormValues,
} from "@/lib/leads/lead-form-types";
import type { Profile } from "@/types/app-types";

type EditLeadModalProps = {
  leadId: string | null;
  profile: Profile;
  options: LeadFormOptions;
  returnTo: string;
  onClose: () => void;
};

export function EditLeadModal({
  leadId,
  profile,
  options,
  returnTo,
  onClose,
}: EditLeadModalProps) {
  const [values, setValues] = useState<LeadFormValues | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!leadId) {
      setValues(null);
      setLoadError(null);
      return;
    }

    let cancelled = false;

    startTransition(async () => {
      const result = await getLeadForEditForm(leadId);

      if (cancelled) {
        return;
      }

      if ("error" in result) {
        setValues(null);
        setLoadError(result.error);
        return;
      }

      setLoadError(null);
      setValues(result.values);
    });

    return () => {
      cancelled = true;
    };
  }, [leadId]);

  if (!leadId) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Tutup modal"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-lead-modal-title"
        className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border bg-background p-6 shadow-lg"
      >
        <h2 id="edit-lead-modal-title" className="text-xl font-semibold">
          Edit Lead
        </h2>

        {loadError && (
          <div className="mt-4 rounded-md bg-red-50 p-4 text-sm text-red-600">
            {loadError}
          </div>
        )}

        {isPending && !values && !loadError && (
          <p className="mt-4 text-sm text-muted-foreground">Memuat data lead...</p>
        )}

        {values && !loadError && (
          <div className="mt-4">
            <LeadForm
              mode="edit"
              action={updateLead}
              profile={profile}
              options={options}
              values={values}
              leadId={leadId}
              returnTo={returnTo}
              onCancel={onClose}
            />
          </div>
        )}
      </div>
    </div>
  );
}
