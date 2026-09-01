"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n/use-translation";
import {
  cancelProformaFormAction,
  convertProformaFormAction,
  deleteDraftProformaFormAction,
} from "@/modules/finance/actions/proforma-actions";

export function ProformaLifecycleActions({
  proformaId,
  canConvert,
  canCancel,
  canDelete,
}: {
  proformaId: string;
  canConvert: boolean;
  canCancel: boolean;
  canDelete: boolean;
}) {
  const { tStrict } = useTranslation();
  const [panel, setPanel] = useState<"idle" | "convert" | "cancel" | "delete">(
    "idle",
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {canConvert ? (
          <Button type="button" onClick={() => setPanel("convert")}>
            {tStrict("financeUi.convertProforma")}
          </Button>
        ) : null}
        {canCancel ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setPanel("cancel")}
          >
            {tStrict("financeUi.cancelProforma")}
          </Button>
        ) : null}
        {canDelete ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setPanel("delete")}
          >
            {tStrict("financeUi.deleteProforma")}
          </Button>
        ) : null}
      </div>

      {panel === "convert" ? (
        <div className="space-y-3 rounded-2xl border bg-card p-4">
          <p className="font-medium">{tStrict("financeUi.convertProformaTitle")}</p>
          <p className="text-sm text-muted-foreground">
            {tStrict("financeUi.convertProformaDescription")}
          </p>
          <form action={convertProformaFormAction} className="flex flex-wrap gap-2">
            <input type="hidden" name="proforma_id" value={proformaId} />
            <Button type="submit">{tStrict("financeUi.convertProforma")}</Button>
            <Button type="button" variant="ghost" onClick={() => setPanel("idle")}>
              {tStrict("financeUi.dismiss")}
            </Button>
          </form>
        </div>
      ) : null}

      {panel === "cancel" ? (
        <div className="space-y-3 rounded-2xl border bg-card p-4">
          <p className="font-medium">{tStrict("financeUi.cancelProformaTitle")}</p>
          <p className="text-sm text-muted-foreground">
            {tStrict("financeUi.cancelProformaDescription")}
          </p>
          <form action={cancelProformaFormAction} className="space-y-3">
            <input type="hidden" name="proforma_id" value={proformaId} />
            <div className="space-y-2">
              <Label htmlFor="proforma-cancel-reason">
                {tStrict("financeUi.cancelReason")}
              </Label>
              <textarea
                id="proforma-cancel-reason"
                name="reason"
                required
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="destructive">
                {tStrict("financeUi.cancelProforma")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPanel("idle")}
              >
                {tStrict("financeUi.dismiss")}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {panel === "delete" ? (
        <form action={deleteDraftProformaFormAction} className="flex flex-wrap gap-2">
          <input type="hidden" name="proforma_id" value={proformaId} />
          <Button type="submit" variant="destructive">
            {tStrict("financeUi.deleteProforma")}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setPanel("idle")}>
            {tStrict("financeUi.dismiss")}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
