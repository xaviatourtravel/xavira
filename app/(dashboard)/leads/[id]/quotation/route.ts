import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/utils/supabase/server";

function formatCurrency(value: number | null) {
  if (value == null) return "-";

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "long",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { profile } = await requireProfile();
  const supabase = await createClient();

  const { data: lead } = await supabase
    .from("leads")
    .select("id, full_name, package_interest")
    .eq("id", id)
    .eq("organization_id", profile.organization_id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!lead) {
    return NextResponse.json({ error: "Lead tidak ditemukan" }, { status: 404 });
  }

  const { data: pkg } = lead.package_interest
    ? await supabase
        .from("packages")
        .select("name, destination, departure_date, duration_days, price_idr, quota")
        .eq("organization_id", profile.organization_id)
        .eq("name", lead.package_interest)
        .maybeSingle()
    : { data: null };

  if (!pkg) {
    return NextResponse.json({ error: "Paket tidak ditemukan" }, { status: 404 });
  }

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let y = 780;

  function drawText(text: string, size = 12, bold = false) {
    page.drawText(text, {
      x: 50,
      y,
      size,
      font: bold ? boldFont : font,
      color: rgb(0, 0, 0),
    });

    y -= size + 10;
  }

  drawText("Desklabs", 22, true);
  drawText("Penawaran Perjalanan", 16, true);

  y -= 15;

  drawText(`Nama Customer: ${lead.full_name}`);
  drawText(`Paket: ${pkg.name}`);
  drawText(`Destinasi: ${pkg.destination ?? "-"}`);
  drawText(`Durasi: ${pkg.duration_days ? `${pkg.duration_days} Hari` : "-"}`);
  drawText(`Tanggal Berangkat: ${formatDate(pkg.departure_date)}`);
  drawText(`Harga: ${formatCurrency(pkg.price_idr)}`);
  drawText(`Kuota: ${pkg.quota ?? "-"} Pax`);

  y -= 20;

  drawText("Terima kasih atas ketertarikannya.", 12);
  drawText("Tim Desklabs siap membantu proses reservasi dan informasi lebih lanjut.", 12);

  const pdfBytes = await pdfDoc.save();
const pdfBuffer = Buffer.from(pdfBytes);

return new NextResponse(pdfBuffer, {
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="penawaran-${lead.full_name}.pdf"`,
  },
});
}