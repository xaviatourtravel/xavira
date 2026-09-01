import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createGlobalLoadingController,
  ROUTE_LOADING_TOKEN,
} from "@/lib/loading/global-loading-controller";
import {
  isGlobalLoadingForm,
  isRedirectError,
  resolveAppNavigationHref,
} from "@/lib/loading/is-app-navigation-click";

describe("global loading controller", () => {
  it("activates and clears after success", async () => {
    const loading = createGlobalLoadingController();
    assert.equal(loading.isActive(), false);
    const result = await loading.withLoading(async () => "ok");
    assert.equal(result, "ok");
    assert.equal(loading.isActive(), false);
  });

  it("clears after error", async () => {
    const loading = createGlobalLoadingController();
    await assert.rejects(
      () =>
        loading.withLoading(async () => {
          throw new Error("failed");
        }),
      /failed/,
    );
    assert.equal(loading.isActive(), false);
  });

  it("keeps the overlay while concurrent operations are pending", async () => {
    const loading = createGlobalLoadingController();
    const first = loading.start();
    const second = loading.start();
    assert.equal(loading.getActiveCount(), 2);
    loading.stop(first);
    assert.equal(loading.isActive(), true);
    loading.stop(second);
    assert.equal(loading.isActive(), false);
  });
});

describe("foreground navigation heuristics", () => {
  const location = { origin: "https://app.desklabs.test", pathname: "/today" };

  it("starts for internal app route changes", () => {
    const href = resolveAppNavigationHref(
      { button: 0 },
      {
        href: "https://app.desklabs.test/finance/invoices/xavia",
        target: "",
        hasAttribute: () => false,
      },
      location,
    );
    assert.equal(href, "/finance/invoices/xavia");
  });

  it("ignores same-path query filters, new tabs, and modified clicks", () => {
    assert.equal(
      resolveAppNavigationHref(
        { button: 0 },
        {
          href: "https://app.desklabs.test/today?q=1",
          target: "",
          hasAttribute: () => false,
        },
        location,
      ),
      null,
    );
    assert.equal(
      resolveAppNavigationHref(
        { button: 0 },
        {
          href: "https://app.desklabs.test/inbox",
          target: "_blank",
          hasAttribute: () => false,
        },
        location,
      ),
      null,
    );
    assert.equal(
      resolveAppNavigationHref(
        { button: 0, metaKey: true },
        {
          href: "https://app.desklabs.test/inbox",
          target: "",
          hasAttribute: () => false,
        },
        location,
      ),
      null,
    );
  });

  it("only marks opted-in POST forms as global loading", () => {
    assert.equal(
      isGlobalLoadingForm({
        method: "post",
        hasAttribute: (name) => name === "data-global-loading",
      }),
      true,
    );
    assert.equal(
      isGlobalLoadingForm({
        method: "get",
        hasAttribute: (name) => name === "data-global-loading",
      }),
      false,
    );
    assert.equal(
      isGlobalLoadingForm({
        method: "post",
        hasAttribute: () => false,
      }),
      false,
    );
  });

  it("treats Next.js redirect errors as navigation, not failures", () => {
    assert.equal(isRedirectError({ digest: "NEXT_REDIRECT;replace;/finance" }), true);
    assert.equal(isRedirectError(new Error("Invoice not found")), false);
  });

  it("route token can be reused without dropping a second waiter", () => {
    const loading = createGlobalLoadingController();
    loading.start(ROUTE_LOADING_TOKEN);
    loading.start(ROUTE_LOADING_TOKEN);
    assert.equal(loading.getActiveCount(), 1);
    loading.stop(ROUTE_LOADING_TOKEN);
    assert.equal(loading.isActive(), false);
  });
});
