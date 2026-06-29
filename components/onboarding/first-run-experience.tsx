"use client";

import { useActionState, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

import { createWorkspaceAction } from "@/app/onboarding/actions";
import { INDUSTRY_OPTIONS } from "@/lib/onboarding/constants";
import { Button } from "@/components/ui/button";
import { DesklabsButton } from "@/components/ui/desklabs-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SolutionIndustry } from "@/lib/onboarding/types";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "workspace", label: "Nama workspace" },
  { id: "industry", label: "Pilih industri" },
  { id: "confirm", label: "Konfirmasi" },
  { id: "start", label: "Mulai" },
] as const;

type FirstRunExperienceProps = {
  ownerName: string;
};

export function FirstRunExperience({ ownerName }: FirstRunExperienceProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [workspaceName, setWorkspaceName] = useState("");
  const [industry, setIndustry] = useState<SolutionIndustry>("travel");
  const [state, formAction, pending] = useActionState(createWorkspaceAction, null);

  const step = STEPS[stepIndex]!;
  const selectedIndustry = INDUSTRY_OPTIONS.find((option) => option.id === industry);

  const canContinue =
    step.id === "workspace"
      ? workspaceName.trim().length >= 2
      : step.id === "industry"
        ? industry === "travel"
        : true;

  function goNext() {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex((index) => index + 1);
    }
  }

  function goBack() {
    if (stepIndex > 0) {
      setStepIndex((index) => index - 1);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-8 space-y-2 text-center">
        <p className="text-sm font-medium text-violet-700">Selamat datang, {ownerName}</p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          Selamat datang di Desklabs
        </h1>
        <p className="text-sm leading-relaxed text-slate-500">
          Buat workspace pertama Anda dan pilih industri agar Desklabs dapat menyesuaikan
          pengalaman kerja Anda.
        </p>
      </div>

      <div className="mb-6 flex items-center justify-center gap-2">
        {STEPS.map((item, index) => (
          <div key={item.id} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
                index <= stepIndex
                  ? "bg-violet-600 text-white"
                  : "bg-slate-100 text-slate-400",
              )}
            >
              {index < stepIndex ? <Check className="h-3.5 w-3.5" /> : index + 1}
            </span>
            {index < STEPS.length - 1 ? (
              <span className="hidden h-px w-6 bg-slate-200 sm:block" />
            ) : null}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
        {state?.success === false ? (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </div>
        ) : null}

        {step.id === "workspace" ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Nama workspace</h2>
              <p className="mt-1 text-sm text-slate-500">
                Beri nama workspace untuk tim dan brand Anda.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="workspaceName">Nama workspace</Label>
              <Input
                id="workspaceName"
                value={workspaceName}
                onChange={(event) => setWorkspaceName(event.target.value)}
                placeholder="Contoh: Maju Travel HQ"
                autoFocus
              />
            </div>
          </div>
        ) : null}

        {step.id === "industry" ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Pilih industri</h2>
              <p className="mt-1 text-sm text-slate-500">
                Desklabs akan menyesuaikan modul dan workflow workspace Anda.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {INDUSTRY_OPTIONS.map((option) => {
                const Icon = option.icon;
                const disabled = option.status === "coming_soon";
                const selected = industry === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => setIndustry(option.id)}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border px-3 py-3 text-left transition-colors",
                      selected
                        ? "border-violet-300 bg-violet-50/60"
                        : "border-slate-200/80 hover:border-slate-300",
                      disabled && "cursor-not-allowed opacity-70",
                    )}
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-slate-900">
                        {option.label}
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                        {option.description}
                      </span>
                      {disabled ? (
                        <span className="mt-1 inline-flex rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                          Segera
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {step.id === "confirm" ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Konfirmasi</h2>
              <p className="mt-1 text-sm text-slate-500">
                Periksa kembali sebelum workspace dibuat.
              </p>
            </div>
            <dl className="space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Nama workspace</dt>
                <dd className="font-medium text-slate-950">{workspaceName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Industri</dt>
                <dd className="font-medium text-slate-950">{selectedIndustry?.label}</dd>
              </div>
            </dl>
          </div>
        ) : null}

        {step.id === "start" ? (
          <form action={formAction} className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">
                Mulai menggunakan Desklabs
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Workspace siap dibuat. Anda akan masuk ke Ruang Kerja Hari Ini setelah ini.
              </p>
            </div>
            <input type="hidden" name="workspaceName" value={workspaceName} />
            <input type="hidden" name="industry" value={industry} />
            <DesklabsButton
              type="submit"
              className="w-full"
              loading={pending}
              loadingLabel="Membuat workspace..."
            >
              Mulai menggunakan Desklabs
            </DesklabsButton>
          </form>
        ) : null}

        {step.id !== "start" ? (
          <div className="mt-6 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={goBack}
              disabled={stepIndex === 0}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
            <Button type="button" onClick={goNext} disabled={!canContinue} className="gap-2">
              Lanjut
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="mt-6">
            <Button type="button" variant="outline" onClick={goBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
