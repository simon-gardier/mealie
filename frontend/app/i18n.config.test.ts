import { mount } from "@vue/test-utils";
import { describe, expect, test, vi } from "vitest";
import { h } from "vue";
import { createI18n, I18nT } from "vue-i18n";
import type { PostTranslationHandler, VueMessageType } from "vue-i18n";

async function createTranslationPlugin(locale: "en-US" | "fr-FR") {
  vi.stubGlobal("defineI18nConfig", (factory: () => unknown) => factory);
  try {
    const { default: factory } = await import("./i18n.config");
    const { postTranslation } = (factory as unknown as () => {
      postTranslation: PostTranslationHandler<VueMessageType>;
    })();
    return createI18n({
      legacy: false,
      locale,
      postTranslation,
      messages: {
        "en-US": { brand: "Welcome to Mealie", contribution: "Contribute: {docs}" },
        "fr-FR": { brand: "Bienvenue sur Mealie", contribution: "Contribuer : {docs}" },
      },
    });
  }
  finally {
    vi.unstubAllGlobals();
  }
}

describe("Petit Chef translations", () => {
  test.each([
    ["en-US", "Welcome to Petit Chef", "Contribute: Read the docs"],
    ["fr-FR", "Bienvenue sur Petit Chef", "Contribuer : Read the docs"],
  ] as const)("preserves interpolated links in %s", async (locale, brand, contribution) => {
    const i18n = await createTranslationPlugin(locale);
    expect(i18n.global.t("brand")).toBe(brand);

    const wrapper = mount(I18nT, {
      props: { keypath: "contribution", scope: "global", tag: "p" },
      slots: { docs: () => h("a", { href: "/docs" }, "Read the docs") },
      global: { plugins: [i18n] },
    });
    expect(wrapper.text()).toBe(contribution);
    expect(wrapper.get("a").attributes("href")).toBe("/docs");
    wrapper.unmount();
  });
});
