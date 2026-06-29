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
        status: "available",
      },
      {
        id: "preferences",
        label: "Preferensi",
        href: "/preferences",
        status: "available",
      },
      {
        id: "security",
        label: "Keamanan",
        href: "/security",
        status: "available",
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
        href: "/billing",
        status: "available",
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
        status: "available",
      },
      {
        id: "docs",
        label: "Dokumentasi",
        href: "/docs",
        status: "available",
      },
      {
        id: "support-contact",
        label: "Hubungi Support",
        href: "/support",
        status: "available",
      },
    ],
  },
];

export const PROFILE_MENU_FLAT_ITEMS = PROFILE_MENU_SECTIONS.flatMap(
  (section) => section.items,
);
