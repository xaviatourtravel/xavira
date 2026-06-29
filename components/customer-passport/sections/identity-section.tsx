"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { CustomerAvatar } from "@/components/omnichannel-inbox/customer-avatar";
import {
  PassportField,
  PassportHeader,
  PassportPerforation,
  PassportSection,
} from "@/components/customer-passport/primitives";
import { buttonVariants } from "@/components/ui/button";
import type { CustomerPassport } from "@/lib/customer-passport/types";
import { customerWorkspaceHref } from "@/lib/customers/routes";
import { cn } from "@/lib/utils";

function EntityStamp({ entityType }: { entityType: CustomerPassport["entityType"] }) {
  return (
    <div className="rotate-[-8deg] rounded-md border-2 border-amber-600/30 px-2 py-1 text-center">
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-amber-700">
        {entityType === "lead" ? "Member" : "Prospect"}
      </p>
    </div>
  );
}

export function PassportIdentitySection({
  passport,
  showOpenLink = false,
}: {
  passport: CustomerPassport;
  showOpenLink?: boolean;
}) {
  const { identity } = passport;

  return (
    <>
      <PassportHeader
        subtitle="Living customer identity · shared across workspaces"
        stamp={<EntityStamp entityType={passport.entityType} />}
      />
      <PassportSection number={1} title="Identity">
        <div className="flex items-start gap-3.5">
          <CustomerAvatar
            displayName={identity.name}
            avatarUrl={identity.avatarUrl}
            size="lg"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold tracking-tight">
              {identity.name}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <PassportField label="Phone" value={identity.phone} />
              <PassportField label="Email" value={identity.email} />
              <PassportField label="City" value={identity.city} />
              <PassportField label="Country" value={identity.country} />
              <PassportField label="Language" value={identity.language} />
            </div>
          </div>
        </div>
        {showOpenLink && passport.leadId ? (
          <Link
            href={customerWorkspaceHref(passport.leadId)}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "mt-4 h-8 w-full gap-1.5 text-xs",
            )}
          >
            Open full passport
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        ) : null}
      </PassportSection>
      <PassportPerforation />
    </>
  );
}
