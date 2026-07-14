"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "@/lib/i18n/use-translation";
import { calculateInvoiceTotals } from "@/modules/finance/lib/invoice-calculator";
import { formatMinorAsIdr } from "@/modules/finance/lib/invoice-money";
import { loadBookingPrefillAction } from "@/modules/finance/actions/invoice-actions";
import { InvoiceMoneyInput } from "@/modules/finance/components/invoice-money-input";

export type InvoiceEditorCustomerOption = {
  id: string;
  fullName: string;
  phone: string | null;
};

export type InvoiceEditorBookingOption = {
  id: string;
  leadId: string | null;
  bookingCode: string | null;
  customerName: string;
  packageName: string | null;
  departureDate: string | null;
  totalPax: number | null;
  totalAmount: number | null;
};

export type InvoiceEditorItem = {
  description: string;
  detail: string;
  quantity: number;
  unit: string;
  unitPriceMinor: number;
  discountMinor: number;
};

type InvoiceDraftEditorProps = {
  mode: "create" | "edit";
  action: (formData: FormData) => void | Promise<void>;
  customers: InvoiceEditorCustomerOption[];
  bookings: InvoiceEditorBookingOption[];
  initial?: {
    invoiceId?: string;
    recipientSource?: "linked_customer" | "manual";
    customerId?: string;
    bookingId?: string | null;
    manualRecipientName?: string | null;
    manualRecipientCompany?: string | null;
    manualRecipientPhone?: string | null;
    manualRecipientEmail?: string | null;
    manualRecipientAddress?: string | null;
    manualRecipientTaxId?: string | null;
    issueDate?: string | null;
    dueDate?: string | null;
    notes?: string | null;
    paymentInstructions?: string | null;
    terms?: string | null;
    discountMinor?: number;
    taxRateBps?: number;
    taxMinor?: number;
    additionalFeesMinor?: number;
    amountPaidMinor?: number;
    items?: InvoiceEditorItem[];
  };
  errorMessage?: string | null;
};

const emptyItem = (): InvoiceEditorItem => ({
  description: "",
  detail: "",
  quantity: 1,
  unit: "unit",
  unitPriceMinor: 0,
  discountMinor: 0,
});

