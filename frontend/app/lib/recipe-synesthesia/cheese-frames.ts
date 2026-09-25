/** Original authored frames; image assets are credited in assets/ratatouille/ATTRIBUTION.md. */
import sheet0 from "~/assets/ratatouille/cheese-0.png?url";
import sheet1 from "~/assets/ratatouille/cheese-1.png?url";
import sheet2 from "~/assets/ratatouille/cheese-2.png?url";
import sheet3 from "~/assets/ratatouille/cheese-3.png?url";

export const CHEESE = {
  width: 400,
  height: 300,
  fps: 24,
  frameCount: 151,
  duration: (151 / 24) * 1000,
  activeStartFrame: 17,
  activeFrameCount: 118,
  columns: 5,
  framesPerSheet: 40,
} as const;

export type TasteOrigin = { x: number; y: number };

const urls = [sheet0, sheet1, sheet2, sheet3];
let cached: Promise<HTMLImageElement[]> | undefined;

/** Shared asset decode across animation runs. */
export function loadCheeseFrames(): Promise<HTMLImageElement[]> {
  if (!cached) {
    cached = Promise.all(urls.map(url => new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Unable to load the cheese animation frames."));
      image.src = url;
    }))).catch((error: unknown) => {
      cached = undefined;
      throw error;
    });
  }
  return cached;
}

export function drawCheeseFrame(
  ctx: CanvasRenderingContext2D,
  sheets: HTMLImageElement[],
  frameIndex: number,
  width: number,
  height: number,
  options: { backdrop: boolean; scale: number; origin?: TasteOrigin; opacityBoost?: number },
) {
  const index = Math.max(0, Math.min(CHEESE.frameCount - 1, Math.floor(frameIndex)));
  const sheetIndex = Math.floor(index / CHEESE.framesPerSheet);
  const cell = index % CHEESE.framesPerSheet;
  const scale = Math.min(width / CHEESE.width, height / CHEESE.height) * options.scale;
  const frameWidth = CHEESE.width * scale;
  const frameHeight = CHEESE.height * scale;
  const origin = options.origin ?? { x: width / 2, y: height / 2 };
  const x = options.origin ? Math.max(0, Math.min(width - frameWidth, origin.x - frameWidth / 2)) : (width - frameWidth) / 2;
  const y = options.origin ? Math.max(0, Math.min(height - frameHeight, origin.y - frameHeight / 2)) : (height - frameHeight) / 2;

  ctx.clearRect(0, 0, width, height);
  if (options.backdrop) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(
    sheets[sheetIndex],
    (cell % CHEESE.columns) * CHEESE.width,
    Math.floor(cell / CHEESE.columns) * CHEESE.height,
    CHEESE.width,
    CHEESE.height,
    x,
    y,
    frameWidth,
    frameHeight,
  );
  if (options.opacityBoost) {
    ctx.globalAlpha = Math.min(1, Math.max(0, options.opacityBoost));
    ctx.drawImage(
      sheets[sheetIndex],
      (cell % CHEESE.columns) * CHEESE.width,
      Math.floor(cell / CHEESE.columns) * CHEESE.height,
      CHEESE.width,
      CHEESE.height,
      x,
      y,
      frameWidth,
      frameHeight,
    );
    ctx.globalAlpha = 1;
  }
}

export function drawReducedMotion(ctx: CanvasRenderingContext2D, width: number, height: number, progress: number) {
  const origin = { x: width / 2, y: height / 2 };
  ctx.clearRect(0, 0, width, height);
  const radius = Math.max(34, Math.min(width, height) * 0.12);
  const gradient = ctx.createRadialGradient(origin.x, origin.y, 0, origin.x, origin.y, radius);
  gradient.addColorStop(0, "#e8c77800");
  gradient.addColorStop(0.45, "#e8c77845");
  gradient.addColorStop(1, "#e8c77800");
  ctx.globalAlpha = Math.sin(Math.PI * Math.min(1, Math.max(0, progress)));
  ctx.fillStyle = gradient;
  ctx.fillRect(origin.x - radius, origin.y - radius, radius * 2, radius * 2);
  ctx.globalAlpha = 1;
}
