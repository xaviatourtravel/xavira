"use server";

import { revalidatePath } from "next/cache";

import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/utils/supabase/server";

export type UpdateProfileState = {
  success: boolean;
  message: string;
};

export async function updateProfileAction(
  _prevState: UpdateProfileState | null,
  formData: FormData,
): Promise<UpdateProfileState> {
  const { user, profile } = await requireProfile();
  const fullName = formData.get("full_name")?.toString().trim() ?? "";

  if (fullName.length < 2) {
    return {
      success: false,
      message: "Nama lengkap minimal 2 karakter.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", profile.id);

  if (error) {
    return {
      success: false,
      message: "Perubahan profil akan segera tersedia.",
    };
  }

  if (user.user_metadata?.full_name !== fullName) {
    await supabase.auth.updateUser({
      data: { full_name: fullName },
    });
  }

  revalidatePath("/profile");

  return {
    success: true,
    message: "Profil berhasil diperbarui.",
  };
}
