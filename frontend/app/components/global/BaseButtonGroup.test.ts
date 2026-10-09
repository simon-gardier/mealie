import { shallowMount } from "@vue/test-utils";
import { expect, test } from "vitest";
import BaseButtonGroup from "./BaseButtonGroup.vue";

test("instruction-style delete buttons are red while other actions keep their color", () => {
  const wrapper = shallowMount(BaseButtonGroup, {
    props: { buttons: [
      { icon: "edit", text: "Edit", event: "edit", color: "primary" },
      { icon: "trash", text: "Delete", event: "delete", color: "primary" },
    ] },
    global: {
      mocks: { $globals: { icons: { delete: "trash" } } },
      stubs: {
        VItemGroup: { template: "<div><slot /></div>" },
        VTooltip: { template: "<div><slot name=\"activator\" :props=\"{}\" /></div>" },
        VBtn: { props: ["color"], template: "<button :data-color=\"color\"><slot /></button>" },
        VIcon: { template: "<i><slot /></i>" },
      },
    },
  });
  const buttons = wrapper.findAll("button");
  expect(buttons[0]?.attributes("data-color")).toBe("primary");
  expect(buttons[1]?.attributes("data-color")).toBe("error");
});
