import { NextResponse } from "next/server";

import { createClient } from "@/utils/supabase/server";

export async function requireWhatsAppIntegrationAccess() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: NextResponse.json(
        {
          ok: false,
          error: "unauthorized",
          message: "Anda perlu masuk untuk mengelola integrasi WhatsApp.",
        },
        { status: 401 },
      ),
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, organization_id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return {
      error: NextResponse.json(
        {
          ok: false,
          error: "unauthorized",
          message: "Profil pengguna tidak ditemukan.",
        },
        { status: 401 },
      ),
    };
  }

  if (profile.role !== "owner" && profile.role !== "admin") {
    return {
      error: NextResponse.json(
        {
          ok: false,
          error: "forbidden",
          message: "Hanya admin atau owner yang dapat mengelola WhatsApp.",
        },
        { status: 403 },
      ),
    };
  }

  return { profile };
}

export function mapWhatsAppRouteError(error: unknown) {
  if (error instanceof Error && error.name === "EvolutionServiceUnavailableError") {
    return NextResponse.json(
      {
        ok: false,
        error: "service_unavailable",
        message: error.message,
      },
      { status: 503 },
    );
  }

  if (error instanceof Error && error.name === "EvolutionConnectError") {
    return NextResponse.json(
      {
        ok: false,
        error: "connect_failed",
        message: error.message,
      },
      { status: 502 },
    );
  }

  console.error("WhatsApp integration route failed", error);

  return NextResponse.json(
    {
      ok: false,
      error: "unknown",
      message: "Terjadi kesalahan. Silakan coba lagi.",
    },
    { status: 500 },
  );
}
