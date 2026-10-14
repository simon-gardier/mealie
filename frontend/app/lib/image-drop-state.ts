import type { InjectionKey, Ref } from "vue";

export const imageDropSuppressedKey: InjectionKey<Ref<boolean>> = Symbol("image-drop-suppressed");
