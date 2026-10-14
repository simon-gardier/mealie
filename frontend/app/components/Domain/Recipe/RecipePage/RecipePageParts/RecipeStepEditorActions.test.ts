import { mount } from "@vue/test-utils";
import { defineComponent, h, onUpdated, ref } from "vue";
import { describe, expect, it, vi } from "vitest";
import RecipeStepEditorActions from "./RecipeStepEditorActions.vue";

const menuUpdated = vi.fn();
const ButtonGroup = defineComponent({
  props: ["buttons"],
  emits: ["delete"],
  setup(props, { emit }) {
    onUpdated(menuUpdated);
    return () => h("button", { onClick: () => emit("delete") }, JSON.stringify(props.buttons));
  },
});
const global = {
  stubs: { BaseButtonGroup: ButtonGroup },
  mocks: { $globals: { icons: { eye: "eye", edit: "edit" } } },
};

describe("step editor actions", () => {
  it("does not rebuild step menus on reorder and uses the new action index", async () => {
    menuUpdated.mockClear();
    const steps = ref(Array.from({ length: 64 }, (_, index) => ({ id: String(index) })));
    const deleted = vi.fn();
    const List = defineComponent({
      setup: () => () => h("div", steps.value.map((step, index) => h(RecipeStepEditorActions, {
        key: step.id, onDelete: () => deleted(index),
      }))),
    });
    const wrapper = mount(List, { global });
    const moved = steps.value[0]!;
    steps.value = [...steps.value.slice(1), moved];
    await wrapper.vm.$nextTick();
    expect(menuUpdated).not.toHaveBeenCalled();
    await wrapper.findAll("button")[63]!.trigger("click");
    expect(deleted).toHaveBeenCalledWith(63);
    wrapper.unmount();
  });

  it("refreshes preview and section actions when their state changes", async () => {
    const wrapper = mount(RecipeStepEditorActions, { global, props: { preview: false, showTitle: false } });
    expect(wrapper.findComponent(ButtonGroup).props("buttons")[0].icon).toBe("eye");
    expect(wrapper.text()).toContain("toggle-section");
    await wrapper.setProps({ preview: true, showTitle: true });
    expect(wrapper.findComponent(ButtonGroup).props("buttons")[0].icon).toBe("edit");
    expect(wrapper.text()).not.toContain("toggle-section");
    wrapper.unmount();
  });
});
