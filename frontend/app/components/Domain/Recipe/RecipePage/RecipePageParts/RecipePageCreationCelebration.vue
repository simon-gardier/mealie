<template>
  <canvas ref="canvas" class="recipe-creation-celebration" aria-hidden="true" />
</template>

<script setup lang="ts">
interface Particle {
  color: string;
  life: number;
  size: number;
  velocityX: number;
  velocityY: number;
  x: number;
  y: number;
}

const emit = defineEmits<{ complete: [] }>();
const canvas = ref<HTMLCanvasElement | null>(null);
let animationFrame: number | undefined;

const colors = ["#e94f37", "#f7c948", "#59c3c3", "#f6f7eb", "#d26cd5"];

function createBurst(x: number, y: number): Particle[] {
  return Array.from({ length: 54 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 54 + Math.random() * 0.15;
    const speed = 3 + Math.random() * 6;

    return {
      color: colors[index % colors.length],
      life: 1,
      size: 2 + Math.random() * 2.5,
      velocityX: Math.cos(angle) * speed,
      velocityY: Math.sin(angle) * speed,
      x,
      y,
    };
  });
}

onMounted(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    emit("complete");
    return;
  }

  const element = canvas.value;
  const context = element?.getContext("2d");
  if (!element || !context) return;

  const pixelRatio = window.devicePixelRatio || 1;
  element.width = window.innerWidth * pixelRatio;
  element.height = window.innerHeight * pixelRatio;
  context.scale(pixelRatio, pixelRatio);

  const particles = [
    ...createBurst(window.innerWidth * 0.25, window.innerHeight * 0.35),
    ...createBurst(window.innerWidth * 0.5, window.innerHeight * 0.2),
    ...createBurst(window.innerWidth * 0.75, window.innerHeight * 0.35),
  ];

  function animate() {
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (const particle of particles) {
      particle.x += particle.velocityX;
      particle.y += particle.velocityY;
      particle.velocityY += 0.09;
      particle.velocityX *= 0.985;
      particle.life -= 0.014;

      if (particle.life <= 0) continue;

      context.globalAlpha = particle.life;
      context.fillStyle = particle.color;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();
    }

    if (particles.some(particle => particle.life > 0)) {
      animationFrame = requestAnimationFrame(animate);
    }
    else {
      emit("complete");
    }
  }

  animate();
});

onBeforeUnmount(() => {
  if (animationFrame) cancelAnimationFrame(animationFrame);
});
</script>

<style scoped>
.recipe-creation-celebration {
  height: 100vh;
  left: 0;
  pointer-events: none;
  position: fixed;
  top: 0;
  width: 100vw;
  z-index: 3000;
}
</style>
