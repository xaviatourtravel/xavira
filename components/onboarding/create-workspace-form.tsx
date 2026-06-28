"use client";

import { useActionState } from "react";

import { createWorkspaceAction } from "@/app/onboarding/actions";
import { INDUSTRY_OPTIONS } from "@/lib/onboarding/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type CreateWorkspaceFormProps = {
  ownerName: string;
};

export function CreateWorkspaceForm({ ownerName }: CreateWorkspaceFormProps) {
  const [state, formAction, pending] = useActionState(createWorkspaceAction, null);

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-8 space-y-2 text-center">
        <p className="text-sm font-medium text-violet-700">Selamat datang, {ownerName}</p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          Selamat datang di Desklabs
        </h1>
        <p className="text-sm leading-relaxed text-slate-500">
          Buat workspace pertama Anda untuk mulai menggunakan Desklabs.
        </p>
      </div>

      <form
        action={formAction}
        className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
      >
        {state?.success === false ? (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="workspaceName">Nama workspace</Label>
          <Input
            id="workspaceName"
            name="workspaceName"
            placeholder="Contoh: Maju Travel HQ"
            required
            minLength={2}
            maxLength={120}
          />
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-slate-900">Industri</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {INDUSTRY_OPTIONS.map((option) => {
              const Icon = option.icon;
              const disabled = option.status === "coming_soon";

              return (
                <label
                  key={option.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 transition-colors has-[:checked]:border-violet-300 has-[:checked]:bg-violet-50/60",
                    disabled
                      ? "cursor-not-allowed border-slate-200/70 bg-slate-50/80 opacity-70"
                      : "border-slate-200/80 hover:border-slate-300",
                  )}
                >
                  <input
                    type="radio"
                    name="industry"
                    value={option.id}
                    defaultChecked={option.id === "travel"}
                    required
                    disabled={disabled}
                    className="mt-1"
                  />
                  <span className="min-w-0">
                    <span className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      <Icon className="h-4 w-4 text-slate-500" />
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
                </label>
              );
            })}
          </div>
        </fieldset>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Membuat workspace..." : "Buat workspace"}
        </Button>
      </form>
    </div>
  );
}
