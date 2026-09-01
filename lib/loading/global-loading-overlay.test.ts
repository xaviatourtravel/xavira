import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

function read(relative: string) {
  return readFileSync(path.join(process.cwd(), relative), "utf8");
}

describe("global loading overlay integration", () => {
  it("overlay blocks pointer interaction and respects reduced motion", () => {
    const overlay = read("components/loading/global-loading-overlay.tsx");
    assert.match(overlay, /fixed inset-0/);
    assert.match(overlay, /pointer-events-auto/);
    assert.match(overlay, /z-\[80\]/);
    assert.match(overlay, /motion-reduce:backdrop-blur-none/);
    assert.match(overlay, /aria-live="assertive"/);
    assert.match(overlay, /DesklabsSpinner/);
    assert.doesNotMatch(overlay, /min-h-screen/);
    assert.doesNotMatch(overlay, /DesklabsPageLoader/);
  });

  it("root layout mounts the global provider, not a finance-only loader", () => {
    const layout = read("app/layout.tsx");
    assert.match(layout, /GlobalLoadingProvider/);
    assert.doesNotMatch(layout, /modules\/finance/);
    const provider = read("components/loading/global-loading-provider.tsx");
    assert.match(provider, /resolveAppNavigationHref/);
    assert.match(provider, /isGlobalLoadingForm/);
    assert.match(provider, /usePathname/);
    assert.match(provider, /popstate/);
  });

  it("Finance uses the global form marker instead of a duplicate overlay", () => {
    const issue = read("app/(dashboard)/finance/invoices/[id]/page.tsx");
    assert.match(issue, /data-global-loading/);
    const convert = read(
      "modules/finance/components/proforma-lifecycle-actions.tsx",
    );
    assert.match(convert, /data-global-loading/);
    const financeOverlay = read(
      "modules/finance/components/invoice-workspace-page.tsx",
    );
    assert.doesNotMatch(financeOverlay, /GlobalLoadingOverlay/);
    assert.doesNotMatch(financeOverlay, /DesklabsPageLoader/);
  });

  it("navigation components integrate with the global loader", () => {
    const search = read("components/layout/universal-search.tsx");
    assert.match(search, /useGlobalLoading/);
    assert.match(search, /navigateWithLoading/);
    const create = read("components/layout/quick-create-menu.tsx");
    assert.match(create, /useGlobalLoading/);
    assert.match(create, /navigateWithLoading/);
    const sidebar = read("components/layout/sidebar-navigation.tsx");
    assert.match(sidebar, /<Link/);
  });

  it("background realtime code does not start the global overlay", () => {
    const realtime = read("modules/inbox/hooks/use-ai-command-center-realtime.ts");
    assert.doesNotMatch(realtime, /useGlobalLoading/);
    assert.doesNotMatch(realtime, /withGlobalLoading/);
    assert.doesNotMatch(realtime, /ROUTE_LOADING_TOKEN/);
  });

  it("cold-load auth/onboarding loaders remain; dashboard route loaders do not replace pages", () => {
    assert.equal(existsSync("app/(auth)/loading.tsx"), true);
    assert.equal(existsSync("app/onboarding/loading.tsx"), true);
    assert.equal(existsSync("app/(dashboard)/loading.tsx"), false);
    assert.equal(existsSync("app/(dashboard)/inbox/loading.tsx"), false);
    assert.equal(existsSync("app/(dashboard)/today/loading.tsx"), false);
    const auth = read("app/(auth)/loading.tsx");
    assert.match(auth, /DesklabsPageLoader/);
  });
});
