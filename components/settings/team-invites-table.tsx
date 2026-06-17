import {
  buildInviteRegisterUrl,
  formatInviteRoleLabel,
  formatInviteStatusLabel,
  type OrganizationInviteRow,
} from "@/lib/team/invites";

type TeamInvitesTableProps = {
  invites: OrganizationInviteRow[];
};

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function TeamInvitesTable({ invites }: TeamInvitesTableProps) {
  if (invites.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Team Invites</h2>
        <p className="text-sm text-muted-foreground">
          Riwayat undangan yang dibuat untuk organisasi ini.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[880px] text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Expires At</th>
              <th className="px-4 py-3 font-medium">Invite Link</th>
            </tr>
          </thead>
          <tbody>
            {invites.map((invite) => (
              <tr key={invite.id} className="border-b last:border-b-0">
                <td className="px-4 py-3">{invite.email}</td>
                <td className="px-4 py-3">
                  {formatInviteRoleLabel(invite.role)}
                </td>
                <td className="px-4 py-3">
                  {formatInviteStatusLabel(invite.status)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {formatCreatedAt(invite.expires_at)}
                </td>
                <td className="px-4 py-3">
                  {invite.status === "pending" ? (
                    <code className="rounded bg-muted px-2 py-1 text-xs">
                      {buildInviteRegisterUrl(invite.token)}
                    </code>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
