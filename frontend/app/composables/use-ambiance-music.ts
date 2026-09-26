import { useLocalStorage } from "@vueuse/core";
import { onMounted, onScopeDispose, toValue, watch } from "vue";
import type { MaybeRefOrGetter, Ref } from "vue";

let ambianceMusicPreference: Ref<boolean> | undefined;

export function useAmbianceMusicEnabled(): Ref<boolean> {
  ambianceMusicPreference ??= useLocalStorage("ambiance-music-enabled", false);
  return ambianceMusicPreference;
}

export function useAmbianceMusic(isActive: MaybeRefOrGetter<boolean>, assetPath: string): void {
  const enabled = useAmbianceMusicEnabled();
  const baseURL = useRuntimeConfig().app.baseURL;
  const source = `${baseURL.endsWith("/") ? baseURL : `${baseURL}/`}${assetPath}`;
  let audio: HTMLAudioElement | undefined;

  const syncAudio = () => {
    if (!import.meta.client) return;

    if (!enabled.value || !toValue(isActive)) {
      audio?.pause();
      if (audio) audio.currentTime = 0;
      return;
    }

    if (!audio) {
      audio = new Audio(source);
      audio.loop = true;
    }

    void audio.play().catch(() => undefined);
  };

  const stopWatching = watch([enabled, () => toValue(isActive)], syncAudio);

  onMounted(syncAudio);
  onScopeDispose(() => {
    stopWatching();
    audio?.pause();
  });
}
