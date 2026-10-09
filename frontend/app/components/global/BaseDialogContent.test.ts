import { shallowMount } from "@vue/test-utils";
import { expect, test, vi } from "vitest";
import BaseDialogContent from "./BaseDialogContent.vue";

vi.mock("~/composables/use-global-i18n", () => ({
  useGlobalI18n: () => ({ t: (key: string) => key }),
}));

test.each(["primary", "error", "success"])("%s dialogs have neutral headers and retain confirmation colors", (color) => {
  const wrapper = shallowMount(BaseDialogContent, {
    props: { title: "Dialog title", color, canConfirm: true },
    global: {
      renderStubDefaultSlot: true,
      stubs: {
        VCard: { template: "<div><slot /></div>" },
        VToolbar: { props: ["color"], template: "<header :data-color=\"color\"><slot /></header>" },
        VCardActions: { template: "<footer><slot /></footer>" },
        BaseButton: { props: ["color"], template: "<button :data-color=\"color\"><slot /></button>" },
        VIcon: true, VToolbarTitle: { template: "<h2><slot /></h2>" },
        VProgressLinear: true, VSpacer: true, VBtn: true, VDivider: true,
      },
      mocks: {
        $vuetify: { display: { xs: false } },
        $globals: { icons: { check: "check" } },
      },
    },
  });
  expect(wrapper.find("header").attributes("data-color")).toBe("surface");
  expect(wrapper.find("button").attributes("data-color")).toBe(color);
  expect(wrapper.text()).toContain("Dialog title");
});
