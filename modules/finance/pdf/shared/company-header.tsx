import React from "react";
import { Image, Text, View } from "@react-pdf/renderer";

import {
  companyInitialsForPdf,
  INVOICE_PDF_LABELS,
} from "@/modules/finance/pdf/invoice-pdf-labels";
import type { InvoicePdfData } from "@/modules/finance/pdf/invoice-pdf-types";
import { PDF_LINE, PDF_SPACE, PDF_TYPE } from "@/modules/finance/pdf/invoice-pdf-theme";

export function LogoMark({
  data,
  size = 40,
  inverted = false,
}: {
  data: InvoicePdfData;
  size?: number;
  inverted?: boolean;
}) {
  const { company, theme } = data;
  const logo = company.logo;
  const initials =
    logo?.kind === "initials"
      ? logo.initials
      : companyInitialsForPdf(company.legalName);

  if (logo?.kind === "image") {
    return (
      <Image
        src={logo.dataUrl}
        style={{
          maxWidth: size * 2.4,
          maxHeight: size,
          width: "auto",
          height: "auto",
          objectFit: "contain",
        }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 4,
        backgroundColor: inverted ? theme.primaryForeground : theme.primaryColor,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          color: inverted ? theme.primaryColor : theme.primaryForeground,
          fontFamily: "Helvetica-Bold",
          fontSize: size >= 40 ? 12 : 10,
        }}
      >
        {initials}
      </Text>
    </View>
  );
}

export function CompanyHeader({
  data,
  variant = "default",
}: {
  data: InvoicePdfData;
  variant?: "default" | "compact" | "sidebar";
}) {
  const { company, theme } = data;
  const muted = theme.muted ?? theme.secondaryColor;
  const text = theme.text ?? "#0F172A";

  if (variant === "sidebar") {
    const onTint = theme.text ?? "#0F172A";
    const soft = theme.muted ?? "#64748B";
    const accounts = company.paymentAccounts.filter((account) =>
      Boolean(account.bankName || account.accountNumber),
    );
    return (
      <View>
        <LogoMark data={data} size={36} />
        <Text
          style={{
            color: onTint,
            fontFamily: "Helvetica-Bold",
            fontSize: 9.5,
            marginTop: PDF_SPACE.md,
            marginBottom: PDF_SPACE.xs,
            lineHeight: PDF_LINE.tight,
          }}
        >
          {company.legalName}
        </Text>
        {company.tagline ? (
          <Text
            style={{
              color: soft,
              fontSize: 7,
              marginBottom: PDF_SPACE.md,
              lineHeight: PDF_LINE.tight,
            }}
          >
            {company.tagline}
          </Text>
        ) : (
          <View style={{ height: PDF_SPACE.sm }} />
        )}
        {company.address ? (
          <SidebarLine color={soft}>{company.address}</SidebarLine>
        ) : null}
        {company.phone ? (
          <SidebarLine color={soft}>{company.phone}</SidebarLine>
        ) : null}
        {company.email ? (
          <SidebarLine color={soft}>{company.email}</SidebarLine>
        ) : null}
        {company.website ? (
          <SidebarLine color={soft}>{company.website}</SidebarLine>
        ) : null}
        {company.taxId ? (
          <SidebarLine color={soft}>{`NPWP: ${company.taxId}`}</SidebarLine>
        ) : null}

        {accounts.length > 0 ? (
          <View style={{ marginTop: PDF_SPACE.lg }}>
            <Text
              style={{
                color: soft,
                fontSize: 7,
                fontFamily: "Helvetica-Bold",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: PDF_SPACE.sm,
              }}
            >
              {INVOICE_PDF_LABELS.paymentInformation}
            </Text>
            {accounts.slice(0, 2).map((account, index) => (
              <View key={account.id ?? index} style={{ marginBottom: PDF_SPACE.sm }}>
                <Text
                  style={{
                    color: onTint,
                    fontFamily: "Helvetica-Bold",
                    fontSize: 7.5,
                    lineHeight: PDF_LINE.tight,
                  }}
                >
                  {account.bankName}
                </Text>
                <Text
                  style={{
                    color: onTint,
                    fontSize: 7.5,
                    marginTop: 1,
                    fontFamily: "Helvetica-Bold",
                  }}
                >
                  {account.accountNumber}
                </Text>
                {account.accountHolder || account.accountName ? (
                  <Text style={{ color: soft, fontSize: 7, marginTop: 1 }}>
                    {account.accountHolder || account.accountName}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: PDF_SPACE.md }}>
      <View style={{ flexDirection: "row", gap: PDF_SPACE.md, flex: 1, alignItems: "center" }}>
        <LogoMark data={data} size={variant === "compact" ? 36 : 44} />
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: "Helvetica-Bold",
              fontSize: variant === "compact" ? 11 : PDF_TYPE.companyName,
              color: text,
            }}
          >
            {company.legalName}
          </Text>
          {variant !== "compact" && company.address ? (
            <Text style={{ color: muted, marginTop: 2, fontSize: PDF_TYPE.caption, lineHeight: 1.35 }}>
              {company.address}
            </Text>
          ) : null}
          <Text style={{ color: muted, marginTop: 2, fontSize: PDF_TYPE.caption }}>
            {[company.phone, company.email, company.website]
              .filter(Boolean)
              .join(" · ")}
          </Text>
          {company.taxId ? (
            <Text style={{ color: muted, marginTop: 2, fontSize: PDF_TYPE.caption }}>
              NPWP: {company.taxId}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function SidebarLine({
  children,
  color,
}: {
  children: string;
  color: string;
}) {
  return (
    <Text
      style={{
        color,
        fontSize: PDF_TYPE.caption,
        marginBottom: 3,
        lineHeight: 1.35,
      }}
    >
      {children}
    </Text>
  );
}
