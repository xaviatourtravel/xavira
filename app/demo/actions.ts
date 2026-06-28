"use server";

import { redirect } from "next/navigation";

import { submitDemoRequest } from "@/lib/demo/submit-demo-request";
import {
  validateDemoRequestInput,
  type DemoRequestErrorCode,
} from "@/lib/demo/validate";

function getField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function redirectWithError(code: DemoRequestErrorCode): never {
  redirect(`/demo?error=${encodeURIComponent(code)}`);
}

export async function submitDemoRequestAction(formData: FormData) {
  const validation = validateDemoRequestInput({
    fullName: getField(formData, "full_name"),
    workEmail: getField(formData, "work_email"),
    companyName: getField(formData, "company_name"),
    phone: getField(formData, "phone"),
    industry: getField(formData, "industry"),
    companySize: getField(formData, "company_size"),
    mainChallenge: getField(formData, "main_challenge"),
    message: getField(formData, "message"),
    honeypot: getField(formData, "company_website"),
  });

  if (!validation.ok) {
    redirectWithError(validation.errorCode);
  }

  const result = await submitDemoRequest(validation.data);

  if (!result.success) {
    redirect(`/demo?error=${encodeURIComponent("submit_failed")}`);
  }

  redirect("/demo?success=1");
}
