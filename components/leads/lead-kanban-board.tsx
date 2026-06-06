import { LeadKanbanCard, type KanbanLeadItem } from "@/components/leads/lead-kanban-card";
import { cn } from "@/lib/utils";

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
    <div className="flex gap-3 overflow-x-auto pb-2">
      {KANBAN_STATUSES.map((status) => {
        const columnLeads = leads.filter((lead) => lead.status === status.value);
        const isEmpty = columnLeads.length === 0;

        return (
          <div
            key={status.value}
            className={cn(
              "w-[176px] shrink-0 rounded-xl border bg-muted/20 p-2.5",
              isEmpty ? "self-start" : "",
            )}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-xs font-semibold leading-tight">
                {status.label}
              </h2>
              <span className="rounded-full bg-background px-1.5 py-0.5 text-[11px]">
                {columnLeads.length}
              </span>
            </div>

            <div className={cn("space-y-2", isEmpty && "min-h-0")}>
              {columnLeads.map((lead) => (
                <LeadKanbanCard key={lead.id} lead={lead} />
              ))}

              {isEmpty && (
                <p className="py-1 text-[11px] text-muted-foreground">Kosong</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
