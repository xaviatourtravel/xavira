import Link from "next/link";

import { RegisterForm } from "@/components/auth/register-form";
import { siteConfig } from "@/config/site";
import { isBetaJoinModeActive } from "@/lib/auth/beta-onboarding";

export default function RegisterPage() {
  const betaJoinMode = isBetaJoinModeActive();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-8 text-xl font-semibold">
        {siteConfig.name}
      </Link>
      <RegisterForm betaJoinMode={betaJoinMode} />
    </div>
  );
}
