import { afterEach, describe, expect, it, vi } from "vitest";
import { effectScope, nextTick, ref } from "vue";
import { usePencilScratch } from "./use-pencil-scratch";

const preference = vi.hoisted(() => ({ enabled: { value: false } }));
vi.mock("~/composables/use-ambiance-music", () => ({
  useAmbianceMusicEnabled: () => preference.enabled,
}));

describe("pencil scratch feedback", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("plays on repeated toggles only while enabled, and stops on disable/dispose", async () => {
    preference.enabled = ref(false);
    const start = vi.fn();
    const stop = vi.fn();
    const close = vi.fn().mockResolvedValue(undefined);
    const connect = vi.fn();
    const disconnect = vi.fn();
    const Audio = vi.fn(function () {
      return {
        state: "running", sampleRate: 100, destination: {}, close,
        createBuffer: () => ({ getChannelData: () => new Float32Array(28) }),
        createBufferSource: () => ({ connect, disconnect, start, stop }),
        createBiquadFilter: () => ({ connect, disconnect, frequency: {}, Q: {} }),
        createGain: () => ({ connect, disconnect, gain: {} }),
      };
    });
    vi.stubGlobal("AudioContext", Audio);
    const scope = effectScope();
    const play = scope.run(usePencilScratch)!;
    play();
    expect(Audio).not.toHaveBeenCalled();
    preference.enabled.value = true;
    play();
    play();
    expect(start).toHaveBeenCalledTimes(2);
    expect(stop).toHaveBeenCalledOnce();
    preference.enabled.value = false;
    await nextTick();
    expect(stop).toHaveBeenCalledTimes(2);
    play();
    expect(start).toHaveBeenCalledTimes(2);
    scope.stop();
    expect(close).toHaveBeenCalledOnce();
    preference.enabled.value = true;
    play();
    expect(start).toHaveBeenCalledTimes(2);
  });
});
