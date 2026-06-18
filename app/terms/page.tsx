import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";

export const metadata: Metadata = {
  title: "Terms of Service | Desklabs",
  description:
    "Desklabs terms of service — rules and conditions for using our CRM and business operations platform.",
};

export default function TermsOfServicePage() {
  return (
    <LegalPageShell title="Terms of Service">
      <p>
        These Terms of Service govern your use of Desklabs. By accessing or
        using the platform, you agree to these terms.
      </p>

      <h2 className="text-lg font-semibold">Services</h2>
      <p>
        Desklabs provides CRM, omnichannel inbox, AI assistant, marketing
        automation, and operational tools for business teams.
      </p>

      <h2 className="text-lg font-semibold">Acceptable Use</h2>
      <p>
        Users agree to use the platform only for lawful business purposes. You
        are responsible for the accuracy and legality of information you provide
        through the service.
      </p>

      <h2 className="text-lg font-semibold">Account Suspension</h2>
      <p>
        Desklabs may suspend or terminate accounts that violate applicable laws,
        third-party platform policies, or these Terms of Service.
      </p>

      <h2 className="text-lg font-semibold">Disclaimer</h2>
      <p>
        Services are provided on an as-is basis. Desklabs makes no warranties
        beyond those required by applicable law.
      </p>

      <h2 className="text-lg font-semibold">Contact</h2>
      <p>
        For questions about these terms, contact{" "}
        <a
          href="mailto:xaviatourtravel@gmail.com"
          className="font-medium underline underline-offset-4"
        >
          xaviatourtravel@gmail.com
        </a>
        .
      </p>
    </LegalPageShell>
  );
}
