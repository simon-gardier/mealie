<template>
  <v-app v-if="ready" dark class="error-page d-flex justify-center align-center">
    <div class="error-page__content w-100">
      <v-card-title>
        <slot>
          <h1 class="mx-auto text-center">
            {{ error.statusCode === 404 ? $t("page.404-page-not-found") : $t("page.an-error-occurred") }}
          </h1>
        </slot>
      </v-card-title>
      <v-card-actions class="justify-center">
        <slot name="actions">
          <v-btn v-for="(button, index) in buttons" :key="index" nuxt :to="button.to" color="primary">
            <v-icon start>
              {{ button.icon }}
            </v-icon>
            {{ button.text }}
          </v-btn>
        </slot>
      </v-card-actions>
      <div class="d-flex justify-center w-100">
        <img src="/remy_error.png" alt="" class="remy-error-image">
      </div>
    </div>
  </v-app>
</template>

<script setup lang="ts">
import { useGlobalI18n } from "~/composables/use-global-i18n";

const props = defineProps({
  error: {
    type: Object,
    default: null,
  },
});

const i18n = useGlobalI18n();
const auth = useMealieAuth();
const { $globals } = useNuxtApp();
const ready = ref(false);

const route = useRoute();
const router = useRouter();

async function insertGroupSlugIntoRoute() {
  const groupSlug = ref(auth.user.value?.groupSlug);
  if (!groupSlug.value) {
    return;
  }

  let replaceRoute = false;
  let routeVal = route.fullPath || "/";
  if (routeVal[0] !== "/") {
    routeVal = `/${routeVal}`;
  }

  // replace "recipe" in URL with "r"
  if (routeVal.includes("/recipe/")) {
    replaceRoute = true;
    routeVal = routeVal.replace("/recipe/", "/r/");
  }

  // insert groupSlug into URL
  const routeComponents = routeVal.split("/");
  if (routeComponents.length < 2 || routeComponents[1].toLowerCase() !== "g") {
    replaceRoute = true;
    routeVal = `/g/${groupSlug.value}${routeVal}`;
  }

  if (replaceRoute) {
    await router.replace(routeVal);
  }
}

async function handle404() {
  const normalizedRoute = route.fullPath.replace(/\/$/, "");
  const newRoute = normalizedRoute.replace(/^\/group\/(mealplan|members|notifiers|webhooks)(\/.*)?$/, "/household/$1$2");

  if (newRoute !== normalizedRoute) {
    await router.replace(newRoute);
  }
  else {
    await insertGroupSlugIntoRoute();
  }

  ready.value = true;
}

if (props.error.statusCode === 404) {
  handle404();
}
else {
  ready.value = true;
}

useSeoMeta({
  title:
    props.error.statusCode === 404
      ? (i18n.t("page.404-not-found") as string)
      : (i18n.t("page.an-error-occurred") as string),
});

const buttons = [
  { icon: $globals.icons.home, to: "/", text: i18n.t("general.home") },
];
</script>

<style scoped>
h1 {
  font-size: 20px;
}

.error-page__content {
  flex: 0 1 auto;
}

.remy-error-image {
  width: min(100%, 420px);
  height: auto;
  max-height: 60vh;
  object-fit: contain;
}
</style>
