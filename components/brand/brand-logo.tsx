import { branding } from "@/config/branding";
import { cn } from "@/lib/utils";

export type BrandLogoVariant = "full" | "icon";
export type BrandLogoSize = "sm" | "md" | "lg";

type BrandLogoProps = {
  variant?: BrandLogoVariant;
  size?: BrandLogoSize;
  className?: string;
  /** Override accessible label (defaults to app name). */
  alt?: string;
};

const HEIGHT_CLASS: Record<BrandLogoVariant, Record<BrandLogoSize, string>> = {
  full: {
    sm: "h-7",
    md: "h-8",
    lg: "h-[34px]",
  },
  icon: {
    sm: "h-6",
    md: "h-7",
    lg: "h-8",
  },
};

function ThemeLogo({
  lightSrc,
  darkSrc,
  alt,
  heightClass,
  mode,
}: {
  lightSrc: string;
  darkSrc: string;
  alt: string;
  heightClass: string;
  mode: "light" | "dark";
}) {
  const src = mode === "light" ? lightSrc : darkSrc;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG brand marks size reliably via img + h-* w-auto.
    <img
      src={src}
      alt={alt}
      className={cn(
        heightClass,
        "w-auto max-w-full shrink-0 object-contain object-left",
        mode === "light" ? "dark:hidden" : "hidden dark:block",
      )}
      decoding="async"
    />
  );
}

/**
 * Desklabs brand mark — full wordmark or icon, theme-aware (light/dark SVG pair).
 */
export function BrandLogo({
  variant = "full",
  size = "md",
  className,
  alt = branding.appName,
}: BrandLogoProps) {
  const heightClass = HEIGHT_CLASS[variant][size];
  const lightModeSrc = variant === "full" ? branding.logo : branding.icon;
  // Dark UI: use light-ink assets (readable on dark backgrounds). logo-dark/icon-dark
  // are dark-ink variants for light backgrounds — never use those here.
  const darkModeSrc =
    variant === "full" ? branding.logoLight : branding.iconLight;

  return (
    <span className={cn("inline-flex max-w-full items-center", className)}>
      <ThemeLogo
        lightSrc={lightModeSrc}
        darkSrc={darkModeSrc}
        alt={alt}
        heightClass={heightClass}
        mode="light"
      />
      <ThemeLogo
        lightSrc={lightModeSrc}
        darkSrc={darkModeSrc}
        alt={alt}
        heightClass={heightClass}
        mode="dark"
      />
    </span>
  );
}
