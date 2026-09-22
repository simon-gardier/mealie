export default defineNuxtPlugin((nuxtApp) => {
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

    const animation = cheese.animate(
      [
        { transform: "translate(-50%, -50%) rotate(0deg)", opacity: 1 },
        { transform: `translate(-50%, ${window.innerHeight - event.clientY + 100}px) rotate(420deg)`, opacity: 0 },
      ],
      {
        duration: 1800,
        easing: "cubic-bezier(0.25, 0.65, 0.5, 1)",
      },
    );

    animation.onfinish = () => cheese.remove();
  }

  document.addEventListener("click", dropCheese, true);
  nuxtApp.hook("app:beforeUnmount", () => {
    document.removeEventListener("click", dropCheese, true);
  });
});
