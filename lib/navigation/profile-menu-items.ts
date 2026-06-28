export type ProfileMenuItemStatus = "available" | "coming_soon";

export type ProfileMenuItem = {
  id: string;
  label: string;
  href: string;
  status: ProfileMenuItemStatus;
};

export type ProfileMenuSection = {
  id: string;
  title: string;
  items: ProfileMenuItem[];
};

export const PROFILE_MENU_SECTIONS: ProfileMenuSection[] = [
  {
    id: "account",
    title: "Akun",
    items: [
      {
        id: "profile",
        label: "Profil Saya",
        href: "/profile",
        status: "coming_soon",
      },
      {
        id: "preferences",
        label: "Preferensi",
        href: "/preferences",
        status: "coming_soon",
      },
      {
        id: "security",
        label: "Keamanan",
        href: "/security",
        status: "coming_soon",
      },
    ],
  },
  {
    id: "workspace",
    title: "Workspace",
    items: [
      {
        id: "workspace-settings",
        label: "Pengaturan Workspace",
        href: "/settings/organization",
        status: "available",
      },
      {
        id: "team",
        label: "Anggota Tim",
        href: "/settings/team",
        status: "available",
      },
      {
        id: "billing",
        label: "Billing",
        href: "/settings/billing",
        status: "coming_soon",
      },
    ],
  },
  {
    id: "support",
    title: "Dukungan",
    items: [
      {
        id: "help",
        label: "Bantuan",
        href: "/help",
        status: "coming_soon",
      },
      {
        id: "docs",
        label: "Dokumentasi",
        href: "/docs",
        status: "coming_soon",
      },
      {
        id: "support-contact",
        label: "Hubungi Support",
        href: "/support",
        status: "coming_soon",
      },
    ],
  },
];

export const PROFILE_MENU_FLAT_ITEMS = PROFILE_MENU_SECTIONS.flatMap(
  (section) => section.items,
);
