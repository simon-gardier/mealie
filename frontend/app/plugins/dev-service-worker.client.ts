export async function unregisterDevWorker(baseURL: URL, serviceWorker: Pick<ServiceWorkerContainer, "getRegistrations">) {
  const registrations = await serviceWorker.getRegistrations();
  for (const registration of registrations) {
    if (registration.scope !== baseURL.href) continue;
    const worker = registration.active ?? registration.waiting ?? registration.installing;
    if (!worker) continue;
    const scriptURL = new URL(worker.scriptURL);
    const scriptPath = scriptURL.pathname.slice(baseURL.pathname.length);
    if (scriptURL.origin === baseURL.origin && /^(?:dev-)?sw\.js$/.test(scriptPath)) {
      await registration.unregister();
    }
  }
}

export default defineNuxtPlugin(async () => {
  if (!import.meta.dev || !("serviceWorker" in navigator)) return;
  try {
    await unregisterDevWorker(new URL(useRuntimeConfig().app.baseURL, window.location.origin), navigator.serviceWorker);
  }
  catch (error) {
    console.warn("Unable to unregister the development service worker", error);
  }
});
