import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { QuotationCopyButton } from "@/components/leads/quotation-copy-button";

type QuotationCardProps = {
  leadId: string;
  selectedPackage: unknown | null;
  quotationText: string;
  contactPhone: string;
};

export function QuotationCard({
  leadId,
  selectedPackage,
  quotationText,
  contactPhone,
}: QuotationCardProps) {
  return (
    <Card>
  <CardHeader>
    <CardTitle>Penawaran Paket</CardTitle>
    <CardDescription>
      Generate teks penawaran berdasarkan paket yang diminati lead.
    </CardDescription>
  </CardHeader>

  <CardContent className="space-y-4">
    {selectedPackage ? (
      <>
        <textarea
          readOnly
          value={quotationText}
          rows={14}
          className="w-full rounded-md border px-3 py-2 text-sm"
        />
        

        <div className="flex gap-2">
          <QuotationCopyButton text={quotationText} />

          {contactPhone !== "-" && (
            <a
              href={`https://wa.me/${contactPhone.replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-md bg-green-600 px-4 py-2 text-sm text-white"
            >
              Buka WhatsApp
            </a>
          )}

<a
  href={`/leads/${leadId}/quotation`}
  target="_blank"
  rel="noreferrer"
  className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
>
  Download PDF
</a>
        </div>
      </>
    ) : (
      <p className="text-sm text-muted-foreground">
        Paket belum ditemukan. Pastikan lead sudah memilih paket yang tersedia.
      </p>
    )}
  </CardContent>
</Card>
  );
}
