"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { updateTeamMemberRole } from "@/app/(dashboard)/settings/team/actions";
import { DesklabsAvatar } from "@/components/ui/desklabs-avatar";
import {
  formatTeamRoleLabel,
  TEAM_MEMBER_STATUS_LABEL,
  TEAM_ROLES,
} from "@/lib/team/constants";
import type { TeamMemberRow } from "@/lib/team/queries";
import type { UserRole } from "@/types/app-types";

type TeamMembersTableProps = {
  members: TeamMemberRow[];
  currentUserId: string;
};

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export function TeamMembersTable({
  members,
  currentUserId,
}: TeamMembersTableProps) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRoleChange(member: TeamMemberRow, newRole: UserRole) {
    if (newRole === member.role) {
      return;
    }

    const memberName = member.full_name?.trim() || "Anggota tim";
    const confirmed = window.confirm(
      `Ubah role ${memberName} dari ${formatTeamRoleLabel(member.role)} menjadi ${formatTeamRoleLabel(newRole)}?`,
    );

    if (!confirmed) {
      return;
    }

    setError(null);
    setFeedback(null);

    const formData = new FormData();
    formData.set("member_id", member.id);
    formData.set("role", newRole);

    startTransition(async () => {
      const result = await updateTeamMemberRole(formData);

      if (!result.success) {
        setError(result.message);
        return;
      }

      setFeedback(result.message);
      router.refresh();
    });
  }

  if (members.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center">
        <h2 className="text-lg font-medium">Belum ada anggota tim</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Anggota organisasi akan muncul di sini setelah terdaftar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {feedback && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
          {feedback}
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[880px] text-sm">
          <thead className="border-b bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Full Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Last active</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id} className="border-b last:border-b-0">
                <td className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-3">
                    <DesklabsAvatar
                      name={member.full_name?.trim() || "Pengguna"}
                      size="sm"
                    />
                    <span>
                      {member.full_name?.trim() || "Pengguna"}
                      {member.id === currentUserId && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          (You)
                        </span>
                      )}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">{member.email || "-"}</td>
                <td className="px-4 py-3">
                  <select
                    value={member.role}
                    disabled={isPending}
                    onChange={(event) =>
                      handleRoleChange(
                        member,
                        event.target.value as UserRole,
                      )
                    }
                    className="rounded-md border px-2 py-1 text-sm disabled:opacity-50"
                  >
                    {TEAM_ROLES.map((role) => (
                      <option key={role} value={role}>
                        {formatTeamRoleLabel(role)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">{TEAM_MEMBER_STATUS_LABEL}</td>
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                  {formatCreatedAt(member.lastActiveAt ?? member.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
