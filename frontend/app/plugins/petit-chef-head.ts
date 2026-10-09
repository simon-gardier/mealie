export default defineNuxtPlugin(() => {
  useHead({
    titleTemplate: title => title && title !== "Petit Chef" ? `${title} · Petit Chef` : "Petit Chef",
  });
});
