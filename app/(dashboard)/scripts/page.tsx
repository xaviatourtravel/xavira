import { ScriptsLibrary } from "@/components/scripts/scripts-library";
import { DEFAULT_SALES_SCRIPTS } from "@/lib/scripts/default-scripts";

export default function ScriptsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Scripts Library</h1>
        <p className="text-sm text-muted-foreground">
          Kumpulan script WhatsApp siap pakai untuk opening, follow up,
          proposal, negosiasi, closing, dan lost lead.
        </p>
      </div>

      <ScriptsLibrary scripts={DEFAULT_SALES_SCRIPTS} />
    </div>
  );
}
