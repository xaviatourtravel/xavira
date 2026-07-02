import { NextResponse } from "next/server";

import { getProfile } from "@/lib/auth/session";
import {
  fetchWhatsAppProfilePictureUrlResult,
  getWhatsAppInstanceName,
} from "@/lib/integrations/whatsapp/evolution-client";
import { normalizeWhatsappPhoneDigits } from "@/lib/integrations/whatsapp/phone";
import { syncWhatsappConversationProfilePicture } from "@/lib/whatsapp-inbox/profile-picture";
import { findWhatsappConversationByPhone } from "@/lib/whatsapp-inbox/repository";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const isDev = process.env.NODE_ENV === "development";
  const profile = await getProfile();

  if (!isDev && !profile) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const phone = searchParams.get("phone")?.trim() ?? "";
  const save = searchParams.get("save") === "1";

  if (!phone) {
    return NextResponse.json(
      {
        error: "Query parameter phone is required.",
      },
      { status: 400 },
    );
  }

  const normalizedPhone = normalizeWhatsappPhoneDigits(phone);
  const instanceName = getWhatsAppInstanceName();

  if (!normalizedPhone) {
    return NextResponse.json({
      phone,
      normalizedPhone,
      instanceName,
      profilePictureUrl: null,
      saved: false,
      source: null,
      error: "Invalid phone number after normalization.",
    });
  }

  try {
    const fetchResult = await fetchWhatsAppProfilePictureUrlResult({
      phoneNumber: phone,
      instanceName,
    });

    let saved = false;
    let saveError: string | null = null;

    if (save && profile && fetchResult.profilePictureUrl) {
      try {
        const supabase = await createClient();
        const conversation = await findWhatsappConversationByPhone(
          supabase,
          profile.organization_id,
          instanceName,
          normalizedPhone,
        );

        if (conversation) {
          await syncWhatsappConversationProfilePicture(
            supabase,
            profile.organization_id,
            conversation.id,
            { force: true },
          );
          saved = true;
        } else {
          saveError = "No whatsapp_conversations row found for this phone.";
        }
      } catch (error) {
        saveError =
          error instanceof Error ? error.message : "Failed to save avatar URL.";
      }
    }

    return NextResponse.json({
      phone,
      normalizedPhone,
      instanceName,
      profilePictureUrl: fetchResult.profilePictureUrl,
      source: fetchResult.source ?? null,
      reachedApi: fetchResult.reachedApi,
      saved,
      error: saveError,
    });
  } catch (error) {
    return NextResponse.json({
      phone,
      normalizedPhone,
      instanceName,
      profilePictureUrl: null,
      saved: false,
      source: null,
      error: error instanceof Error ? error.message : "Fetch failed.",
    });
  }
}
