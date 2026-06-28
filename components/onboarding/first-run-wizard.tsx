"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";

import {
  completeFirstRunAction,
  type CompleteFirstRunState,
} from "@/app/onboarding/actions";
import { OnboardingStepShell } from "@/components/onboarding/onboarding-step-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  COMPANY_SIZE_OPTIONS,
  FIRST_RUN_STEPS,
  INDUSTRY_OPTIONS,
  type FirstRunStep,
} from "@/lib/onboarding/constants";
import type { CompanySize, SolutionIndustry } from "@/lib/onboarding/types";
import { cn } from "@/lib/utils";

type FirstRunWizardProps = {
  defaultCompanyName: string;
  defaultWorkspaceName: string;
  ownerName: string;
};

const FINISH_MESSAGES = [
  "Menyimpan preferensi workspace…",
  "Mengaktifkan solution pack…",
  "Menyiapkan dashboard Anda…",
];

export function FirstRunWizard({
  defaultCompanyName,
  defaultWorkspaceName,
  ownerName,
}: FirstRunWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [industry, setIndustry] = useState<SolutionIndustry>("travel");
  const [companyName, setCompanyName] = useState(defaultCompanyName);
  const [workspaceName, setWorkspaceName] = useState(defaultWorkspaceName);
  const [companySize, setCompanySize] = useState<CompanySize>("1-5");
  const [inviteEmails, setInviteEmails] = useState("");
  const [finishMessageIndex, setFinishMessageIndex] = useState(0);
  const [submitRequested, setSubmitRequested] = useState(false);

  const [actionState, submitAction, isPending] = useActionState<
    CompleteFirstRunState | null,
    FormData
  >(completeFirstRunAction, null);

  const step = FIRST_RUN_STEPS[stepIndex] as FirstRunStep;

  const stepNumber = stepIndex + 1;

  const canContinue = useMemo(() => {
    if (step === "company") {
      return companyName.trim().length >= 2 && workspaceName.trim().length >= 2;
    }
    return true;
  }, [step, companyName, workspaceName]);

  useEffect(() => {
    if (step !== "finish" || submitRequested) {
      return;
    }

    const interval = window.setInterval(() => {
      setFinishMessageIndex((current) =>
        current < FINISH_MESSAGES.length - 1 ? current + 1 : current,
      );
    }, 900);

    const timeout = window.setTimeout(() => {
      setSubmitRequested(true);
      const formData = new FormData();
      formData.set("industry", industry);
      formData.set("companyName", companyName.trim());
      formData.set("workspaceName", workspaceName.trim());
      formData.set("companySize", companySize);
      formData.set("inviteEmails", inviteEmails);
      submitAction(formData);
    }, 2800);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [
    step,
    submitRequested,
    industry,
    companyName,
    workspaceName,
    companySize,
    inviteEmails,
    submitAction,
  ]);

  function goNext() {
    if (stepIndex < FIRST_RUN_STEPS.length - 1) {
      setStepIndex((value) => value + 1);
    }
  }

  function goBack() {
    if (stepIndex > 0 && step !== "finish") {
      setStepIndex((value) => value - 1);
    }
  }

  if (step === "welcome") {
    return (
      <OnboardingStepShell
        step={stepNumber}
        totalSteps={FIRST_RUN_STEPS.length}
        title="Selamat datang di Desklabs."
        description={`Halo ${ownerName.split(" ")[0] ?? ownerName}. Mari siapkan workspace Anda dalam beberapa langkah singkat supaya tim langsung tahu harus mulai dari mana.`}
        footer={
          <>
            <Button size="lg" className="bg-emerald-700 hover:bg-emerald-800" onClick={goNext}>
              Mulai setup
              <ArrowRight className="h-4 w-4" />
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            "Pilih industri operasional Anda",
            "Atur identitas workspace",
            "Undang tim (opsional)",
          ].map((item, index) => (
            <div
              key={item}
              className="rounded-2xl border border-slate-200/80 bg-slate-50/70 px-4 py-4"
            >
              <p className="text-xs font-semibold text-emerald-700">0{index + 1}</p>
              <p className="mt-2 text-sm text-slate-700">{item}</p>
            </div>
          ))}
        </div>
      </OnboardingStepShell>
    );
  }

  if (step === "industry") {
    return (
      <OnboardingStepShell
        step={stepNumber}
        totalSteps={FIRST_RUN_STEPS.length}
        title="Pilih industri Anda"
        description="Industri menentukan solution pack yang aktif. Modul platform inti tetap sama untuk semua bisnis."
        footer={
          <>
            <Button variant="outline" size="lg" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
            <Button size="lg" className="bg-emerald-700 hover:bg-emerald-800" onClick={goNext}>
              Lanjut
              <ArrowRight className="h-4 w-4" />
            </Button>
          </>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {INDUSTRY_OPTIONS.map((option) => {
            const Icon = option.icon;
            const selected = industry === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setIndustry(option.id)}
                className={cn(
                  "rounded-2xl border p-4 text-left transition-all hover:-translate-y-0.5",
                  selected
                    ? "border-emerald-300 bg-emerald-50/60 ring-2 ring-emerald-600/30"
                    : "border-slate-200/80 bg-white hover:border-emerald-200",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                      option.status === "available"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600",
                    )}
                  >
                    {option.status === "available" ? "Available" : "Coming Soon"}
                  </span>
                </div>
                <p className="mt-4 text-sm font-semibold text-slate-950">{option.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>
      </OnboardingStepShell>
    );
  }

  if (step === "company") {
    return (
      <OnboardingStepShell
        step={stepNumber}
        totalSteps={FIRST_RUN_STEPS.length}
        title="Informasi perusahaan"
        description="Data ini membantu menyesuaikan workspace dan laporan untuk tim Anda."
        footer={
          <>
            <Button variant="outline" size="lg" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
            <Button
              size="lg"
              className="bg-emerald-700 hover:bg-emerald-800"
              onClick={goNext}
              disabled={!canContinue}
            >
              Lanjut
              <ArrowRight className="h-4 w-4" />
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              placeholder="Contoh: Maju Travel Indonesia"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workspaceName">Workspace Name</Label>
            <Input
              id="workspaceName"
              value={workspaceName}
              onChange={(event) => setWorkspaceName(event.target.value)}
              placeholder="Contoh: Maju Travel HQ"
            />
            <p className="text-xs text-muted-foreground">
              Nama internal yang tim lihat di dashboard.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="companySize">Company Size</Label>
            <select
              id="companySize"
              value={companySize}
              onChange={(event) => setCompanySize(event.target.value as CompanySize)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {COMPANY_SIZE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </OnboardingStepShell>
    );
  }

  if (step === "invite") {
    return (
      <OnboardingStepShell
        step={stepNumber}
        totalSteps={FIRST_RUN_STEPS.length}
        title="Undang tim (opsional)"
        description="Tambahkan rekan tim sekarang atau lewati. Anda bisa mengundang kapan saja dari Pengaturan."
        footer={
          <>
            <Button variant="outline" size="lg" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
            <Button size="lg" className="bg-emerald-700 hover:bg-emerald-800" onClick={goNext}>
              {inviteEmails.trim() ? "Lanjut" : "Lewati untuk sekarang"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          <Label htmlFor="inviteEmails">Email anggota tim</Label>
          <textarea
            id="inviteEmails"
            value={inviteEmails}
            onChange={(event) => setInviteEmails(event.target.value)}
            placeholder={"sales@company.com\nmarketing@company.com"}
            className="min-h-[140px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="text-xs text-muted-foreground">
            Pisahkan dengan baris baru, koma, atau titik koma. Maksimal 5 email.
          </p>
        </div>
      </OnboardingStepShell>
    );
  }

  return (
    <OnboardingStepShell
      step={stepNumber}
      totalSteps={FIRST_RUN_STEPS.length}
      title="Menyiapkan workspace Anda"
      description="Kami sedang mengonfigurasi modul dan solution pack sesuai pilihan Anda."
    >
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-slate-50/70 px-6 py-14 text-center">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-200/60 [animation-duration:2s]" />
          <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-emerald-700 text-white">
            {isPending ? (
              <Loader2 className="h-7 w-7 animate-spin" />
            ) : (
              <Check className="h-7 w-7" />
            )}
          </span>
        </div>
        <p className="mt-6 text-sm font-medium text-slate-900">
          {FINISH_MESSAGES[finishMessageIndex]}
        </p>
        {actionState && !actionState.success ? (
          <p className="mt-3 text-sm text-red-600">{actionState.error}</p>
        ) : null}
      </div>
    </OnboardingStepShell>
  );
}
