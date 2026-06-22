"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ImageIcon } from "lucide-react";

import {
  saveAiSettings,
  saveGeneralSettings,
  saveInboxSettings,
  saveNotificationSettings,
} from "@/app/(dashboard)/settings/actions";
import { AuditLogsPanel } from "@/components/settings/audit-logs-panel";
import { IntegrationsGrid } from "@/components/settings/integrations-grid";
import { InviteMemberPanel } from "@/components/settings/invite-member-panel";
import { TeamInvitesTable } from "@/components/settings/team-invites-table";
import { TeamMembersTable } from "@/components/settings/team-members-table";
import { Button } from "@/components/ui/button";
import {
  PERMISSION_LEVEL_LABELS,
  PERMISSION_MATRIX,
  PERMISSION_MATRIX_FEATURES,
  PERMISSION_MATRIX_ROLES,
  type PermissionLevel,
  type SettingsSectionId,
} from "@/lib/settings/constants";
import type { SettingsWorkspaceData } from "@/lib/settings/queries";
import { formatTeamRoleLabel } from "@/lib/team/constants";
import { cn } from "@/lib/utils";

type SettingsSectionPanelProps = {
  sectionId: SettingsSectionId;
  data: SettingsWorkspaceData;
};

function SettingsCard({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border bg-card p-6 shadow-sm", className)}>
      <div className="mb-5">
        <h3 className="text-base font-semibold">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function inputClassName(disabled = false) {
  return cn(
    "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
    disabled && "cursor-not-allowed opacity-60",
  );
}

function SettingsFeedback({
  message,
  error,
}: {
  message: string | null;
  error: string | null;
}) {
  return (
    <>
      {message ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}
    </>
  );
}

function useSettingsFormAction(
  action: (formData: FormData) => Promise<{ success: boolean; message?: string }>,
) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await action(formData);

      if (!result.success) {
        setError(result.message ?? "Unable to save settings.");
        return;
      }

      setMessage(result.message ?? "Settings saved.");
      router.refresh();
    });
  }

  return { message, error, isPending, handleSubmit };
}

function formatLastActive(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

function PermissionBadge({ level }: { level: PermissionLevel }) {
  const styles: Record<PermissionLevel, string> = {
    allowed: "bg-emerald-100 text-emerald-800",
    denied: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
        styles[level],
      )}
    >
      {PERMISSION_LEVEL_LABELS[level]}
    </span>
  );
}

function GeneralSettingsPanel({ data }: { data: SettingsWorkspaceData }) {
  const { organization, workspaceSettings, canManage } = data;
  const { message, error, isPending, handleSubmit } =
    useSettingsFormAction(saveGeneralSettings);

  return (
    <form action={handleSubmit} className="space-y-6">
      <SettingsCard
        title="Company profile"
        description="Core business details used across Desklabs."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Company Name">
            <input
              name="companyName"
              defaultValue={organization.name}
              disabled={!canManage || isPending}
              className={inputClassName(!canManage)}
              required
            />
          </Field>

          <Field label="Business Email">
            <input
              name="businessEmail"
              type="email"
              defaultValue={workspaceSettings.businessEmail}
              disabled={!canManage || isPending}
              placeholder="hello@company.com"
              className={inputClassName(!canManage)}
            />
          </Field>

          <Field label="Business Phone">
            <input
              name="businessPhone"
              defaultValue={organization.phone ?? ""}
              disabled={!canManage || isPending}
              placeholder="+62 ..."
              className={inputClassName(!canManage)}
            />
          </Field>

          <Field label="Website">
            <input
              name="website"
              defaultValue={workspaceSettings.website}
              disabled={!canManage || isPending}
              placeholder="https://company.com"
              className={inputClassName(!canManage)}
            />
          </Field>

          <Field label="Timezone">
            <select
              name="timezone"
              defaultValue={organization.timezone}
              disabled={!canManage || isPending}
              className={inputClassName(!canManage)}
            >
              <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
              <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
              <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
              <option value="UTC">UTC</option>
            </select>
          </Field>

          <Field label="Currency">
            <select
              name="currency"
              defaultValue={workspaceSettings.currency}
              disabled={!canManage || isPending}
              className={inputClassName(!canManage)}
            >
              <option value="IDR">IDR — Indonesian Rupiah</option>
              <option value="USD">USD — US Dollar</option>
              <option value="SGD">SGD — Singapore Dollar</option>
            </select>
          </Field>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Brand assets"
        description="Logo upload will be available in a future release."
      >
        <div className="flex flex-col gap-4 rounded-xl border border-dashed bg-muted/20 p-6 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border bg-background text-muted-foreground">
            <ImageIcon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Company logo</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload support is coming soon. Your workspace currently uses the
              Desklabs default branding.
            </p>
          </div>
          <Button type="button" variant="outline" disabled>
            Upload logo
          </Button>
        </div>
      </SettingsCard>

      <SettingsFeedback message={message} error={error} />

      {canManage ? (
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      ) : null}
    </form>
  );
}

