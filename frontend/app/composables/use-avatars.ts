// Preset avatar names bundled with the backend (mealie/assets/avatars).
// Keep this list in sync with mealie.assets.avatars.AVATARS.
export const PRESET_AVATARS = [
  "chef",
  "colette",
  "django",
  "ego",
  "emile",
  "linguini",
  "remy",
  "skinner",
] as const;

export const DEFAULT_AVATAR = "emile";

export function useAvatars() {
  function getPresetAvatarUrl(name: string) {
    return `/api/media/avatars/${name}`;
  }

  return {
    presetAvatars: PRESET_AVATARS,
    defaultAvatar: DEFAULT_AVATAR,
    getPresetAvatarUrl,
  };
}
