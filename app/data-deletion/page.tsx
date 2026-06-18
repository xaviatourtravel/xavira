import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";

export const metadata: Metadata = {
  title: "User Data Deletion Instructions | Desklabs",
  description:
    "How to request deletion of your personal data from Desklabs.",
};

export default function DataDeletionPage() {
  return (
    <LegalPageShell title="User Data Deletion Instructions">
      <p>
        Desklabs respects your right to control your personal data. You may
        request deletion of personal information we hold about you.
      </p>

      <h2 className="text-lg font-semibold">How to Request Deletion</h2>
      <p>Send your deletion request to:</p>
      <p>
        <a
          href="mailto:xaviatourtravel@gmail.com"
          className="font-medium underline underline-offset-4"
        >
          xaviatourtravel@gmail.com
        </a>
      </p>

      <h2 className="text-lg font-semibold">What to Include</h2>
      <ul className="list-disc space-y-2 pl-6">
        <li>Your full name</li>
        <li>Your email address associated with Desklabs or connected services</li>
        <li>Details of the data you want deleted</li>
      </ul>

      <h2 className="text-lg font-semibold">Processing Timeline</h2>
      <p>
        Requests will be processed within 30 days. A confirmation email will be
        sent after the deletion is completed.
      </p>
    </LegalPageShell>
  );
}