export function InvoiceDraftEditor({
  mode,
  action,
  customers,
  bookings,
  initial,
  errorMessage,
}: InvoiceDraftEditorProps) {
  const { tStrict } = useTranslation();
  const [pending, startTransition] = useTransition();
  const [recipientSource, setRecipientSource] = useState<
    "linked_customer" | "manual"
  >(initial?.recipientSource ?? "linked_customer");
  const [customerId, setCustomerId] = useState(initial?.customerId ?? "");
  const [bookingId, setBookingId] = useState(initial?.bookingId ?? "");
  const [manualName, setManualName] = useState(
    initial?.manualRecipientName ?? "",
  );
  const [manualCompany, setManualCompany] = useState(
    initial?.manualRecipientCompany ?? "",
  );
  const [manualPhone, setManualPhone] = useState(
    initial?.manualRecipientPhone ?? "",
  );
  const [manualEmail, setManualEmail] = useState(
    initial?.manualRecipientEmail ?? "",
  );
  const [manualAddress, setManualAddress] = useState(
    initial?.manualRecipientAddress ?? "",
  );
  const [manualTaxId, setManualTaxId] = useState(
    initial?.manualRecipientTaxId ?? "",
  );
  const [showManualDetails, setShowManualDetails] = useState(
    Boolean(
      initial?.manualRecipientCompany ||
        initial?.manualRecipientAddress ||
        initial?.manualRecipientTaxId,
    ),
  );
  const [items, setItems] = useState<InvoiceEditorItem[]>(
    initial?.items?.length ? initial.items : [emptyItem()],
  );
  const [discountMinor, setDiscountMinor] = useState(initial?.discountMinor ?? 0);
  const [taxRateBps, setTaxRateBps] = useState(initial?.taxRateBps ?? 0);
  const [taxMinor, setTaxMinor] = useState<number | null>(
    initial?.taxMinor ?? null,
  );
  const [additionalFeesMinor, setAdditionalFeesMinor] = useState(
    initial?.additionalFeesMinor ?? 0,
  );
  const [amountPaidMinor, setAmountPaidMinor] = useState(
    initial?.amountPaidMinor ?? 0,
  );
  const [showOptional, setShowOptional] = useState(
    Boolean(
      initial?.notes ||
        initial?.paymentInstructions ||
        initial?.terms ||
        (initial?.discountMinor ?? 0) > 0 ||
        (initial?.taxRateBps ?? 0) > 0 ||
        (initial?.additionalFeesMinor ?? 0) > 0 ||
        (initial?.amountPaidMinor ?? 0) > 0,
    ),
  );
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [prefillError, setPrefillError] = useState<string | null>(null);

  const filteredBookings = useMemo(() => {
    if (!customerId) return bookings;
    return bookings.filter((booking) => !booking.leadId || booking.leadId === customerId);
  }, [bookings, customerId]);

  const preview = useMemo(() => {
    try {
      return calculateInvoiceTotals({
        items: items.map((item) => ({
          quantity: item.quantity,
          unitPriceMinor: item.unitPriceMinor,
          discountMinor: item.discountMinor,
        })),
        discountMinor,
        taxRateBps,
        taxMinor: taxMinor ?? undefined,
        additionalFeesMinor,
        amountPaidMinor,
      });
    } catch {
      return null;
    }
  }, [
    items,
    discountMinor,
    taxRateBps,
    taxMinor,
    additionalFeesMinor,
    amountPaidMinor,
  ]);

  function updateItem(index: number, patch: Partial<InvoiceEditorItem>) {
    setItems((current) =>
      current.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }

  async function handleBookingChange(nextBookingId: string) {
    setBookingId(nextBookingId);
    setPrefillError(null);
    setMissingFields([]);
    if (!nextBookingId) return;

    try {
      const prefill = await loadBookingPrefillAction(nextBookingId);
      setRecipientSource("linked_customer");
      if (prefill.customerId) {
        setCustomerId(prefill.customerId);
      }
      setMissingFields(prefill.missingFields);
      if (prefill.suggestedItem) {
        setItems([
          {
            description: prefill.suggestedItem.description,
            detail: prefill.suggestedItem.detail ?? "",
            quantity: prefill.suggestedItem.quantity,
            unit: prefill.suggestedItem.unit,
            unitPriceMinor: prefill.suggestedItem.unitPriceMinor,
            discountMinor: prefill.suggestedItem.discountMinor,
          },
        ]);
      }
    } catch (error) {
      setPrefillError(
        error instanceof Error ? error.message : "Failed to prefill booking",
      );
    }
  }

  function switchRecipientSource(next: "linked_customer" | "manual") {
    setRecipientSource(next);
    setPrefillError(null);
    setMissingFields([]);
    if (next === "manual") {
      setCustomerId("");
      setBookingId("");
    }
  }

  return (
    <form
      action={(formData) => {
        startTransition(() => {
          void action(formData);
        });
      }}
      className="space-y-8"
    >
      {initial?.invoiceId ? (
        <input type="hidden" name="invoice_id" value={initial.invoiceId} />
      ) : null}
      <input type="hidden" name="recipient_source" value={recipientSource} />
      <input
        type="hidden"
        name="items_json"
        value={JSON.stringify(
          items.map((item, index) => ({
            description: item.description,
            detail: item.detail || null,
            quantity: item.quantity,
            unit: item.unit,
            unitPriceMinor: item.unitPriceMinor,
            discountMinor: item.discountMinor,
            sortOrder: index,
          })),
        )}
      />
      <input type="hidden" name="discount_minor" value={discountMinor} />
      <input type="hidden" name="tax_rate_bps" value={taxRateBps} />
      <input
        type="hidden"
        name="tax_minor"
        value={taxMinor == null ? "" : String(taxMinor)}
      />
      <input
        type="hidden"
        name="additional_fees_minor"
        value={additionalFeesMinor}
      />
      <input type="hidden" name="amount_paid_minor" value={amountPaidMinor} />
      <input type="hidden" name="currency" value="IDR" />

      {(errorMessage || prefillError) && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {errorMessage || prefillError}
        </p>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
          {tStrict("financeUi.sectionCustomerBooking")}
        </h2>

        <div
          className="inline-flex rounded-lg border bg-muted/40 p-1"
          role="tablist"
          aria-label={tStrict("financeUi.sectionCustomerBooking")}
        >
          <button
            type="button"
            role="tab"
            aria-selected={recipientSource === "linked_customer"}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              recipientSource === "linked_customer"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => switchRecipientSource("linked_customer")}
          >
            {tStrict("financeUi.recipientModeLinked")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={recipientSource === "manual"}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              recipientSource === "manual"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => switchRecipientSource("manual")}
          >
            {tStrict("financeUi.recipientModeManual")}
          </button>
        </div>

        {recipientSource === "linked_customer" ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customer_id">
                {tStrict("financeUi.selectCustomer")}
              </Label>
              <select
                id="customer_id"
                name="customer_id"
                required
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">{tStrict("financeUi.selectCustomer")}</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.fullName}
                    {customer.phone ? ` · ${customer.phone}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="booking_id">
                {tStrict("financeUi.selectBooking")}
              </Label>
              <select
                id="booking_id"
                name="booking_id"
                value={bookingId ?? ""}
                onChange={(event) => {
                  void handleBookingChange(event.target.value);
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">{tStrict("financeUi.noBooking")}</option>
                {filteredBookings.map((booking) => (
                  <option key={booking.id} value={booking.id}>
                    {booking.bookingCode ?? booking.id.slice(0, 8)}
                    {booking.packageName ? ` · ${booking.packageName}` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {tStrict("financeUi.manualRecipientHint")}
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="manual_recipient_name">
                  {tStrict("financeUi.manualRecipientName")} *
                </Label>
                <Input
                  id="manual_recipient_name"
                  name="manual_recipient_name"
                  required
                  value={manualName}
                  onChange={(event) => setManualName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual_recipient_phone">
                  {tStrict("financeUi.manualRecipientPhone")}
                </Label>
                <Input
                  id="manual_recipient_phone"
                  name="manual_recipient_phone"
                  value={manualPhone}
                  onChange={(event) => setManualPhone(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual_recipient_email">
                  {tStrict("financeUi.manualRecipientEmail")}
                </Label>
                <Input
                  id="manual_recipient_email"
                  name="manual_recipient_email"
                  type="email"
                  value={manualEmail}
                  onChange={(event) => setManualEmail(event.target.value)}
                />
              </div>
            </div>
            <button
              type="button"
              className="text-sm font-medium text-primary hover:underline"
              onClick={() => setShowManualDetails((value) => !value)}
            >
              {showManualDetails
                ? tStrict("financeUi.hideOptional")
                : tStrict("financeUi.recipientOptionalDetails")}
            </button>
            {showManualDetails ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="manual_recipient_company">
                    {tStrict("financeUi.manualRecipientCompany")}
                  </Label>
                  <Input
                    id="manual_recipient_company"
                    name="manual_recipient_company"
                    value={manualCompany}
                    onChange={(event) => setManualCompany(event.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="manual_recipient_address">
                    {tStrict("financeUi.manualRecipientAddress")}
                  </Label>
                  <textarea
                    id="manual_recipient_address"
                    name="manual_recipient_address"
                    rows={3}
                    value={manualAddress}
                    onChange={(event) => setManualAddress(event.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual_recipient_tax_id">
                    {tStrict("financeUi.manualRecipientTaxId")}
                  </Label>
                  <Input
                    id="manual_recipient_tax_id"
                    name="manual_recipient_tax_id"
                    value={manualTaxId}
                    onChange={(event) => setManualTaxId(event.target.value)}
                  />
                </div>
              </div>
            ) : (
              <>
                <input
                  type="hidden"
                  name="manual_recipient_company"
                  value={manualCompany}
                />
                <input
                  type="hidden"
                  name="manual_recipient_address"
                  value={manualAddress}
                />
                <input
                  type="hidden"
                  name="manual_recipient_tax_id"
                  value={manualTaxId}
                />
              </>
            )}
          </div>
        )}

        {missingFields.length > 0 ? (
          <p className="text-sm text-amber-700">
            {tStrict("financeUi.missingPrefill")}: {missingFields.join(", ")}
          </p>
        ) : null}
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
          {tStrict("financeUi.sectionDates")}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="issue_date">{tStrict("financeUi.issueDate")}</Label>
            <Input
              id="issue_date"
              name="issue_date"
              type="date"
              defaultValue={initial?.issueDate ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="due_date">{tStrict("financeUi.dueDate")}</Label>
            <Input
              id="due_date"
              name="due_date"
              type="date"
              defaultValue={initial?.dueDate ?? ""}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
            {tStrict("financeUi.sectionItems")}
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setItems((current) => [...current, emptyItem()])}
          >
            {tStrict("financeUi.addItem")}
          </Button>
        </div>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="grid gap-3 rounded-xl border bg-card/50 p-4 md:grid-cols-6"
            >
              <div className="space-y-2 md:col-span-2">
                <Label>{tStrict("financeUi.description")}</Label>
                <Input
                  required
                  value={item.description}
                  onChange={(event) =>
                    updateItem(index, { description: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>{tStrict("financeUi.detail")}</Label>
                <Input
                  value={item.detail}
                  onChange={(event) =>
                    updateItem(index, { detail: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{tStrict("financeUi.quantity")}</Label>
                <Input
                  type="number"
                  min={0.0001}
                  step="any"
                  required
                  value={item.quantity}
                  onChange={(event) =>
                    updateItem(index, {
                      quantity: Number(event.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>{tStrict("financeUi.unit")}</Label>
                <Input
                  value={item.unit}
                  onChange={(event) =>
                    updateItem(index, { unit: event.target.value })
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>{tStrict("financeUi.unitPrice")}</Label>
                <InvoiceMoneyInput
                  required
                  aria-label={tStrict("financeUi.unitPrice")}
                  value={item.unitPriceMinor}
                  onValueChange={(next) =>
                    updateItem(index, {
                      unitPriceMinor: next ?? 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>{tStrict("financeUi.lineDiscount")}</Label>
                <InvoiceMoneyInput
                  aria-label={tStrict("financeUi.lineDiscount")}
                  value={item.discountMinor}
                  onValueChange={(next) =>
                    updateItem(index, {
                      discountMinor: next ?? 0,
                    })
                  }
                />
              </div>
              <div className="flex items-end md:col-span-2">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={items.length <= 1}
                  onClick={() =>
                    setItems((current) => current.filter((_, i) => i !== index))
                  }
                >
                  {tStrict("financeUi.removeItem")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div>
        <button
          type="button"
          className="text-sm font-medium text-primary hover:underline"
          onClick={() => setShowOptional((value) => !value)}
        >
          {showOptional
            ? tStrict("financeUi.hideOptional")
            : tStrict("financeUi.showOptional")}
        </button>
      </div>

      {showOptional ? (
        <>
          <section className="space-y-4">
            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
              {tStrict("financeUi.sectionAdjustments")}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>{tStrict("financeUi.invoiceDiscount")}</Label>
                <InvoiceMoneyInput
                  aria-label={tStrict("financeUi.invoiceDiscount")}
                  value={discountMinor}
                  onValueChange={(next) => setDiscountMinor(next ?? 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>{tStrict("financeUi.taxRate")}</Label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={taxRateBps}
                  onChange={(event) => setTaxRateBps(Number(event.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>{tStrict("financeUi.taxAmount")}</Label>
                <InvoiceMoneyInput
                  aria-label={tStrict("financeUi.taxAmount")}
                  value={taxMinor}
                  onValueChange={setTaxMinor}
                />
              </div>
              <div className="space-y-2">
                <Label>{tStrict("financeUi.additionalFees")}</Label>
                <InvoiceMoneyInput
                  aria-label={tStrict("financeUi.additionalFees")}
                  value={additionalFeesMinor}
                  onValueChange={(next) => setAdditionalFeesMinor(next ?? 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>{tStrict("financeUi.amountPaid")}</Label>
                <InvoiceMoneyInput
                  aria-label={tStrict("financeUi.amountPaid")}
                  value={amountPaidMinor}
                  onValueChange={(next) => setAmountPaidMinor(next ?? 0)}
                />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
              {tStrict("financeUi.sectionNotes")}
            </h2>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="notes">{tStrict("financeUi.notes")}</Label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  defaultValue={initial?.notes ?? ""}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_instructions">
                  {tStrict("financeUi.paymentInstructions")}
                </Label>
                <textarea
                  id="payment_instructions"
                  name="payment_instructions"
                  rows={3}
                  defaultValue={initial?.paymentInstructions ?? ""}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="terms">{tStrict("financeUi.terms")}</Label>
                <textarea
                  id="terms"
                  name="terms"
                  rows={3}
                  defaultValue={initial?.terms ?? ""}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
            </div>
          </section>
        </>
      ) : (
        <>
          <input type="hidden" name="notes" value={initial?.notes ?? ""} />
          <input
            type="hidden"
            name="payment_instructions"
            value={initial?.paymentInstructions ?? ""}
          />
          <input type="hidden" name="terms" value={initial?.terms ?? ""} />
        </>
      )}

      <section className="space-y-3 rounded-2xl border bg-card/60 p-4">
        <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
          {tStrict("financeUi.sectionTotals")}
        </h2>
        <p className="text-xs text-muted-foreground">
          {tStrict("financeUi.previewOnly")}
        </p>
        {preview ? (
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-4">
              <dt>{tStrict("financeUi.subtotal")}</dt>
              <dd className="font-medium">
                {formatMinorAsIdr(preview.subtotalMinor)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>{tStrict("financeUi.invoiceDiscount")}</dt>
              <dd className="font-medium">
                {formatMinorAsIdr(preview.discountMinor)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>{tStrict("financeUi.taxAmount")}</dt>
              <dd className="font-medium">
                {formatMinorAsIdr(preview.taxMinor)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>{tStrict("financeUi.additionalFees")}</dt>
              <dd className="font-medium">
                {formatMinorAsIdr(preview.additionalFeesMinor)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 sm:col-span-2">
              <dt className="font-semibold">{tStrict("financeUi.total")}</dt>
              <dd className="font-semibold">
                {formatMinorAsIdr(preview.totalMinor)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>{tStrict("financeUi.paid")}</dt>
              <dd>{formatMinorAsIdr(preview.amountPaidMinor)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>{tStrict("financeUi.balance")}</dt>
              <dd>{formatMinorAsIdr(preview.balanceDueMinor)}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">—</p>
        )}
      </section>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {tStrict("financeUi.saveDraft")}
        </Button>
        {mode === "edit" && initial?.invoiceId ? (
          <Link
            href={`/finance/invoices/${initial.invoiceId}`}
            className="inline-flex h-10 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
          >
            {tStrict("financeUi.viewInvoice")}
          </Link>
        ) : null}
      </div>
    </form>
  );
}
