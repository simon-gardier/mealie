<template>
  <div>
    <div class="video-background">
      <video
        ref="videoRef"
        class="video-background__video"
        :src="src"
        :poster="poster"
        autoplay
        loop
        playsinline
        muted
        preload="auto"
        @play="isPlaying = true"
        @pause="isPlaying = false"
      />
      <div class="video-background__overlay" />
    </div>

    <div class="video-background__controls">
      <v-btn
        icon
        variant="text"
        size="small"
        class="video-background__btn"
        :aria-label="isPlaying ? $t('general.pause') : $t('general.play')"
        @click="togglePlay"
      >
        <v-icon>{{ isPlaying ? $globals.icons.pause : $globals.icons.play }}</v-icon>
      </v-btn>
      <v-btn
        icon
        variant="text"
        size="small"
        class="video-background__btn"
        :aria-label="isMuted ? $t('general.unmute') : $t('general.mute')"
        @click="toggleMute"
      >
        <v-icon>{{ isMuted ? $globals.icons.volumeOff : $globals.icons.volumeHigh }}</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  src: string;
  poster?: string;
}>(), {
  poster: undefined,
});

const videoRef = ref<HTMLVideoElement | null>(null);
const isPlaying = ref(true);
const isMuted = ref(true);

function togglePlay() {
  const video = videoRef.value;
  if (!video) return;

  if (video.paused) {
    video.play().catch(() => {});
  }
  else {
    video.pause();
  }
}

function toggleMute() {
  const video = videoRef.value;
  if (!video) return;

  video.muted = !video.muted;
  isMuted.value = video.muted;
}

onMounted(() => {
  // Browsers only allow autoplay while muted, so the video always starts silent.
  const video = videoRef.value;
  if (!video) return;

  video.muted = true;
  isMuted.value = true;
  video.play().catch(() => {
    isPlaying.value = false;
  });
});
</script>

<style scoped>
.video-background {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background-color: #000;
}

.video-background__video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-background__overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  pointer-events: none;
}

.video-background__controls {
  position: fixed;
  right: 1rem;
  bottom: 1rem;
  z-index: 10;
  display: flex;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: 999px;
  background-color: rgba(var(--v-theme-surface), 0.55);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.video-background__btn {
  color: rgb(var(--v-theme-on-surface));
}
</style>
