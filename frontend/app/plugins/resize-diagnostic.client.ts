// Development-only evidence for resize loops; does not alter observer delivery.
export default defineNuxtPlugin(() => {
  if (!import.meta.dev) return;

  const NativeResizeObserver = window.ResizeObserver;
  const recent: { time: number; target: string; size: string; source: string }[] = [];

  window.ResizeObserver = class extends NativeResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      const source = new Error().stack?.split("\n").slice(2, 6).join("\n") ?? "unknown";
      super((entries, observer) => {
        for (const entry of entries) {
          const element = entry.target;
          recent.push({
            time: performance.now(),
            target: `${element.tagName.toLowerCase()}.${[...element.classList].join(".")}`,
            size: `${entry.contentRect.width} x ${entry.contentRect.height}`,
            source,
          });
        }
        if (recent.length > 30) recent.splice(0, recent.length - 30);
        callback(entries, observer);
      });
    }
  };

  function reportResizeLoop(event: ErrorEvent) {
    if (!event.message.includes("ResizeObserver loop")) return;
    const cutoff = performance.now() - 1000;
    const entries = recent.filter(entry => entry.time >= cutoff).slice(-10);
    console.warn("[Petit Chef resize diagnostic] Recent observed elements:\n"
      + entries.map(entry => `${entry.target} (${entry.size})\n${entry.source}`).join("\n\n"));
  }
  window.addEventListener("error", reportResizeLoop);

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      window.removeEventListener("error", reportResizeLoop);
      window.ResizeObserver = NativeResizeObserver;
    });
  }
});
