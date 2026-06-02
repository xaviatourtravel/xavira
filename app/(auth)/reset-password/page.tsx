import Link from "next/link";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { siteConfig } from "@/config/site";

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 text-xl font-semibold">
        {siteConfig.name}
      </Link>
      <ResetPasswordForm />
    </div>
  );
}
