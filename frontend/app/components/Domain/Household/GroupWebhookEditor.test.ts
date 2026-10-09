import { mount } from "@vue/test-utils";
import { expect, test, vi } from "vitest";
import GroupWebhookEditor from "./GroupWebhookEditor.vue";

vi.mock("~/composables/use-group-webhooks", () => ({ timeLocalToUTC: (time: string) => time, timeUTCToLocal: (time: string) => time }));

test("hour and minute choices save a 24-hour time without modifying the original webhook", async () => {
  vi.stubGlobal("useSeoMeta", vi.fn());
  const webhook = { id: "hook", name: "Dinner", url: "https://example.com", enabled: true, scheduledTime: "02:00" };
  const wrapper = mount(GroupWebhookEditor, {
    props: { webhook },
    global: {
      mocks: { $globals: { icons: {} } },
      stubs: {
        VCardText: { template: "<div><slot /></div>" }, VCardActions: { template: "<div><slot /></div>" },
        VCard: { template: "<div><slot /></div>" }, VMenu: { template: "<div><slot name=\"activator\" :props=\"{}\" /><slot /></div>" },
        VSelect: { name: "VSelect", props: ["modelValue"], template: "<div />" }, VTextField: true, VSwitch: true,
        VBtn: { template: "<button><slot /></button>" },
      },
    },
  });
  const selects = wrapper.findAllComponents({ name: "VSelect" });
  selects[0]!.vm.$emit("update:modelValue", "18");
  selects[1]!.vm.$emit("update:modelValue", "35");
  await wrapper.findAll(".webhook-actions button")[2]!.trigger("click");
  expect(wrapper.emitted("save")?.[0]?.[0]).toMatchObject({ scheduledTime: "18:35" });
  expect(webhook.scheduledTime).toBe("02:00");
  wrapper.unmount();
  vi.unstubAllGlobals();
});
