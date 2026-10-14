import { mount } from "@vue/test-utils";
import { defineComponent, h, nextTick, onUpdated, reactive } from "vue";
import { describe, expect, it, vi } from "vitest";
import RecipeStepTitleInput from "./RecipeStepTitleInput.vue";
import type { RecipeStep } from "~/lib/api/types/recipe";

const TextField = defineComponent({
  props: ["modelValue"],
  emits: ["update:modelValue"],
  setup(props, { emit, slots }) {
    return () => h("div", [slots.prepend?.(), h("input", {
      value: props.modelValue,
      onInput: (event: Event) => emit("update:modelValue", (event.target as HTMLInputElement).value),
    })]);
  },
});

describe("step title input", () => {
  it("updates the saved title immediately without rerendering the surrounding list", async () => {
    const steps = reactive(Array.from({ length: 64 }, (_, index) => ({
      id: String(index), summary: "", text: "Instruction text",
    } as RecipeStep)));
    const parentUpdated = vi.fn();
    const List = defineComponent({
      setup() {
        onUpdated(parentUpdated);
        return () => h("div", steps.map(step => h(RecipeStepTitleInput, { step, key: step.id ?? undefined })));
      },
    });
    const wrapper = mount(List, { global: { stubs: { VTextField: TextField } } });
    await wrapper.findAll("input")[0]!.setValue("Préparer la pâte");
    await nextTick();
    expect(steps[0]!.summary).toBe("Préparer la pâte");
    expect(parentUpdated).not.toHaveBeenCalled();
    expect(steps[1]!.summary).toBe("");
    wrapper.unmount();
  });

  it("preserves the drag handle slot", () => {
    const wrapper = mount(RecipeStepTitleInput, {
      props: { step: { id: "step", text: "", summary: "" } as RecipeStep },
      slots: { prepend: "<span class=\"handle\">Drag</span>" },
      global: { stubs: { VTextField: TextField } },
    });
    expect(wrapper.find(".handle").text()).toBe("Drag");
    wrapper.unmount();
  });
});
