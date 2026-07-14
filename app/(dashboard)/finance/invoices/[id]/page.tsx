import Link from "next/link";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth/session";
import { assertRoutePermission } from "@/lib/auth/route-access";
import { DEFAULT_LOCALE } from "@/lib/i18n/config";
import { createTranslator } from "@/lib/i18n/dictionary";
import {
  duplicateInvoiceFormAction,
  issueInvoiceFormAction,
  markInvoiceSentFormAction,
  voidInvoiceFormAction,
} from "@/modules/finance/actions/invoice-actions";
import {
  InvoiceLifecycleBadge,
  InvoicePaymentBadge,
} from "@/modules/finance/components/invoice-status-badges";
import {
  canEditInvoices,
  canIssueInvoices,
  canVoidInvoices,
  canCreateInvoices,
} from "@/modules/finance/lib/invoice-access";
import { formatMinorAsIdr } from "@/modules/finance/lib/invoice-money";
import { getOrganizationInvoice } from "@/modules/finance/services/invoice-service";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; issued?: string }>;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export default async function InvoiceDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { profile } = await requireProfile();
  assertRoutePermission(profile, "invoices.view");
  const t = createTranslator(DEFAULT_LOCALE);
  const { id } = await params;
  const query = await searchParams;

  let invoice;
  try {
    invoice = await getOrganizationInvoice(profile, id);
  } catch {
    notFound();
  }

  const isDraft = invoice.lifecycleStatus === "draft";
  const isIssuedLike =
    invoice.lifecycleStatus === "issued" || invoice.lifecycleStatus === "sent";
  const customerSnapshot = invoice.customerSnapshot as {
    name?: string;
    phone?: string | null;
    email?: string | null;
    company?: string | null;
    address?: string | null;
    tax_id?: string | null;
    source?: string;
  };
  const recipientName =
    invoice.recipientDisplayName ??
    customerSnapshot.name ??
    invoice.customerName ??
    invoice.manualRecipientName ??
    t("financeUi.recipientUnset");
  const bookingSnapshot = invoice.bookingSnapshot as {
    bookingCode?: string | null;
    packageName?: string | null;
    departureDate?: string | null;
    participantCount?: number | null;
    leadTraveller?: string | null;
  } | null;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-6 md:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link href="/finance/invoices" className="hover:underline">
              {t("financeUi.backToList")}
            </Link>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {invoice.invoiceNumber ?? t("financeUi.draftEditorTitle")}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <InvoiceLifecycleBadge status={invoice.lifecycleStatus} />
            <InvoicePaymentBadge
              status={invoice.effectivePaymentStatus ?? invoice.paymentStatus}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {isDraft && canEditInvoices(profile) ? (
            <Link
              href={`/finance/invoices/${invoice.id}/edit`}
              className="inline-flex h-10 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
            >
              {t("financeUi.editDraft")}
            </Link>
          ) : null}
          {isDraft && canIssueInvoices(profile) ? (
            <form action={issueInvoiceFormAction}>
              <input type="hidden" name="invoice_id" value={invoice.id} />
              <Button type="submit">{t("financeUi.issueInvoice")}</Button>
            </form>
          ) : null}
        </div>
      </div>

      {query.error ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {query.error}
        </p>
      ) : null}
      {query.issued ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {t("financeUi.invoiceNumber")}: {invoice.invoiceNumber}
        </p>
      ) : null}

      {!isDraft ? (
        <p className="rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          {t("financeUi.lockedNotice")}
        </p>
      ) : null}

      <section className="grid gap-4 rounded-2xl border bg-card p-4 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground">
            {t("financeUi.customer")}
          </h2>
          <p className="mt-1 font-medium">{recipientName}</p>
          <p className="text-sm text-muted-foreground">
            {customerSnapshot.phone ?? invoice.manualRecipientPhone ?? "—"}
            {(customerSnapshot.email ?? invoice.manualRecipientEmail)
              ? ` · ${customerSnapshot.email ?? invoice.manualRecipientEmail}`
              : ""}
          </p>
          {customerSnapshot.company || invoice.manualRecipientCompany ? (
            <p className="text-sm text-muted-foreground">
              {customerSnapshot.company ?? invoice.manualRecipientCompany}
            </p>
          ) : null}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground">
            {t("financeUi.booking")}
          </h2>
          <p className="mt-1 font-medium">
            {bookingSnapshot?.bookingCode ?? invoice.bookingCode ?? "—"}
          </p>
          <p className="text-sm text-muted-foreground">
            {bookingSnapshot?.packageName ?? "—"}
            {bookingSnapshot?.departureDate
              ? ` · ${formatDate(bookingSnapshot.departureDate)}`
              : ""}
          </p>
          {bookingSnapshot?.leadTraveller || bookingSnapshot?.participantCount ? (
            <p className="text-sm text-muted-foreground">
              {bookingSnapshot.leadTraveller ?? ""}
              {bookingSnapshot.participantCount
                ? ` · ${bookingSnapshot.participantCount} pax`
                : ""}
            </p>
          ) : null}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground">
            {t("financeUi.issueDate")}
          </h2>
          <p className="mt-1">{formatDate(invoice.issueDate)}</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground">
            {t("financeUi.dueDate")}
          </h2>
          <p className="mt-1">{formatDate(invoice.dueDate)}</p>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">{t("financeUi.description")}</th>
              <th className="px-4 py-3">{t("financeUi.quantity")}</th>
              <th className="px-4 py-3">{t("financeUi.unitPrice")}</th>
              <th className="px-4 py-3">{t("financeUi.lineTotal")}</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items ?? []).map((item) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{item.description}</p>
                  {item.detail ? (
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  {item.quantity} {item.unit}
                </td>
                <td className="px-4 py-3">
                  {formatMinorAsIdr(item.unitPriceMinor)}
                </td>
                <td className="px-4 py-3">
                  {formatMinorAsIdr(item.lineTotalMinor)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="grid gap-2 rounded-2xl border bg-card p-4 text-sm sm:grid-cols-2">
        <div className="flex justify-between gap-4">
          <span>{t("financeUi.subtotal")}</span>
          <span>{formatMinorAsIdr(invoice.subtotalMinor)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>{t("financeUi.invoiceDiscount")}</span>
          <span>{formatMinorAsIdr(invoice.discountMinor)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>{t("financeUi.taxAmount")}</span>
          <span>{formatMinorAsIdr(invoice.taxMinor)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>{t("financeUi.additionalFees")}</span>
          <span>{formatMinorAsIdr(invoice.additionalFeesMinor)}</span>
        </div>
        <div className="flex justify-between gap-4 font-semibold sm:col-span-2">
          <span>{t("financeUi.total")}</span>
          <span>{formatMinorAsIdr(invoice.totalMinor)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>{t("financeUi.paid")}</span>
          <span>{formatMinorAsIdr(invoice.amountPaidMinor)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span>{t("financeUi.balance")}</span>
          <span>{formatMinorAsIdr(invoice.balanceDueMinor)}</span>
        </div>
      </section>

      {(invoice.notes || invoice.paymentInstructions || invoice.terms) && (
        <section className="space-y-3 rounded-2xl border bg-card p-4 text-sm">
          {invoice.notes ? (
            <div>
              <h3 className="font-medium">{t("financeUi.notes")}</h3>
              <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                {invoice.notes}
              </p>
            </div>
          ) : null}
          {invoice.paymentInstructions ? (
            <div>
              <h3 className="font-medium">
                {t("financeUi.paymentInstructions")}
              </h3>
              <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                {invoice.paymentInstructions}
              </p>
            </div>
          ) : null}
          {invoice.terms ? (
            <div>
              <h3 className="font-medium">{t("financeUi.terms")}</h3>
              <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                {invoice.terms}
              </p>
            </div>
          ) : null}
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        {canCreateInvoices(profile) ? (
          <form action={duplicateInvoiceFormAction}>
            <input type="hidden" name="invoice_id" value={invoice.id} />
            <Button type="submit" variant="outline">
              {t("financeUi.duplicateAsDraft")}
            </Button>
          </form>
        ) : null}
        {invoice.lifecycleStatus === "issued" && canIssueInvoices(profile) ? (
          <form action={markInvoiceSentFormAction}>
            <input type="hidden" name="invoice_id" value={invoice.id} />
            <Button type="submit" variant="outline">
              {t("financeUi.markSent")}
            </Button>
          </form>
        ) : null}
      </div>

      {isIssuedLike && canVoidInvoices(profile) ? (
        <form
          action={voidInvoiceFormAction}
          className="space-y-3 rounded-2xl border border-rose-200 bg-rose-50/40 p-4"
        >
          <input type="hidden" name="invoice_id" value={invoice.id} />
          <h2 className="text-sm font-semibold text-rose-900">
            {t("financeUi.voidInvoice")}
          </h2>
          <label className="block text-sm">
            <span className="mb-1 block">{t("financeUi.voidReason")}</span>
            <textarea
              name="reason"
              required
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </label>
          <Button type="submit" variant="destructive">
            {t("financeUi.voidConfirm")}
          </Button>
        </form>
      ) : null}

      {invoice.lifecycleStatus === "void" && invoice.voidReason ? (
        <p className="text-sm text-rose-800">
          {t("financeUi.voidReason")}: {invoice.voidReason}
        </p>
      ) : null}
    </div>
  );
}