function TeamSettingsPanel({ data }: { data: SettingsWorkspaceData }) {
  const { teamMembers, invites, profile, canManageTeam } = data;

  return (
    <div className="space-y-6">
      {canManageTeam ? <InviteMemberPanel /> : null}

      <SettingsCard
        title="Team members"
        description="People with access to this Desklabs workspace."
      >
        {canManageTeam ? (
          <TeamMembersTable
            members={teamMembers}
            currentUserId={profile.id}
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b bg-muted/40 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Last active</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map((member) => (
                  <tr key={member.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-medium">
                      {member.full_name?.trim() || "User"}
                    </td>
                    <td className="px-4 py-3">{member.email || "—"}</td>
                    <td className="px-4 py-3">
                      {formatTeamRoleLabel(member.role)}
                    </td>
                    <td className="px-4 py-3">{member.status}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {formatLastActive(member.lastActiveAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SettingsCard>

      {canManageTeam && invites.length > 0 ? (
        <SettingsCard title="Pending invites" description="Outstanding team invitations.">
          <TeamInvitesTable invites={invites} />
        </SettingsCard>
      ) : null}
    </div>
  );
}

function RolesSettingsPanel() {
  return (
    <div className="space-y-6">
      <SettingsCard
        title="Role overview"
        description="Default role mapping enforced across Desklabs. Custom per-user overrides will come in a future release."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {PERMISSION_MATRIX_ROLES.map((role) => (
            <div key={role} className="rounded-xl border bg-muted/20 p-4">
              <p className="font-semibold">{role}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {role === "Sales"
                  ? "Includes legacy Agent users mapped to Sales permissions."
                  : role === "Admin"
                    ? "Full workspace access except owner-only billing actions."
                    : role === "Owner"
                      ? "Full access to all modules and settings."
                      : `${role} role with module-specific defaults.`}
              </p>
            </div>
          ))}
        </div>
      </SettingsCard>

      <SettingsCard
        title="Permission matrix"
        description="Read-only view of default capabilities by role."
      >
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[920px] text-sm">
            <thead className="border-b bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Capability</th>
                {PERMISSION_MATRIX_ROLES.map((role) => (
                  <th key={role} className="px-4 py-3 font-medium">
                    {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSION_MATRIX_FEATURES.map((feature) => (
                <tr key={feature.key} className="border-b last:border-b-0">
                  <td className="px-4 py-3 font-medium">{feature.label}</td>
                  {PERMISSION_MATRIX_ROLES.map((role) => (
                    <td key={`${feature.key}-${role}`} className="px-4 py-3">
                      <PermissionBadge level={PERMISSION_MATRIX[role][feature.key]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SettingsCard>
    </div>
  );
}

const INTEGRATION_DISPLAY_ORDER = [
  "instagram_business",
  "facebook_page",
  "whatsapp_cloud",
  "openai",
  "google_drive",
] as const;

function mapIntegrationStatusLabel(status: string) {
  switch (status) {
    case "connected":
      return "Connected";
    case "pending_setup":
      return "Pending Review";
    default:
      return "Disconnected";
  }
}

function IntegrationsSettingsPanel({ data }: { data: SettingsWorkspaceData }) {
  const orderedIntegrations = INTEGRATION_DISPLAY_ORDER.map((provider) =>
    data.integrations.find((integration) => integration.provider === provider),
  ).filter((integration): integration is NonNullable<typeof integration> =>
    Boolean(integration),
  );

  return (
    <div className="space-y-6">
      <SettingsCard
        title="Connected services"
        description="Manage Instagram, Facebook Messenger, WhatsApp, OpenAI, and Google Drive from one workspace."
      >
        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          {orderedIntegrations.map((integration) => {
            const statusLabel = mapIntegrationStatusLabel(integration.status);

            return (
              <div
                key={integration.provider}
                className="rounded-xl border bg-muted/20 px-4 py-3"
              >
                <p className="text-sm font-medium">{integration.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {integration.description}
                </p>
                <span
                  className={cn(
                    "mt-3 inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                    integration.status === "connected" &&
                      "bg-emerald-100 text-emerald-800",
                    integration.status === "pending_setup" &&
                      "bg-amber-100 text-amber-800",
                    integration.status === "not_connected" &&
                      "bg-slate-100 text-slate-700",
                  )}
                >
                  {statusLabel}
                </span>
              </div>
            );
          })}
        </div>

        <IntegrationsGrid
          integrations={orderedIntegrations}
          canManage={data.canManageIntegrations}
          settingsReturnPath="/settings?section=integrations"
        />
      </SettingsCard>

      {data.canManageIntegrations ? (
        <div className="flex flex-wrap gap-4 text-sm">
          <Link
            href="/settings/integrations/instagram/webhook"
            className="font-medium text-primary hover:underline"
          >
            Instagram webhook subscription
          </Link>
          {process.env.NODE_ENV === "development" ? (
            <Link
              href="/settings/integrations/instagram/debug"
              className="text-muted-foreground hover:underline"
            >
              Instagram Graph API debug
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ToggleRow({
  name,
  label,
  description,
  defaultChecked,
  disabled,
}: {
  name: string;
  label: string;
  description: string;
  defaultChecked?: boolean;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-xl border bg-muted/20 px-4 py-3">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="mt-1 block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        disabled={disabled}
        className="mt-1 h-4 w-4 rounded border-input"
      />
    </label>
  );
}

function AiSettingsPanel({ data }: { data: SettingsWorkspaceData }) {
  const { workspaceSettings, canManageAi } = data;
  const { message, error, isPending, handleSubmit } =
    useSettingsFormAction(saveAiSettings);

  return (
    <form action={handleSubmit} className="space-y-6">
      <SettingsCard
        title="AI assistant behavior"
        description="Control how Desklabs AI supports your team across inbox and sales workflows."
      >
        <div className="space-y-4">
          <ToggleRow
            name="autoReplyEnabled"
            label="AI Auto Reply"
            description="Allow AI to send replies automatically when auto reply mode is enabled."
            defaultChecked={workspaceSettings.ai.autoReplyEnabled}
            disabled={!canManageAi || isPending}
          />

          <Field label="Response Mode">
            <select
              name="responseMode"
              defaultValue={workspaceSettings.ai.responseMode}
              disabled={!canManageAi || isPending}
              className={inputClassName(!canManageAi)}
            >
              <option value="manual_assist">Manual Assist</option>
              <option value="suggested_reply">Suggested Reply</option>
              <option value="auto_reply">Auto Reply</option>
            </select>
          </Field>

          <Field label="Tone">
            <select
              name="tone"
              defaultValue={workspaceSettings.ai.tone}
              disabled={!canManageAi || isPending}
              className={inputClassName(!canManageAi)}
            >
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="luxury">Luxury</option>
            </select>
          </Field>
        </div>
      </SettingsCard>

      <SettingsCard
        title="Knowledge Base"
        description="Ground AI responses in your company knowledge hub."
      >
        <ToggleRow
          name="knowledgeBaseEnabled"
          label="Use Knowledge Hub context"
          description="When enabled, AI features can reference approved knowledge entries."
          defaultChecked={workspaceSettings.ai.knowledgeBaseEnabled}
          disabled={!canManageAi || isPending}
        />
        <div className="mt-4 rounded-xl border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
          Advanced knowledge routing and per-channel AI policies are coming soon.
          Manage content today in{" "}
          <Link href="/knowledge" className="font-medium text-foreground underline">
            Knowledge Hub
          </Link>
          .
        </div>
      </SettingsCard>

      <SettingsFeedback message={message} error={error} />

      {canManageAi ? (
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save AI settings"}
          </Button>
        </div>
      ) : null}
    </form>
  );
}

function InboxSettingsPanel({ data }: { data: SettingsWorkspaceData }) {
  const { workspaceSettings, teamMembers, canManage } = data;
  const { message, error, isPending, handleSubmit } =
    useSettingsFormAction(saveInboxSettings);

  return (
    <form action={handleSubmit} className="space-y-6">
      <SettingsCard
        title="Routing & coverage"
        description="Define how customer conversations are handled in Desklabs Inbox."
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Business hours start">
            <input
              type="time"
              name="businessHoursStart"
              defaultValue={workspaceSettings.inbox.businessHoursStart}
              disabled={!canManage || isPending}
              className={inputClassName(!canManage)}
            />
          </Field>

          <Field label="Business hours end">
            <input
              type="time"
              name="businessHoursEnd"
              defaultValue={workspaceSettings.inbox.businessHoursEnd}
              disabled={!canManage || isPending}
              className={inputClassName(!canManage)}
            />
          </Field>

          <Field label="Default assignee">
            <select
              name="defaultAssigneeId"
              defaultValue={workspaceSettings.inbox.defaultAssigneeId}
              disabled={!canManage || isPending}
              className={inputClassName(!canManage)}
            >
              <option value="">Unassigned</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name?.trim() || member.email || "Team member"}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="mt-5 space-y-3">
          <ToggleRow
            name="autoAssignmentEnabled"
            label="Auto Assignment"
            description="Automatically assign new conversations using your routing rules."
            defaultChecked={workspaceSettings.inbox.autoAssignmentEnabled}
            disabled={!canManage || isPending}
          />
          <ToggleRow
            name="roundRobinEnabled"
            label="Round Robin"
            description="Distribute new conversations evenly across available team members."
            defaultChecked={workspaceSettings.inbox.roundRobinEnabled}
            disabled={!canManage || isPending}
          />
        </div>
      </SettingsCard>

      <SettingsCard
        title="Outside hours auto reply"
        description="Message sent when customers reach out outside business hours."
      >
        <textarea
          name="outsideHoursAutoReply"
          rows={4}
          defaultValue={workspaceSettings.inbox.outsideHoursAutoReply}
          disabled={!canManage || isPending}
          className={cn(inputClassName(!canManage), "h-auto min-h-[120px] py-3")}
        />
      </SettingsCard>

      <SettingsFeedback message={message} error={error} />

      {canManage ? (
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save inbox settings"}
          </Button>
        </div>
      ) : null}
    </form>
  );
}

function NotificationsSettingsPanel({ data }: { data: SettingsWorkspaceData }) {
  const { workspaceSettings, canManage } = data;
  const { message, error, isPending, handleSubmit } = useSettingsFormAction(
    saveNotificationSettings,
  );

  return (
    <form action={handleSubmit} className="space-y-6">
      <SettingsCard
        title="Workspace alerts"
        description="Choose which events should surface prominently for your team."
      >
        <div className="space-y-3">
          <ToggleRow
            name="newLead"
            label="New Lead"
            description="Alert when a new lead enters the pipeline."
            defaultChecked={workspaceSettings.notifications.newLead}
            disabled={!canManage || isPending}
          />
          <ToggleRow
            name="newConversation"
            label="New Conversation"
            description="Alert when a new inbox conversation arrives."
            defaultChecked={workspaceSettings.notifications.newConversation}
            disabled={!canManage || isPending}
          />
          <ToggleRow
            name="newBooking"
            label="New Booking"
            description="Alert when a booking is created or confirmed."
            defaultChecked={workspaceSettings.notifications.newBooking}
            disabled={!canManage || isPending}
          />
          <ToggleRow
            name="overdueFollowUp"
            label="Overdue Follow Up"
            description="Alert when follow-ups slip past their due date."
            defaultChecked={workspaceSettings.notifications.overdueFollowUp}
            disabled={!canManage || isPending}
          />
        </div>
      </SettingsCard>

      <SettingsFeedback message={message} error={error} />

      {canManage ? (
        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save notification settings"}
          </Button>
        </div>
      ) : null}
    </form>
  );
}

export function SettingsSectionPanel({
  sectionId,
  data,
}: SettingsSectionPanelProps) {
  switch (sectionId) {
    case "general":
      return <GeneralSettingsPanel data={data} />;
    case "team":
      return <TeamSettingsPanel data={data} />;
    case "roles":
      return <RolesSettingsPanel />;
    case "integrations":
      return <IntegrationsSettingsPanel data={data} />;
    case "ai":
      return <AiSettingsPanel data={data} />;
    case "inbox":
      return <InboxSettingsPanel data={data} />;
    case "notifications":
      return <NotificationsSettingsPanel data={data} />;
    case "audit":
      if (!data.canViewAuditLogs) {
        return (
          <div className="rounded-2xl border bg-muted/20 px-4 py-6 text-sm text-muted-foreground">
            Only owners and admins can view audit logs.
          </div>
        );
      }

      return (
        <AuditLogsPanel
          logs={data.auditLogs}
          actors={data.auditActors}
          roles={data.auditRoles}
          activitySummary={data.auditActivitySummary}
          filters={data.auditFilters}
        />
      );
    default:
      return <GeneralSettingsPanel data={data} />;
  }
}
