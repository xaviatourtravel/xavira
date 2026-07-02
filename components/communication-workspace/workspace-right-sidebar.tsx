"use client";

import { useEffect } from "react";
import { ChevronRight, PanelRightOpen } from "lucide-react";

import { CustomerPassportInspector } from "@/components/customer-passport/inspector/customer-passport-inspector";
import { IntelligencePanel } from "@/components/communication-workspace/primitives";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";

type WorkspaceRightSidebarProps = {
  conversation: OmnichannelConversationDetail | null;
  organizationId: string;
  orgProfiles: Array<{ id: string; full_name: string }>;
  canReassign: boolean;
  canUpdateStatus: boolean;
  canAddNote: boolean;
  canConvert: boolean;
  canCreateFollowUp: boolean;
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

export function WorkspaceRightSidebar({
  conversation,
  orgProfiles,
  canReassign,
  canUpdateStatus,
  canAddNote,
  canConvert,
  canCreateFollowUp,
  collapsed,
  onToggleCollapsed,
}: WorkspaceRightSidebarProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === ".") {
        event.preventDefault();
        onToggleCollapsed();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onToggleCollapsed]);

  if (collapsed) {
    return (
      <div className="flex h-full flex-col items-center border-l border-soft bg-sidebar py-3">
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="flex flex-col items-center gap-2 rounded-lg px-1.5 py-3 text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          title="Buka panel detail (Ctrl+.)"
          aria-label="Buka panel detail"
        >
          <PanelRightOpen className="h-4 w-4" />
          <span className="rotate-180 text-[11px] font-medium tracking-wide [writing-mode:vertical-rl]">
            Detail
          </span>
        </button>
      </div>
    );
  }

  if (!conversation) {
    return (
      <IntelligencePanel>
        <div className="flex items-center justify-between px-5 py-4">
          <p className="text-sm font-semibold tracking-tight text-foreground">
            Detail
          </p>
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60"
            title="Ciutkan panel (Ctrl+.)"
            aria-label="Ciutkan panel"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
          Pilih percakapan untuk melihat konteks pelanggan.
        </div>
      </IntelligencePanel>
    );
  }

  return (
    <IntelligencePanel>
      <div className="flex shrink-0 items-center justify-between px-5 py-4">
        <p className="text-sm font-semibold tracking-tight text-foreground">
          Customer Passport
        </p>
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/60"
          title="Ciutkan panel (Ctrl+.)"
          aria-label="Ciutkan panel"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <CustomerPassportInspector
          conversation={conversation}
          orgProfiles={orgProfiles}
          canReassign={canReassign}
          canUpdateStatus={canUpdateStatus}
          canAddNote={canAddNote}
          canConvert={canConvert}
          canCreateFollowUp={canCreateFollowUp}
        />
      </div>
    </IntelligencePanel>
  );
}
