/**
 * Desklabs Inspector Design System v1
 *
 * Unified inspector language for side panels across the product.
 * Philosophy: calm, dense, premium — Linear / Figma / Arc / Stripe / Attio.
 */

export {
  INSPECTOR_EXPAND_CLASS,
  INSPECTOR_FADE_CLASS,
  INSPECTOR_HEADER_GAP,
  INSPECTOR_HOVER_CLASS,
  INSPECTOR_ICON_CLASS,
  INSPECTOR_PADDING,
  INSPECTOR_ROW_GAP,
  INSPECTOR_SECTION_GAP,
} from "./constants";

export { InspectorRoot } from "./inspector-root";
export { InspectorHeader } from "./inspector-header";
export { InspectorHero } from "./inspector-hero";
export { InspectorSection } from "./inspector-section";
export { InspectorRow, InspectorRows, InspectorListItem } from "./inspector-row";
export { InspectorStat, InspectorStatGrid } from "./inspector-stat";
export {
  InspectorBadge,
  type InspectorBadgeSize,
  type InspectorBadgeState,
  type InspectorBadgeTone,
} from "./inspector-badge";
export { InspectorDivider } from "./inspector-divider";
export { InspectorEmpty } from "./inspector-empty";
export { InspectorSkeleton } from "./inspector-skeleton";
export { InspectorFooter } from "./inspector-footer";
export {
  InspectorAction,
  InspectorActionLink,
  type InspectorActionVariant,
} from "./inspector-action";
export { InspectorNotice, InspectorProgress } from "./inspector-notice";

// Legacy aliases — remove when all consumers migrate to v1 names
export { InspectorRoot as InspectorWorkspace } from "./inspector-root";
export { InspectorHeader as InspectorWorkspaceHeader } from "./inspector-header";
export { InspectorHeader as WorkspacePanelHeader } from "./inspector-header";
export { InspectorHeader as WorkspaceHeader } from "./inspector-header";
export { InspectorHero as InspectorHeroCard } from "./inspector-hero";
export { InspectorHero as WorkspaceHeroCard } from "./inspector-hero";
export { InspectorBadge as InspectorStatusPill } from "./inspector-badge";
export { InspectorFooter as InspectorStickyFooter } from "./inspector-footer";
export { InspectorSkeleton as InspectorLoading } from "./inspector-skeleton";
export { InspectorSkeleton as WorkspaceLoading } from "./inspector-skeleton";
export { InspectorAction as InspectorButton } from "./inspector-action";
export { InspectorActionLink as InspectorLinkButton } from "./inspector-action";
export { InspectorDivider as WorkspaceDivider } from "./inspector-divider";
export { InspectorEmpty as WorkspaceEmpty } from "./inspector-empty";
export { InspectorNotice as InspectorInlineNotice } from "./inspector-notice";
