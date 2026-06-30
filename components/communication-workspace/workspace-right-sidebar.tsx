"use client";

import { useEffect, useState } from "react";
import { Brain, ChevronRight, IdCard, PanelRightOpen, Workflow } from "lucide-react";

import { CustomerPassportFromConversation } from "@/components/customer-passport/customer-passport-from-conversation";
import { ConversationIntelligenceTab } from "@/components/communication-workspace/conversation-intelligence-tab";
import { WorkspaceOperationsPanel } from "@/components/communication-workspace/workspace-operations-panel";
import {
  IntelligencePanel,
  IntelligencePanelBody,
  IntelligencePanelHeader,
} from "@/components/communication-workspace/primitives";
import type { OmnichannelConversationDetail } from "@/lib/omnichannel-inbox/queries";
import { cn } from "@/lib/utils";

type OrgProfile = {
  id: string;
  full_name: string;
};

type WorkspaceRightSidebarProps = {
  conversation: OmnichannelConversationDetail | null;
  organizationId: string;
  orgProfiles: OrgProfile[];
  canReassign: boolean;
  canUpdateStatus: boolean;
  canAddNote: boolean;
  canConvert: boolean;
  canCreateFollowUp: boolean;
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

type SidebarTab = "workflow" | "passport" | "intelligence";

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
  const [activeTab, setActiveTab] = useState<SidebarTab>("workflow");

  useEffect(() => {
    setActiveTab("workflow");
  }, [conversation?.id]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === ".") {
        event.preventDefault();
        onToggleCollapsed();
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "1") {
        event.preventDefault();
        setActiveTab("workflow");
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "2") {
        event.preventDefault();
        setActiveTab("passport");
      }
      if ((event.metaKey || event.ctrlKey) && event.key === "3") {
        event.preventDefault();
        setActiveTab("intelligence");
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
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold tracking-tight">Detail</p>
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
        <div className="flex flex-1 items-center justify-center px-6 text-center text-xs text-muted-foreground">
          Pilih percakapan untuk mengelola alur kerja dan intelijen.
        </div>
      </IntelligencePanel>
    );
  }

  return (
    <IntelligencePanel>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex gap-1 rounded-lg bg-muted/40 p-0.5">
          <button
            type="button"
            onClick={() => setActiveTab("workflow")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              activeTab === "workflow"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            title="Alur Kerja (Ctrl+1)"
          >
            <Workflow className="h-3.5 w-3.5" />
            Alur Kerja
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("passport")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              activeTab === "passport"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            title="Paspor (Ctrl+2)"
          >
            <IdCard className="h-3.5 w-3.5" />
            Paspor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("intelligence")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              activeTab === "intelligence"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            title="Intelijen (Ctrl+3)"
          >
            <Brain className="h-3.5 w-3.5" />
            Intelijen
          </button>
        </div>
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

      {activeTab === "workflow" ? (
        <>
          <IntelligencePanelHeader
            title="Alur kerja penjualan"
            subtitle="Tugaskan · status · catatan · label"
          />
          <IntelligencePanelBody>
            <WorkspaceOperationsPanel
              conversation={conversation}
              orgProfiles={orgProfiles}
              canReassign={canReassign}
              canUpdateStatus={canUpdateStatus}
              canAddNote={canAddNote}
              canConvert={canConvert}
              canCreateFollowUp={canCreateFollowUp}
            />
          </IntelligencePanelBody>
        </>
      ) : activeTab === "passport" ? (
        <>
          <IntelligencePanelHeader
            title="Paspor Pelanggan"
            subtitle="Identitas hidup · dipakai di semua workspace"
          />
          <IntelligencePanelBody className="px-3 py-3">
            <CustomerPassportFromConversation
              conversation={conversation}
              variant="compact"
              showOpenLink
            />
          </IntelligencePanelBody>
        </>
      ) : (
        <>
          <IntelligencePanelHeader
            title="Intelijen"
            subtitle="Ringkasan & insight otomatis dari percakapan"
          />
          <IntelligencePanelBody>
            <ConversationIntelligenceTab conversation={conversation} />
          </IntelligencePanelBody>
        </>
      )}
    </IntelligencePanel>
  );
}
