<template>
  <Teleport to="body">
    <div v-if="visible" class="cinematic-overlay" :class="{ 'cinematic-overlay--black': zoomIn }">
      <img src="/welcome_title.png" alt="" class="cinematic-title"
        :class="{ 'cinematic-title--zoom-in': zoomIn, 'cinematic-title--zoom-out': zoomOut }">
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const FADE_TO_BLACK_DURATION = 700;
const PAUSE_DURATION = 250;
const ZOOM_OUT_DURATION = 900;

const visible = ref(false);
const zoomIn = ref(false);
const zoomOut = ref(false);
const zoomInScaleRef = ref(1.35);
const zoomOutScaleRef = ref(2.4);

// Zooms the centered title image in a bit while the screen fades to black, holds for a
// beat, then zooms it in further while fading it out. Resolves once done.
function play(zoomOutScale = 2.4, zoomInScale = 1.35): Promise<void> {
  visible.value = true;
  zoomIn.value = false;
  zoomOut.value = false;
  zoomInScaleRef.value = zoomInScale;
  zoomOutScaleRef.value = zoomOutScale;

  return new Promise((resolve) => {
    // Double rAF ensures the initial (inactive) styles paint before the transition starts.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        zoomIn.value = true;
      });
    });

    setTimeout(() => {
      zoomOut.value = true;
    }, FADE_TO_BLACK_DURATION + PAUSE_DURATION);

    setTimeout(() => {
      resolve();
    }, FADE_TO_BLACK_DURATION + PAUSE_DURATION + ZOOM_OUT_DURATION);
  });
}

defineExpose({ play });
</script>

<style scoped>
.cinematic-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0);
  transition: background-color 700ms ease;
  pointer-events: none;
}

.cinematic-overlay--black {
  background-color: #000;
}

.cinematic-title {
  width: 320px;
  max-width: 60vw;
  height: auto;
  opacity: 1;
  transform: scale(1);
  transition: transform 700ms cubic-bezier(0.22, 1, 0.36, 1);
}

.cinematic-title--zoom-in {
  transform: scale(v-bind(zoomInScaleRef));
}

.cinematic-title--zoom-out {
  transform: scale(v-bind(zoomOutScaleRef));
  opacity: 0;
  transition: transform 900ms cubic-bezier(0.22, 1, 0.36, 1), opacity 900ms ease;
}
</style>
