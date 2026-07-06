"use client";

import { useEffect, useState, useTransition } from "react";

import { DsCard } from "@/components/design-system/card";
import {
  updateBrainActionPermissionAction,
} from "@/modules/business-brain/actions/action-permission-actions";
import {
  formatActionTypeLabel,
  getPermissionedActionDescription,
  type BrainActionPermissionRecord,
} from "@/modules/business-brain/types/action-permissions";
import { BusinessBrainSectionHeader } from "@/modules/business-brain/components/business-brain-workspace";
import {
  translateBusinessBrainSectionDescription,
  translateBusinessBrainSectionTitle,
} from "@/lib/i18n/business-brain-labels";
import { useTranslation } from "@/lib/i18n/use-translation";
import { cn } from "@/lib/utils";

type AiPermissionsPageClientProps = {
  initialPermissions: BrainActionPermissionRecord[];
  canEdit: boolean;
};

function PermissionToggle({
  label,
  description,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
          checked ? "bg-primary" : "bg-border",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    </label>
  );
}

function ConfidenceSlider({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2 rounded-xl border border-border px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">Minimum confidence</p>
          <p className="text-xs text-muted-foreground">
            Actions below this confidence are blocked automatically.
          </p>
        </div>
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {value.toFixed(2)}
        </span>
      </div>
      <input
        type="range"
        min={0.5}
        max={1}
        step={0.01}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-50"
      />
      <div className="flex justify-between text-[11px] text-muted-foreground">
        <span>0.50</span>
        <span>1.00</span>
      </div>
    </div>
  );
}

function ActionPermissionCard({
  permission,
  canEdit,
  onUpdated,
}: {
  permission: BrainActionPermissionRecord;
  canEdit: boolean;
  onUpdated: (permission: BrainActionPermissionRecord) => void;
}) {
  const [local, setLocal] = useState(permission);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setLocal(permission);
  }, [permission]);

  const persist = (next: BrainActionPermissionRecord) => {
    setLocal(next);
    setError(null);

    startTransition(async () => {
      const result = await updateBrainActionPermissionAction({
        actionType: next.actionType,
        enabled: next.enabled,
        requireManualApproval: next.requireManualApproval,
        minimumConfidence: next.minimumConfidence,
      });

      if (!result.ok) {
        setError(result.error);
        setLocal(permission);
        return;
      }

      onUpdated(result.permission);
    });
  };

  const disabled = !canEdit || isPending;

  return (
    <DsCard className="flex flex-col gap-4 p-5">
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">
          {formatActionTypeLabel(local.actionType)}
        </h3>
        <p className="text-sm text-muted-foreground">
          {getPermissionedActionDescription(local.actionType)}
        </p>
      </div>

      <div className="space-y-3">
        <PermissionToggle
          label="Enabled"
          description="Allow the AI to recommend and execute this action."
          checked={local.enabled}
          disabled={disabled}
          onChange={(enabled) => persist({ ...local, enabled })}
        />

        <PermissionToggle
          label="Require manual approval"
          description="Keep matching actions pending until a teammate approves."
          checked={local.requireManualApproval}
          disabled={disabled || !local.enabled}
          onChange={(requireManualApproval) =>
            persist({ ...local, requireManualApproval })
          }
        />

        <ConfidenceSlider
          value={local.minimumConfidence}
          disabled={disabled || !local.enabled}
          onChange={(minimumConfidence) =>
            persist({ ...local, minimumConfidence })
          }
        />
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {isPending ? (
        <p className="text-xs text-muted-foreground">Saving…</p>
      ) : null}
    </DsCard>
  );
}

export function AiPermissionsPageClient({
  initialPermissions,
  canEdit,
}: AiPermissionsPageClientProps) {
  const { tStrict } = useTranslation();
  const [permissions, setPermissions] = useState(initialPermissions);

  useEffect(() => {
    setPermissions(initialPermissions);
  }, [initialPermissions]);

  return (
    <div className="space-y-6">
      <BusinessBrainSectionHeader
        title={translateBusinessBrainSectionTitle(tStrict, "ai-permissions")}
        iconSlug="ai-permissions"
        description={translateBusinessBrainSectionDescription(tStrict, "ai-permissions")}
      />
        {!canEdit ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
          {tStrict("businessBrain.permissionsReadOnly")}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {permissions.map((permission) => (
          <ActionPermissionCard
            key={permission.actionType}
            permission={permission}
            canEdit={canEdit}
            onUpdated={(updated) => {
              setPermissions((current) =>
                current.map((item) =>
                  item.actionType === updated.actionType ? updated : item,
                ),
              );
            }}
          />
        ))}
      </div>
    </div>
  );
}
