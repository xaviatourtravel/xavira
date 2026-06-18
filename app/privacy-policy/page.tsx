import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";

export const metadata: Metadata = {
  title: "Privacy Policy | Desklabs",
  description:
    "Desklabs privacy policy — how we collect, use, and protect customer communication and business data.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell title="Privacy Policy">
      <p>
        Desklabs is a CRM, omnichannel inbox, marketing automation, and business
        operations platform designed to help teams manage customer relationships
        and day-to-day business workflows.
      </p>

      <h2 className="text-lg font-semibold">Information We Collect</h2>
      <p>We may collect the following types of information:</p>
      <ul className="list-disc space-y-2 pl-6">
        <li>Customer communication data (e.g. messages from connected channels)</li>
        <li>Contact information (name, email, phone number)</li>
        <li>Lead and sales information</li>
        <li>Business operational data required to provide our services</li>
      </ul>

      <h2 className="text-lg font-semibold">How We Use Information</h2>
      <p>
        Data is used solely for CRM, customer service, marketing automation, and
        business operations within the Desklabs platform. We do not sell personal
        information to third parties.
      </p>

      <h2 className="text-lg font-semibold">Data Security</h2>
      <p>
        Data is stored securely and is accessible only to authorized personnel
        within your organization and our infrastructure providers as needed to
        operate the service.
      </p>

      <h2 className="text-lg font-semibold">Your Rights</h2>
      <p>
        Users may request access, correction, or deletion of their personal data.
        To submit a request, contact us at{" "}
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
