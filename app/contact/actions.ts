"use server";

import { redirect } from "next/navigation";

import { submitContactMessage } from "@/lib/contact/submit-contact-message";
import {
  validateContactMessageInput,
  type ContactMessageErrorCode,
} from "@/lib/contact/validate";

function getField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function redirectWithError(code: ContactMessageErrorCode): never {
  redirect(`/contact?error=${encodeURIComponent(code)}`);
}

export async function submitContactMessageAction(formData: FormData) {
  const validation = validateContactMessageInput({
    fullName: getField(formData, "full_name"),
    email: getField(formData, "email"),
    companyName: getField(formData, "company_name"),
    topic: getField(formData, "topic"),
    message: getField(formData, "message"),
    honeypot: getField(formData, "company_website"),
  });

  if (!validation.ok) {
    redirectWithError(validation.errorCode);
  }

  const result = await submitContactMessage(validation.data);

  if (!result.success) {
    redirect("/contact?error=submit_failed");
  }

  redirect("/contact?success=1");
}
