export default defineNuxtPlugin((nuxtApp) => {
  const pileColumns = new Map<number, number>();
  const piledCheeses = new Set<HTMLImageElement>();
  const pileStartThreshold = 3;
  const pileExplosionThreshold = 18;
  let activeCheeses = 0;
  let pileMode = false;
  let pileClearTimer: ReturnType<typeof window.setTimeout> | undefined;

  function clearPile(explode = false) {
    if (pileClearTimer) {
      window.clearTimeout(pileClearTimer);
    }

    const cheesesToClear = [...piledCheeses];
    pileClearTimer = undefined;

    for (const piledCheese of cheesesToClear) {
      if (explode) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 140 + Math.random() * 160;
        const horizontalDistance = Math.round(Math.cos(angle) * distance);
        const verticalDistance = Math.round(Math.sin(angle) * distance);
        const burst = piledCheese.animate(
          [
            { transform: piledCheese.style.transform, opacity: 1 },
            { transform: `translateX(-50%) translate(${horizontalDistance}px, ${verticalDistance}px) rotate(${360 + Math.round(Math.random() * 360)}deg)`, opacity: 0 },
          ],
          { duration: 650, easing: "cubic-bezier(0.2, 0.75, 0.3, 1)", fill: "forwards" },
        );
        burst.onfinish = () => piledCheese.remove();
      } else {
        const fade = piledCheese.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, easing: "ease-out", fill: "forwards" });
        fade.onfinish = () => piledCheese.remove();
      }
    }

    piledCheeses.clear();
    pileColumns.clear();
    activeCheeses = 0;
    pileMode = false;
  }

  function schedulePileClear() {
    if (pileClearTimer) {
      window.clearTimeout(pileClearTimer);
    }

    pileClearTimer = window.setTimeout(() => {
      clearPile();
    }, 3000);
  }

  function dropCheese(event: MouseEvent) {
    const target = event.target;
    const interactiveTarget = target instanceof Element && target.closest(
      "a, button, input, textarea, select, option, label, summary, [contenteditable], [role='button'], [role='link'], [role='menuitem'], [tabindex]:not([tabindex='-1']), .v-btn, .v-list-item, .v-input",
    );

    if (localStorage.getItem("disable-cheese-drop") === "true" || interactiveTarget) {
      return;
    }

    const cheese = document.createElement("img");
    cheese.src = "/cheese.png";
    cheese.alt = "";
    cheese.setAttribute("aria-hidden", "true");
    cheese.style.cssText = [
      "position: fixed",
      `left: ${event.clientX}px`,
      `top: ${event.clientY}px`,
      "z-index: 9999",
      "width: 48px",
      "pointer-events: none",
      "transform: translate(-50%, -50%)",
    ].join(";");

    document.body.append(cheese);
    activeCheeses += 1;
    pileMode ||= activeCheeses >= pileStartThreshold;
    const shouldStack = pileMode;
    if (shouldStack) {
      schedulePileClear();
    }

    const horizontalOffset = Math.round((Math.random() - 0.5) * 180);
    const landingX = Math.min(Math.max(event.clientX + horizontalOffset, 24), window.innerWidth - 24);
    const column = Math.round(landingX / 30);
    const stackHeight = pileColumns.get(column) ?? 0;
    const landingBottom = -8 + Math.min(stackHeight, 7) * 24;
    if (shouldStack) {
      pileColumns.set(column, stackHeight + 1);
    }

    const gravity = 1100;
    const initialVerticalVelocity = -(220 + Math.random() * 100);
    const landingDistance = Math.max(window.innerHeight - event.clientY - landingBottom - 24, 0);
    const flightTime = (-initialVerticalVelocity + Math.sqrt(initialVerticalVelocity ** 2 + 2 * gravity * landingDistance)) / gravity;
    const initialHorizontalVelocity = (landingX - event.clientX) / flightTime;
    const spin = 360 + Math.round(Math.random() * 180);
    const startTime = performance.now();

    function settleCheese() {
      if (!pileMode) {
        cheese.remove();
        activeCheeses -= 1;
        return;
      }

      const finalStackHeight = shouldStack ? stackHeight : (pileColumns.get(column) ?? 0);
      const finalLandingBottom = shouldStack ? landingBottom : -8 + Math.min(finalStackHeight, 7) * 24;
      if (!shouldStack) {
        pileColumns.set(column, finalStackHeight + 1);
      }

      cheese.style.left = `${landingX}px`;
      cheese.style.top = "auto";
      cheese.style.bottom = `${finalLandingBottom}px`;
      cheese.style.transform = `translateX(-50%) rotate(${spin}deg)`;
      piledCheeses.add(cheese);
      if (piledCheeses.size >= pileExplosionThreshold) {
        clearPile(true);
      }
    }

    function animateCheese(timestamp: number) {
      const elapsed = (timestamp - startTime) / 1000;
      const horizontalDistance = initialHorizontalVelocity * elapsed;
      const verticalDistance = initialVerticalVelocity * elapsed + 0.5 * gravity * elapsed ** 2;
      const rotation = spin * Math.min(elapsed / flightTime, 1);

      cheese.style.transform = `translate(calc(-50% + ${horizontalDistance}px), calc(-50% + ${verticalDistance}px)) rotate(${rotation}deg)`;
      if (elapsed < flightTime) {
        window.requestAnimationFrame(animateCheese);
      } else {
        settleCheese();
      }
    }

    window.requestAnimationFrame(animateCheese);
  }

  document.addEventListener("click", dropCheese, true);
  nuxtApp.hook("app:beforeUnmount", () => {
    document.removeEventListener("click", dropCheese, true);
  });
});
