import { onScopeDispose, watch } from "vue";
import { useAmbianceMusicEnabled } from "~/composables/use-ambiance-music";

/** A short, filtered noise stroke resembling pencil on paper. */
export function usePencilScratch() {
  const enabled = useAmbianceMusicEnabled();
  let context: AudioContext | undefined;
  let stroke: AudioBufferSourceNode | undefined;
  let disposed = false;

  const stop = () => {
    stroke?.stop();
    stroke = undefined;
  };
  watch(enabled, (value) => { if (!value) stop(); }, { flush: "sync" });
  onScopeDispose(() => {
    disposed = true;
    stop();
    void context?.close().catch(() => undefined);
  });

  return () => {
    if (!enabled.value || disposed || typeof window === "undefined" || !window.AudioContext) return;
    try {
      context ??= new window.AudioContext();
      const audio = context;
      const play = () => {
        if (!enabled.value || disposed) return;
        stop();
        const duration = 0.28;
        const buffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * duration), audio.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
          const progress = i / data.length;
          const envelope = Math.sin(Math.PI * progress) ** 2;
          const texture = 0.6 + 0.4 * Math.sin(progress * Math.PI * 7) ** 2;
          data[i] = (Math.random() * 2 - 1) * envelope * texture;
        }
        const source = audio.createBufferSource();
        const filter = audio.createBiquadFilter();
        const gain = audio.createGain();
        source.buffer = buffer;
        filter.type = "bandpass";
        filter.frequency.value = 2400;
        filter.Q.value = 0.7;
        gain.gain.value = 0.12;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(audio.destination);
        stroke = source;
        source.onended = () => {
          source.disconnect();
          filter.disconnect();
          gain.disconnect();
          if (stroke === source) stroke = undefined;
        };
        source.start();
      };
      if (audio.state === "suspended") void audio.resume().then(play).catch(() => undefined);
      else play();
    }
    catch {
      // Audio feedback must never interrupt checking or unchecking a step.
    }
  };
}
