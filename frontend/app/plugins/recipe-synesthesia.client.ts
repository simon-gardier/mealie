import { CHEESE, drawCheeseFrame, drawReducedMotion, loadCheeseFrames } from "~/lib/recipe-synesthesia/cheese-frames";

const FAVORITED_EVENT = "mealie:recipe-favorited";
const OVERLAY_SIZE = 180;
const OVERLAY_MARGIN = 12;
const FADE_DURATION = 140;
const PLAYBACK_FRAME_COUNT = Math.round(CHEESE.fps * 1.5);

export function playRecipeSynesthesia() {
  document.dispatchEvent(new CustomEvent(FAVORITED_EVENT));
}

export default defineNuxtPlugin((nuxtApp) => {
  let activeAnimation: { stop: (fade?: boolean) => void } | undefined;
  let generation = 0;

  // Start decoding before the first favorite action, matching the supplied player.
  void loadCheeseFrames().catch(() => { });

  function playSynesthesia() {
    const run = ++generation;
    activeAnimation?.stop();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let sheets: HTMLImageElement[] | undefined;
    if (!reduceMotion) {
      void loadCheeseFrames().then((loaded) => {
        if (run === generation) sheets = loaded;
      }).catch(() => { });
    }
    if (document.hidden) return;

    activeAnimation?.stop();
    const animation = document.createElement("div");
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement.getBoundingClientRect() : undefined;
    const size = Math.min(OVERLAY_SIZE, window.innerWidth - OVERLAY_MARGIN * 2, window.innerHeight - OVERLAY_MARGIN * 2);
    const left = Math.max(
      OVERLAY_MARGIN,
      Math.min(window.innerWidth - size - OVERLAY_MARGIN, (trigger?.left ?? window.innerWidth / 2) + (trigger?.width ?? 0) / 2 - size / 2),
    );
    const top = Math.max(
      OVERLAY_MARGIN,
      Math.min(window.innerHeight - size - OVERLAY_MARGIN, (trigger?.top ?? window.innerHeight / 2) + (trigger?.height ?? 0) / 2 - size / 2),
    );
    animation.setAttribute("aria-hidden", "true");
    animation.style.cssText = [
      "position:fixed",
      `left:${left}px`,
      `top:${top}px`,
      `width:${size}px`,
      `height:${size}px`,
      "z-index:9999",
      "overflow:hidden",
      "border-radius:50%",
      "transform-origin:center",
      "pointer-events:none",
    ].join(";");
    const canvas = document.createElement("canvas");
    canvas.style.cssText = "display:block;width:100%;height:100%";
    animation.append(canvas);
    document.body.append(animation);
    animation.animate(
      [
        { transform: "scale(0.24)" },
        { transform: "scale(1)" },
      ],
      { duration: 220, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" },
    );

    const width = Math.max(1, size);
    const height = Math.max(1, size);
    const ratio = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(2_400_000 / (width * height)));
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const context = canvas.getContext("2d");
    if (!context) {
      animation.remove();
      return;
    }
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    const startedAt = performance.now();
    const duration = reduceMotion ? 600 : (PLAYBACK_FRAME_COUNT / CHEESE.fps) * 1000;
    let frame = 0;
    function stop(fade = false) {
      window.cancelAnimationFrame(frame);
      if (fade) {
        animation.style.transition = "opacity 140ms ease-out";
        animation.style.opacity = "0";
        window.setTimeout(() => animation.remove(), 140);
      }
      else {
        animation.remove();
      }
      if (activeAnimation?.stop === stop) activeAnimation = undefined;
    }

    activeAnimation = { stop };
    function render(now: number) {
      const elapsedMs = now - startedAt;
      const progress = Math.min(1, elapsedMs / duration);
      if (progress >= 1 || run !== generation) return stop();
      if (elapsedMs >= duration - FADE_DURATION) {
        animation.style.opacity = String((duration - elapsedMs) / FADE_DURATION);
      }
      if (reduceMotion) drawReducedMotion(context, width, height, progress);
      else if (sheets) drawCheeseFrame(context, sheets, CHEESE.activeStartFrame + Math.floor(progress * PLAYBACK_FRAME_COUNT), width, height, {
        backdrop: false,
        scale: 1,
        opacityBoost: 1,
      });
      frame = window.requestAnimationFrame(render);
    }

    render(startedAt);
  }

  function stopOnPointerDown() {
    activeAnimation?.stop(true);
  }

  document.addEventListener(FAVORITED_EVENT, playSynesthesia);
  document.addEventListener("pointerdown", stopOnPointerDown);
  nuxtApp.hook("app:beforeUnmount", () => {
    document.removeEventListener(FAVORITED_EVENT, playSynesthesia);
    document.removeEventListener("pointerdown", stopOnPointerDown);
  });
});
