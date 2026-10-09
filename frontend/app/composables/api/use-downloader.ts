import { alert } from "~/composables/use-toast";
import { useGlobalI18n } from "~/composables/use-global-i18n";

export function useDownloader() {
  function download(url: string, filename: string) {
    useFetch(url, {
      method: "GET",
      responseType: "blob",
      onResponse({ response }) {
        if (!response.ok) {
          console.error("Download failed", response);
          const i18n = useGlobalI18n();
          alert.error(i18n.t("events.something-went-wrong"));
          return;
        }

        if (!(response._data instanceof Blob)) return;
        const url = window.URL.createObjectURL(response._data);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      },
    });
  }

  return download;
}
