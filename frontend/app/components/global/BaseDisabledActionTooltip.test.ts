import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import BaseDisabledActionTooltip from "./BaseDisabledActionTooltip.vue";

describe("disabled action help", () => {
  it("prevents enclosing recipe links from navigating while still opening help", () => {
    const openHelp = vi.fn();
    const navigate = vi.fn();
    const wrapper = mount(BaseDisabledActionTooltip, {
      props: { disabled: true, message: "Analyze all ingredients first" },
      slots: { default: "<button disabled>Add to shopping list</button>" },
      global: { stubs: { VTooltip: { props: ["disabled", "text", "openOnClick", "location"], setup: () => ({ activatorProps: { onClick: openHelp } }), template: "<slot name='activator' :props='activatorProps' />" } } },
    });
    const cardLink = document.createElement("a");
    cardLink.href = "/recipe";
    cardLink.addEventListener("click", navigate);
    cardLink.append(wrapper.element);
    const click = new MouseEvent("click", { bubbles: true, cancelable: true });
    wrapper.get(".disabled-action-tooltip").element.dispatchEvent(click);
    expect(click.defaultPrevented).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
    expect(openHelp).toHaveBeenCalledOnce();
    wrapper.unmount();
  });
  it("uses a focusable wrapper so disabled buttons can still show help", async () => {
    const focus = vi.fn();
    const wrapper = mount(BaseDisabledActionTooltip, {
      props: { disabled: true, message: "Analyze all ingredients first" },
      slots: { default: "<button disabled>Add to shopping list</button>" },
      global: { stubs: { VTooltip: { name: "VTooltip", props: ["disabled", "text", "openOnClick", "location"], setup: () => ({ activatorProps: { onFocus: focus } }), template: "<slot name='activator' :props='activatorProps' />" } } },
    });
    expect(wrapper.get(".disabled-action-tooltip").attributes("tabindex")).toBe("0");
    expect(wrapper.get(".disabled-action-tooltip").attributes("aria-label")).toBe("Analyze all ingredients first");
    expect(wrapper.get("button").attributes("disabled")).toBeDefined();
    await wrapper.get(".disabled-action-tooltip").trigger("focus");
    expect(focus).toHaveBeenCalledOnce();
    expect(wrapper.findComponent({ name: "VTooltip" }).props("openOnClick")).toBe(true);
    await wrapper.setProps({ disabled: false });
    expect(wrapper.get(".disabled-action-tooltip").attributes("tabindex")).toBeUndefined();
    expect(wrapper.findComponent({ name: "VTooltip" }).props("disabled")).toBe(true);
    wrapper.unmount();
  });
});
