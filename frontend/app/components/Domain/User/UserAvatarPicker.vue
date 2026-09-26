<template>
  <div class="d-flex flex-column align-center">
    <v-avatar size="96" class="mb-2">
      <v-img :src="previewUrl" alt="avatar preview" />
    </v-avatar>

    <div class="d-flex flex-wrap justify-center" style="gap: 0.5rem; max-width: 420px;">
      <v-avatar v-for="name in presetAvatars" :key="name" size="56" class="avatar-option"
        :class="{ 'avatar-option--selected': !localFileUrl && modelValue === name }" style="cursor: pointer;"
        @click="selectPreset(name)">
        <v-img :src="getPresetAvatarUrl(name)" :alt="name" />
      </v-avatar>
    </div>

    <AppButtonUpload class="mt-3" file-name="profile" accept="image/*" :post="!!userId"
      :url="userId ? `/api/users/${userId}/image` : ''" :text="$t('user-registration.upload-from-device')"
      @uploaded="onUploaded" />
  </div>
</template>

<script setup lang="ts">
import AppButtonUpload from "~/components/global/AppButtonUpload.vue";
import { useAvatars } from "~/composables/use-avatars";
import { useUserApi } from "~/composables/api";

const props = defineProps({
  modelValue: {
    type: String as () => string | null,
    default: null,
  },
  // If provided, changes are applied immediately against this existing user
  userId: {
    type: String as () => string | null,
    default: null,
  },
});

const emit = defineEmits<{
  (e: "update:modelValue", value: string | null): void;
  (e: "update:file", value: File | null): void;
  (e: "uploaded"): void;
}>();

const api = useUserApi();
const auth = useMealieAuth();
const { presetAvatars, defaultAvatar, getPresetAvatarUrl } = useAvatars();

const localFileUrl = ref<string | null>(null);

const previewUrl = computed(() => {
  if (localFileUrl.value) {
    return localFileUrl.value;
  }
  if (props.userId) {
    const key = auth.user.value?.cacheKey ?? "";
    return `/api/media/users/${props.userId}/profile.webp?cacheKey=${key}`;
  }
  return getPresetAvatarUrl(props.modelValue ?? defaultAvatar);
});

function selectPreset(name: string) {
  if (localFileUrl.value) {
    URL.revokeObjectURL(localFileUrl.value);
    localFileUrl.value = null;
  }
  emit("update:file", null);
  emit("update:modelValue", name);

  if (props.userId) {
    api.users.setAvatarImage(props.userId, name).then(() => emit("uploaded"));
  }
}

async function onUploaded(payload: unknown) {
  if (props.userId) {
    // Upload already happened via AppButtonUpload's post request
    emit("uploaded");
    return;
  }

  // Registration flow: no user yet, just capture the file locally for later upload
  const file = Array.isArray(payload) ? payload[0] : payload;
  if (!(file instanceof File)) {
    return;
  }

  if (localFileUrl.value) {
    URL.revokeObjectURL(localFileUrl.value);
  }

  localFileUrl.value = URL.createObjectURL(file);
  emit("update:modelValue", null);
  emit("update:file", file);
}
</script>

<style scoped>
.avatar-option {
  border: 2px solid transparent;
}

.avatar-option--selected {
  border-color: rgb(var(--v-theme-primary));
}
</style>
