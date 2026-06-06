import { LeadKanbanCard, type KanbanLeadItem } from "@/components/leads/lead-kanban-card";

export const KANBAN_STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal_sent", label: "Proposal Sent" },
  { value: "negotiating", label: "Negotiating" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
] as const;

type LeadKanbanBoardProps = {
  leads: KanbanLeadItem[];
};

export function LeadKanbanBoard({ leads }: LeadKanbanBoardProps) {
  return (
    <div className="grid min-w-[1120px] grid-cols-7 gap-4 overflow-x-auto">
      {KANBAN_STATUSES.map((status) => {
        const columnLeads = leads.filter((lead) => lead.status === status.value);

        return (
          <div
            key={status.value}
            className="min-h-[420px] rounded-xl border bg-muted/20 p-3"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">{status.label}</h2>
              <span className="rounded-full bg-background px-2 py-1 text-xs">
                {columnLeads.length}
              </span>
            </div>

            <div className="space-y-3">
              {columnLeads.map((lead) => (
                <LeadKanbanCard key={lead.id} lead={lead} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
