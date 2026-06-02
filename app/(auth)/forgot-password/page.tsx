import Link from "next/link";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { siteConfig } from "@/config/site";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 text-xl font-semibold">
        {siteConfig.name}
      </Link>
      <ForgotPasswordForm />
    </div>
  );
}
