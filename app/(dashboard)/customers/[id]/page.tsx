import { Suspense } from "react";
import { notFound } from "next/navigation";

import { CustomerWorkspaceAccessDenied } from "@/components/customers/customer-workspace-access-denied";
import { CustomerWorkspaceView } from "@/components/customers/customer-workspace-view";
import { DesklabsCustomerWorkspaceSkeleton } from "@/components/ui/desklabs-loading";
import { requireProfile } from "@/lib/auth/session";
import { loadCustomerWorkspace } from "@/lib/customers/load-customer-workspace";
import { canViewLead } from "@/lib/leads/permissions";
import { createClient } from "@/utils/supabase/server";

export default async function CustomerWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { profile } = await requireProfile();

  if (!canViewLead(profile)) {
    return <CustomerWorkspaceAccessDenied />;
  }

  const supabase = await createClient();

  const data = await loadCustomerWorkspace(supabase, profile.organization_id, id);

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-4">
      {query.error ? (
        <div className="mx-auto max-w-6xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {decodeURIComponent(query.error)}
        </div>
      ) : null}

      {query.success ? (
        <div className="mx-auto max-w-6xl rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {decodeURIComponent(query.success)}
        </div>
      ) : null}

      <Suspense fallback={<DesklabsCustomerWorkspaceSkeleton />}>
        <CustomerWorkspaceView data={data} />
      </Suspense>
    </div>
  );
}
